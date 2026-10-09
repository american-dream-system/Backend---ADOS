const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mongoose = require("mongoose");
const buyingModel = require("./model");
const ticketModel = require("../tickets/model");
const packageModel = require("../packges/model");
const guestModel = require("../guests/model");

// @desc Middleware to resize and save uploaded payment receipt screenshot
const resizePaymentProofImage = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadDir = path.join("upload", "payments");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `receipt-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.jpeg`;
            await sharp(req.file.buffer)
                .resize(1200, 1200, {
                    fit: "inside",
                    withoutEnlargement: true
                })
                .toFormat("jpeg")
                .jpeg({ quality: 85 })
                .toFile(path.join(uploadDir, fileName));

            // Set web-accessible relative path
            req.body.paymentProof = `/payments/${fileName}`;
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Helper to generate unique order code (PZ-XXXXXX)
const generateOrderCode = async () => {
    let unique = false;
    let code = "";
    while (!unique) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        code = `PZ-${rand}`;
        const existing = await buyingModel.findOne({ orderCode: code });
        if (!existing) {
            unique = true;
        }
    }
    return code;
};

// Map of known frontend pass slugs to ticket zones
const SLUG_ZONE_MAP = {
    "pass-kids-area": "kidsArea",
    "pass-fun-park": "funZone",
    "pass-challenge": "challengeZone",
    "pass-adventure": "adventureZone",
    "kids-area": "kidsArea",
    "fun-park": "funZone",
    "challenge": "challengeZone",
    "adventure": "adventureZone",
    "kidsArea": "kidsArea",
    "funZone": "funZone",
    "challengeZone": "challengeZone",
    "adventureZone": "adventureZone"
};

// Helper to resolve a ticket document flexibly (ObjectId, Zone slug, or Title)
const resolveTicketDocument = async (item) => {
    const rawId = item.ticket || item.id || item._id;
    let ticketDoc = null;

    // 1. Try by ObjectId if valid
    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
        ticketDoc = await ticketModel.findById(rawId);
        if (ticketDoc) return ticketDoc;
    }

    // 2. Try by Zone slug mapping
    const targetZone = SLUG_ZONE_MAP[rawId] || SLUG_ZONE_MAP[item.zone];
    if (targetZone) {
        ticketDoc = await ticketModel.findOne({ page: targetZone });
        if (ticketDoc) return ticketDoc;
    }

    // 3. Try by title search
    const searchTitle = item.title || item.name || rawId;
    if (searchTitle && typeof searchTitle === "string") {
        ticketDoc = await ticketModel.findOne({
            title: { $regex: searchTitle.trim(), $options: "i" }
        });
        if (ticketDoc) return ticketDoc;
    }

    // 4. Fallback to any active ticket in the database
    ticketDoc = await ticketModel.findOne();
    return ticketDoc;
};

// Helper to resolve a package document flexibly
const resolvePackageDocument = async (item) => {
    const rawId = item.package || item.id || item._id;
    let packageDoc = null;

    if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
        packageDoc = await packageModel.findById(rawId);
        if (packageDoc) return packageDoc;
    }

    const searchTitle = item.title || item.name || rawId;
    if (searchTitle && typeof searchTitle === "string") {
        packageDoc = await packageModel.findOne({
            title: { $regex: searchTitle.trim(), $options: "i" }
        });
        if (packageDoc) return packageDoc;
    }

    packageDoc = await packageModel.findOne();
    return packageDoc;
};

// @desc Get official payment accounts (InstaPay, Vodafone Cash, Cash rules)
// @route GET /api/buying/payment-accounts
// @access Public
const getPaymentAccounts = async (req, res) => {
    const accounts = {
        instapay: {
            method: "instapay",
            titleAr: "إنستاباي (InstaPay)",
            titleEn: "InstaPay Direct IPA",
            accountAddress: process.env.INSTAPAY_IPA || "americandream@instapay",
            recipientName: "أمريكان دريم كيدز إيريا (American Dream)",
            instructionsAr: "افتح تطبيق إنستاباي، حول المبلغ المطلوب بدقة لعنوان الدفع اللحظي، ثم التقط صورة للإيصال وارفعها.",
            instructionsEn: "Open your InstaPay app, transfer the exact amount to the IPA address, and upload the transfer receipt screenshot."
        },
        vodafone_cash: {
            method: "vodafone_cash",
            titleAr: "فودافون كاش (Vodafone Cash)",
            titleEn: "Vodafone Cash Wallet",
            walletNumber: process.env.VODAFONE_CASH_NUMBER || "01023456789",
            recipientName: "أمريكان دريم كيدز إيريا",
            instructionsAr: "حول المبلغ المطلوب إلى رقم المحفظة عبر تطبيق أنا فودافون أو كود *9#، ثم ارفع صورة الإيصال.",
            instructionsEn: "Transfer the exact amount to our wallet via Ana Vodafone or *9#, then upload the receipt screenshot."
        },
        cash: {
            method: "cash",
            titleAr: "الدفع نقداً عند الوصول (Cash at Gate)",
            titleEn: "Pay Cash upon Arrival",
            instructionsAr: "ادفع كاش على الوصول عند الوصول للمنتزه لاستلام تذكرة وإسورة الدخول الورقية.",
            instructionsEn: "Pay cash at the ticket desk upon arrival to receive your physical wristband/ticket pass."
        }
    };

    return res.status(200).json({
        success: true,
        data: accounts,
        accounts
    });
};

// @desc Buy tickets and/or packages
// @route POST /api/buying
// @access Public / Private
const createBuying = async (req, res, next) => {
    try {
        let {
            guest: guestId,
            guestName: reqGuestName,
            guestPhone: reqGuestPhone,
            senderAccount,
            senderPhoneOrAccount,
            tickets = [],
            packages = [],
            paymentMethod = "cash",
            paymentStatus,
            paymentProof,
            moneyMethod,
            notes
        } = req.body;

        // Support multipart/form-data stringified fields
        if (typeof tickets === "string") {
            try { tickets = JSON.parse(tickets); } catch (e) { tickets = []; }
        }
        if (typeof packages === "string") {
            try { packages = JSON.parse(packages); } catch (e) { packages = []; }
        }

        if ((!tickets || tickets.length === 0) && (!packages || packages.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "عملية الشراء يجب أن تحتوي على تذكرة أو باقة واحدة على الأقل"
            });
        }

        // Harmonize paymentMethod
        if (paymentMethod === "money" && moneyMethod) {
            paymentMethod = moneyMethod === "instapay" ? "instapay" : "vodafone_cash";
        }

        // Final sender account
        const finalSenderAccount = senderAccount || senderPhoneOrAccount || "";

        // Resolve Guest details if provided or authenticated
        let resolvedGuest = null;
        let finalGuestName = reqGuestName || "";
        let finalGuestPhone = reqGuestPhone || "";

        if (req.guest) {
            resolvedGuest = req.guest;
            finalGuestName = finalGuestName || req.guest.name;
            finalGuestPhone = finalGuestPhone || req.guest.phone;
        } else if (guestId && mongoose.Types.ObjectId.isValid(guestId)) {
            resolvedGuest = await guestModel.findById(guestId);
            if (resolvedGuest) {
                finalGuestName = finalGuestName || resolvedGuest.name;
                finalGuestPhone = finalGuestPhone || resolvedGuest.phone;
            }
        } else if (finalGuestPhone) {
            resolvedGuest = await guestModel.findOne({ phone: finalGuestPhone });
        }

        // Process and validate Tickets
        const validatedTickets = [];
        if (Array.isArray(tickets) && tickets.length > 0) {
            for (const item of tickets) {
                const qty = Math.max(1, parseInt(item.quantity || item.qty) || 1);
                const ticketDoc = await resolveTicketDocument(item);

                if (!ticketDoc) {
                    return res.status(404).json({
                        success: false,
                        message: `لم نتمكن من العثور على التذكرة المطلوبة: ${item.ticket || item.id || item.title || "غير معروف"}`
                    });
                }

                const unitPrice = item.priceEgp !== undefined && item.priceEgp !== null
                    ? Number(item.priceEgp)
                    : (ticketDoc.priceAfterDiscount !== undefined && ticketDoc.priceAfterDiscount !== null
                        ? ticketDoc.priceAfterDiscount
                        : ticketDoc.price);

                const pointsUnit = item.pricePts !== undefined
                    ? Number(item.pricePts)
                    : (ticketDoc.pointsGets || 0);

                const lineTotal = unitPrice * qty;
                const linePoints = pointsUnit * qty;

                validatedTickets.push({
                    ticket: ticketDoc._id,
                    title: item.title || ticketDoc.title || "تذكرة دخول ألعاب",
                    quantity: qty,
                    unitPrice,
                    totalPrice: lineTotal,
                    pointsGets: linePoints
                });
            }
        }

        // Process and validate Packages
        const validatedPackages = [];
        if (Array.isArray(packages) && packages.length > 0) {
            for (const item of packages) {
                const qty = Math.max(1, parseInt(item.quantity || item.qty) || 1);
                const packageDoc = await resolvePackageDocument(item);

                if (!packageDoc) {
                    return res.status(404).json({
                        success: false,
                        message: `لم نتمكن من العثور على الباقة المطلوبة: ${item.package || item.id || item.title || "غير معروف"}`
                    });
                }

                const unitPrice = packageDoc.priceAfterDiscount !== undefined && packageDoc.priceAfterDiscount !== null
                    ? packageDoc.priceAfterDiscount
                    : packageDoc.price;
                const pointsUnit = packageDoc.pointsGets || 0;
                const lineTotal = unitPrice * qty;
                const linePoints = pointsUnit * qty;

                validatedPackages.push({
                    package: packageDoc._id,
                    title: item.title || packageDoc.title || "باقة ألعاب",
                    quantity: qty,
                    unitPrice,
                    totalPrice: lineTotal,
                    pointsGets: linePoints
                });
            }
        }

        // Calculate Totals
        const totalTicketsPrice = validatedTickets.reduce((sum, t) => sum + t.totalPrice, 0);
        const totalPackagesPrice = validatedPackages.reduce((sum, p) => sum + p.totalPrice, 0);
        const totalPrice = totalTicketsPrice + totalPackagesPrice;

        const totalTicketsPoints = validatedTickets.reduce((sum, t) => sum + t.pointsGets, 0);
        const totalPackagesPoints = validatedPackages.reduce((sum, p) => sum + p.pointsGets, 0);
        const totalPoints = totalTicketsPoints + totalPackagesPoints;

        // Auto-determine paymentStatus based on method & receipt presence
        let finalPaymentStatus = paymentStatus;
        if (!finalPaymentStatus) {
            if (paymentMethod === "points") {
                finalPaymentStatus = "paid";
            } else if (paymentMethod === "cash") {
                finalPaymentStatus = "pending";
            } else if (paymentMethod === "instapay" || paymentMethod === "vodafone_cash") {
                finalPaymentStatus = paymentProof ? "pending_verification" : "pending";
            } else {
                finalPaymentStatus = "pending";
            }
        }

        // Check and deduct points if paying with points
        if (paymentMethod === "points" && resolvedGuest) {
            if ((resolvedGuest.points || 0) < totalPoints) {
                return res.status(400).json({
                    success: false,
                    message: "رصيد النقاط الحالي غير كافٍ لإتمام عملية الشراء بهذه الطريقة"
                });
            }
            await guestModel.findByIdAndUpdate(resolvedGuest._id, {
                $inc: { points: -totalPoints }
            });
        }

        // Generate human-friendly QR order code (PZ-XXXXXX)
        const orderCode = await generateOrderCode();

        // Create buying record
        const newBuying = await buyingModel.create({
            orderCode,
            guest: resolvedGuest ? resolvedGuest._id : (guestId || undefined),
            guestName: finalGuestName || "عميل مميز",
            guestPhone: finalGuestPhone,
            senderAccount: finalSenderAccount,
            tickets: validatedTickets,
            packages: validatedPackages,
            totalPrice,
            totalPoints,
            paymentMethod,
            paymentStatus: finalPaymentStatus,
            paymentProof: paymentProof || undefined,
            status: "confirmed",
            used: false,
            notes
        });

        // Populate references
        const populatedBuying = await buyingModel.findById(newBuying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        return res.status(201).json({
            success: true,
            message: finalPaymentStatus === "pending_verification"
                ? "تم إرسال الطلب وإيصال الدفع بنجاح، جاري مراجعة الإيصال من الإدارة وتأكيد التذكرة."
                : (paymentMethod === "cash"
                    ? "تم حجز التذكرة بنجاح! يرجى الدفع نقداً عند الوصول لالوصول واستلام إسورة الدخول."
                    : "تمت عملية الشراء بنجاح!"),
            data: populatedBuying,
            buying: populatedBuying
        });
    } catch (error) {
        next(error);
    }
};

// @desc Upload or update payment proof for an existing purchase
// @route POST /api/buying/:id/proof or /api/buying/code/:code/proof
// @access Public / Guest
const uploadPaymentProof = async (req, res, next) => {
    try {
        const identifier = req.params.id || req.params.code;
        let buying = null;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            buying = await buyingModel.findById(identifier);
        }
        if (!buying) {
            buying = await buyingModel.findOne({ orderCode: identifier });
        }

        if (!buying) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على سجل الشراء المطلوب"
            });
        }

        const proofPath = req.body.paymentProof || (req.file ? req.file.path : null);
        if (!proofPath) {
            return res.status(400).json({
                success: false,
                message: "يرجى إرفاق صورة إيصال التحويل"
            });
        }

        buying.paymentProof = proofPath;
        if (req.body.senderAccount || req.body.senderPhoneOrAccount) {
            buying.senderAccount = req.body.senderAccount || req.body.senderPhoneOrAccount;
        }
        if (req.body.paymentMethod) {
            buying.paymentMethod = req.body.paymentMethod;
        }
        buying.paymentStatus = "pending_verification";
        await buying.save();

        const populated = await buyingModel.findById(buying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        return res.status(200).json({
            success: true,
            message: "تم رفع إيصال التحويل بنجاح، بانتظار مراجعة الكاشير وتأكيد الحجز",
            data: populated,
            buying: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc Admin verifies manual payment proof (Approve / Reject)
// @route PATCH /api/buying/:id/verify-payment
// @access Admin / Staff
const verifyPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, rejectionReason } = req.body;

        const buying = await buyingModel.findById(id);
        if (!buying) {
            return res.status(404).json({
                success: false,
                message: "سجل الشراء غير موجود"
            });
        }

        if (action === "approve") {
            buying.paymentStatus = "paid";
            buying.status = "confirmed";
            buying.paymentVerifiedAt = new Date();
            buying.verifiedBy = req.user ? req.user.name : "Admin";

            // Credit reward points to Guest if not credited yet
            if (buying.guest && buying.totalPoints > 0) {
                await guestModel.findByIdAndUpdate(buying.guest, {
                    $inc: { points: buying.totalPoints }
                });
            }
        } else if (action === "reject") {
            buying.paymentStatus = "failed";
            buying.status = "cancelled";
            buying.rejectionReason = rejectionReason || "تم رفض إيصال التحويل لعدم مطابقة البيانات أو وضوح الصورة";
            buying.paymentVerifiedAt = new Date();
            buying.verifiedBy = req.user ? req.user.name : "Admin";
        } else {
            return res.status(400).json({
                success: false,
                message: "إجراء غير صالح. الخيارات المتاحة: (approve, reject)"
            });
        }

        await buying.save();

        const populated = await buyingModel.findById(buying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        return res.status(200).json({
            success: true,
            message: action === "approve"
                ? "تم اعتماد إيصال الدفع بنجاح وتفعيل التذكرة"
                : "تم رفض إيصال التحويل وإلغاء الطلب",
            data: populated,
            buying: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc Admin marks cash collected at the gate/counter
// @route PATCH /api/buying/:id/mark-cash-collected
// @access Admin / Cashier
const markCashCollected = async (req, res, next) => {
    try {
        const { id } = req.params;
        const buying = await buyingModel.findById(id);

        if (!buying) {
            return res.status(404).json({
                success: false,
                message: "سجل الشراء غير موجود"
            });
        }

        buying.paymentStatus = "paid";
        buying.paymentVerifiedAt = new Date();
        buying.verifiedBy = req.user ? req.user.name : "Cashier";
        buying.notes = buying.notes
            ? `${buying.notes} | تم تحصيل النقدية على الوصول بنجاح`
            : "تم تحصيل النقدية على الوصول بنجاح";

        // Credit points to guest upon actual payment
        if (buying.guest && buying.totalPoints > 0) {
            await guestModel.findByIdAndUpdate(buying.guest, {
                $inc: { points: buying.totalPoints }
            });
        }

        await buying.save();

        const populated = await buyingModel.findById(buying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        return res.status(200).json({
            success: true,
            message: "تم تأكيد استلام النقدية على البوابة وتسليم التذكرة الورقية للضيف",
            data: populated,
            buying: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get orders pending verification (Admin Dashboard)
// @route GET /api/buying/pending-verification
// @access Admin / Staff
const getPendingVerifications = async (req, res, next) => {
    try {
        const pendingOrders = await buyingModel.find({
            paymentStatus: "pending_verification"
        })
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: pendingOrders.length,
            data: pendingOrders,
            orders: pendingOrders
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all purchases (supports pagination & filtering)
// @route GET /api/buying
// @access Public / Staff
const getAllBuyings = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const filter = {};
        if (req.query.guest) filter.guest = req.query.guest;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
        if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
        if (req.query.used !== undefined) filter.used = req.query.used === "true";
        if (req.query.orderCode) filter.orderCode = req.query.orderCode;

        let query = buyingModel.find(filter)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package")
            .sort({ createdAt: -1 });

        if (page && limit) {
            const skip = (page - 1) * limit;
            query = query.skip(skip).limit(limit);
        }

        const buyings = await query;
        const totalCount = await buyingModel.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: buyings.length,
            total: totalCount,
            data: buyings,
            buyings
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get purchase by ID
// @route GET /api/buying/:id
// @access Public / Staff
const getBuyingById = async (req, res, next) => {
    try {
        const buying = await buyingModel.findById(req.params.id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        if (!buying) {
            return res.status(404).json({ success: false, message: "Purchase record not found" });
        }

        res.status(200).json({
            success: true,
            data: buying,
            buying
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get purchase by QR / order code
// @route GET /api/buying/code/:code
// @access Public / Staff
const getBuyingByCode = async (req, res, next) => {
    try {
        const buying = await buyingModel.findOne({ orderCode: req.params.code })
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        if (!buying) {
            return res.status(404).json({ success: false, message: "Purchase record not found for this code" });
        }

        res.status(200).json({
            success: true,
            data: buying,
            buying
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all purchases for a specific guest
// @route GET /api/buying/guest/:guestId
// @access Public / Staff
const getBuyingsByGuest = async (req, res, next) => {
    try {
        const buyings = await buyingModel.find({ guest: req.params.guestId })
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: buyings.length,
            data: buyings,
            buyings
        });
    } catch (error) {
        next(error);
    }
};

// @desc Redeem / validate pass by ID or orderCode
// @route PATCH /api/buying/:id/redeem or PATCH /api/buying/code/:code/redeem
// @access Staff / Gatekeeper
const redeemBuying = async (req, res, next) => {
    try {
        const identifier = req.params.id || req.params.code;
        let buying = null;

        if (mongoose.Types.ObjectId.isValid(identifier)) {
            buying = await buyingModel.findById(identifier);
        }
        if (!buying) {
            buying = await buyingModel.findOne({ orderCode: identifier });
        }

        if (!buying) {
            return res.status(404).json({ success: false, message: "Purchase record not found" });
        }

        if (buying.used) {
            return res.status(400).json({
                success: false,
                message: "This pass has already been redeemed and used",
                usedAt: buying.usedAt,
                orderCode: buying.orderCode
            });
        }

        buying.used = true;
        buying.usedAt = new Date();
        buying.status = "completed";
        await buying.save();

        const populated = await buyingModel.findById(buying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        res.status(200).json({
            success: true,
            message: "Pass successfully verified and redeemed",
            data: populated,
            buying: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update purchase status or payment status
// @route PATCH /api/buying/:id/status
// @access Staff / Admin
const updateBuyingStatus = async (req, res, next) => {
    try {
        const { status, paymentStatus, notes } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (paymentStatus) updates.paymentStatus = paymentStatus;
        if (notes !== undefined) updates.notes = notes;

        const buying = await buyingModel.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        if (!buying) {
            return res.status(404).json({ success: false, message: "Purchase record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Purchase status updated successfully",
            data: buying,
            buying
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete / cancel purchase
// @route DELETE /api/buying/:id
// @access Staff / Admin
const deleteBuying = async (req, res, next) => {
    try {
        const buying = await buyingModel.findByIdAndDelete(req.params.id);
        if (!buying) {
            return res.status(404).json({ success: false, message: "Purchase record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Purchase record deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    resizePaymentProofImage,
    getPaymentAccounts,
    createBuying,
    uploadPaymentProof,
    verifyPayment,
    markCashCollected,
    getPendingVerifications,
    getAllBuyings,
    getBuyingById,
    getBuyingByCode,
    getBuyingsByGuest,
    redeemBuying,
    updateBuyingStatus,
    deleteBuying
};
