const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const mongoose = require("mongoose");
const buyingModel = require("./model");
const ticketModel = require("../tickets/model");
const packageModel = require("../packges/model");
const guestModel = require("../guests/model");
const LoyaltySettings = require("../loyalty/model");
const { readPaymentAccounts } = require("../paymentAccounts/services");
const { verifyToken } = require("../../utils/token");
const { itemTitlePair, zoneSnapshot } = require("../../utils/bilingualSnapshot");
const { createAndEmitNotification } = require("../notifications/services");
const { OrderError, wholeQty, currentPrice, round2, sendOrderError } = require("../../utils/orderPricing");

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
// A points-paid order stores what it cost in totalPoints. If that order is cancelled or its payment fails,
// the points go back to the buyer exactly once: the flag is claimed first by a conditional update, so
// repeated cancel/reject calls (or two at once) cannot refund twice.
const refundPointsOrder = async (buyingId) => {
    const claimed = await buyingModel.findOneAndUpdate(
        { _id: buyingId, paymentMethod: "points", pointsRefunded: { $ne: true }, guest: { $ne: null }, totalPoints: { $gt: 0 } },
        { pointsRefunded: true },
        { new: true }
    );
    if (!claimed) return 0;
    try {
        await guestModel.findByIdAndUpdate(claimed.guest, { $inc: { points: claimed.totalPoints } });
    } catch (err) {
        await buyingModel.findByIdAndUpdate(claimed._id, { pointsRefunded: false });
        throw err;
    }
    return claimed.totalPoints;
};

// Take back points an order had earned (cash / transfer orders). Never goes below zero.
const revokeEarnedPoints = (guestId, amount) =>
    guestModel.findByIdAndUpdate(guestId, [
        { $set: { points: { $max: [0, { $subtract: [{ $ifNull: ["$points", 0] }, amount] }] } } }
    ]);

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

const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ""));

// Resolves one ordered item to the document it really is: { kind: "ticket" | "package", doc } or null.
// A real id is looked up in BOTH collections (the list the cart sent it in is only a hint), so an
// Adventure / Challenge pass (stored as a ticket) that an older cart sent as a package still orders
// that pass, and never "any other item". Only ids that are not real ids (older slug / title carts)
// fall back to a slug or title match. There is no "first item in the database" fallback: an item that
// does not exist (deleted) is not found.
const resolveOrderedItem = async (item, hint) => {
    const field = hint === "ticket" ? item.ticket : item.package;
    const rawId = field || item.id || item._id;
    const models = hint === "ticket"
        ? [["ticket", ticketModel], ["package", packageModel]]
        : [["package", packageModel], ["ticket", ticketModel]];

    if (isObjectId(rawId)) {
        for (const [kind, model] of models) {
            const doc = await model.findById(String(rawId));
            if (doc) return { kind, doc };
        }
        return null;
    }

    // Older carts: a zone slug (tickets only), then an exact title match
    const zone = SLUG_ZONE_MAP[rawId] || SLUG_ZONE_MAP[item.zone];
    if (zone && hint === "ticket") {
        const doc = await ticketModel.findOne({ page: zone });
        if (doc) return { kind: "ticket", doc };
    }
    const searchTitle = item.title || item.name || rawId;
    if (searchTitle && typeof searchTitle === "string") {
        const exact = { $regex: `^${escapeRegex(searchTitle.trim())}$`, $options: "i" };
        for (const [kind, model] of models) {
            const doc = await model.findOne({ $or: [{ title: exact }, { titleAr: exact }, { titleEn: exact }] });
            if (doc) return { kind, doc };
        }
    }
    return null;
};

// @desc Stream one payment receipt image (admin / cashier only; route is protected)
// @route GET /api/buying/payment-proof/:file
const getPaymentProof = (req, res) => {
    const file = req.params.file;
    if (!/^receipt-\d+-\d+\.jpeg$/.test(file)) {
        return res.status(400).json({ success: false, message: "Invalid file name" });
    }
    const full = path.resolve("upload", "payments", file);
    if (!fs.existsSync(full)) {
        return res.status(404).json({ success: false, message: "Payment proof not found" });
    }
    res.set("Cache-Control", "private, no-store");
    return res.sendFile(full);
};

// @desc Get official payment accounts (InstaPay, Vodafone Cash, Cash rules)
// @route GET /api/buying/payment-accounts
// @access Public
const getPaymentAccounts = async (req, res, next) => {
    try {
        // The accounts come only from the admin "Payment Accounts" setting. A method whose account is not set is
        // left out (no default, no environment value, no built-in number), so the site hides it.
        const saved = await readPaymentAccounts();

        const accounts = {
            cash: {
                method: "cash",
                titleAr: "الدفع نقداً عند الوصول (Cash at Gate)",
                titleEn: "Pay Cash upon Arrival",
                instructionsAr: "ادفع كاش على الوصول عند الوصول للمنتزه لاستلام تذكرة وإسورة الدخول الورقية.",
                instructionsEn: "Pay cash at the ticket desk upon arrival to receive your physical wristband/ticket pass."
            }
        };

        if (saved.instapayAddress) {
            accounts.instapay = {
                method: "instapay",
                titleAr: "إنستاباي (InstaPay)",
                titleEn: "InstaPay Direct IPA",
                accountAddress: saved.instapayAddress,
                ...(saved.instapayName ? { recipientName: saved.instapayName } : {}),
                instructionsAr: "افتح تطبيق إنستاباي، حول المبلغ المطلوب بدقة لعنوان الدفع اللحظي، ثم التقط صورة للإيصال وارفعها.",
                instructionsEn: "Open your InstaPay app, transfer the exact amount to the IPA address, and upload the transfer receipt screenshot."
            };
        }

        if (saved.vodafoneNumber) {
            accounts.vodafone_cash = {
                method: "vodafone_cash",
                titleAr: "فودافون كاش (Vodafone Cash)",
                titleEn: "Vodafone Cash Wallet",
                walletNumber: saved.vodafoneNumber,
                ...(saved.vodafoneName ? { recipientName: saved.vodafoneName } : {}),
                instructionsAr: "حول المبلغ المطلوب إلى رقم المحفظة عبر تطبيق أنا فودافون أو كود *9#، ثم ارفع صورة الإيصال.",
                instructionsEn: "Transfer the exact amount to our wallet via Ana Vodafone or *9#, then upload the receipt screenshot."
            };
        }

        return res.status(200).json({
            success: true,
            data: accounts,
            accounts
        });
    } catch (error) {
        return next(error);
    }
};
// @desc Buy tickets and/or packages
// @route POST /api/buying
// @access Public / Private
// Both-language name and zone of an ordered ticket / package, copied into the order
const snapshotOf = (item, doc) => {
    const t = itemTitlePair(item, doc);
    return { titleAr: t.ar, titleEn: t.en, ...zoneSnapshot(doc) };
};

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

        // The buyer is only ever the user the Bearer token identifies. A guest id or phone in the
        // request body is contact text, never an identity: it is not looked up, not linked to the
        // order and can never earn or spend anyone's points.
        let resolvedGuest = null;
        let finalGuestName = reqGuestName || "";
        let finalGuestPhone = reqGuestPhone || "";

        if (!req.guest && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = verifyToken(token);
                if (decoded && decoded.id) {
                    req.guest = await guestModel.findById(decoded.id);
                }
            } catch (e) {}
        }

        if (req.guest) {
            resolvedGuest = req.guest;
            finalGuestName = finalGuestName || req.guest.name;
            finalGuestPhone = finalGuestPhone || req.guest.phone;
        }

        // Resolve every ordered item (ticket list first, then package list) to the item it really is
        const validatedTickets = [];
        const validatedPackages = [];
        // Price, points and totals come from the database document only. Whatever the client sent
        // (priceEgp, unitPrice, totalPrice, pricePts, discounts) is ignored; only the quantity is read.
        const addLine = (item, resolved) => {
            const qty = wholeQty(item.quantity ?? item.qty, { fallback: 1 });
            const { kind, doc } = resolved;
            if (doc.active === false) {
                throw new OrderError(`هذا العنصر غير متاح للحجز حالياً: ${doc.titleAr || doc.title || ""}`.trim(), 409);
            }
            const unitPrice = currentPrice(doc);
            const line = {
                title: doc.title || (kind === "ticket" ? "تذكرة دخول ألعاب" : "باقة ألعاب"),
                ...snapshotOf(item, doc),
                quantity: qty,
                unitPrice,
                totalPrice: round2(unitPrice * qty),
                pointsGets: (Number(doc.pointsGets) || 0) * qty
            };
            if (kind === "ticket") validatedTickets.push({ ticket: doc._id, ...line });
            else validatedPackages.push({ package: doc._id, ...line });
        };

        for (const [list, hint] of [[tickets, "ticket"], [packages, "package"]]) {
            if (!Array.isArray(list)) continue;
            for (const item of list) {
                const resolved = await resolveOrderedItem(item, hint);
                if (!resolved) {
                    const missing = (hint === "ticket" ? item.ticket : item.package) || item.id || item.title || "غير معروف";
                    return res.status(404).json({
                        success: false,
                        message: hint === "ticket"
                            ? `لم نتمكن من العثور على التذكرة المطلوبة: ${missing}`
                            : `لم نتمكن من العثور على الباقة المطلوبة: ${missing}`
                    });
                }
                addLine(item, resolved);
            }
        }

        // Calculate Totals
        const totalTicketsPrice = validatedTickets.reduce((sum, t) => sum + t.totalPrice, 0);
        const totalPackagesPrice = validatedPackages.reduce((sum, p) => sum + p.totalPrice, 0);
        const totalPrice = round2(totalTicketsPrice + totalPackagesPrice);

        const totalTicketsPoints = validatedTickets.reduce((sum, t) => sum + t.pointsGets, 0);
        const totalPackagesPoints = validatedPackages.reduce((sum, p) => sum + p.pointsGets, 0);

        // Retrieve Admin configured loyalty settings (conversion rates & rules)
        const loyaltySettings = await LoyaltySettings.getSettings();

        // Calculate points required if paying with points, OR points earned if paying with money
        let totalPoints = 0;
        let pointsCharged = 0; // points already taken from the buyer for this order (refunded if the order cannot be saved)
        let guestLatestPoints = undefined; // the buyer's balance after this order

        if (paymentMethod === "points") {
            if (!loyaltySettings.isEnabled) {
                return res.status(400).json({
                    success: false,
                    message: "نظام الدفع بنقاط الولاء معطل حالياً من قبل الإدارة"
                });
            }

            // Points required = Total order price in EGP * conversion rate set by Admin (pointsPerEgp)
            totalPoints = Math.round(totalPrice * (loyaltySettings.pointsPerEgp || 10));

            // Points can only be spent by the logged-in user the token identifies
            if (!resolvedGuest) {
                return res.status(401).json({
                    success: false,
                    message: "يجب تسجيل الدخول لإتمام الدفع برصيد النقاط"
                });
            }

            const currentBalance = Number(resolvedGuest.points) || 0;
            if (currentBalance < (loyaltySettings.minRedeemPoints || 0)) {
                return res.status(400).json({
                    success: false,
                    message: `الحد الأدنى لاستخدام النقاط هو ${loyaltySettings.minRedeemPoints} نقطة. رصيدك الحالي: ${currentBalance} نقطة`
                });
            }

            // One conditional update: it only succeeds while the balance still covers the order, so two
            // simultaneous orders can never take the balance below zero.
            const charged = await guestModel.findOneAndUpdate(
                { _id: resolvedGuest._id, points: { $gte: totalPoints } },
                { $inc: { points: -totalPoints } },
                { new: true }
            );
            if (!charged) {
                const fresh = await guestModel.findById(resolvedGuest._id).select("points").lean();
                return res.status(400).json({
                    success: false,
                    message: `رصيد النقاط الحالي غير كافٍ. المطلوب: ${totalPoints} نقطة (حسب تسعير ${loyaltySettings.pointsPerEgp} نقطة لكل 1 ج.م)، ورصيدك الحالي: ${Number(fresh?.points) || 0} نقطة`
                });
            }
            pointsCharged = totalPoints;
            guestLatestPoints = charged.points;
        } else {
            // Paying with money/cash/instapay -> Guest earns reward points based on Admin's pointsEarnedPerEgp rate
            const calculatedEarned = Math.round(totalPrice * (loyaltySettings.pointsEarnedPerEgp !== undefined ? loyaltySettings.pointsEarnedPerEgp : 1));
            const itemsEarned = totalTicketsPoints + totalPackagesPoints;
            totalPoints = calculatedEarned > 0 ? calculatedEarned : itemsEarned;
        }

        // Credit earned points to the guest upon placing order
        let pointsAwarded = false;
        if (paymentMethod !== "points" && totalPoints > 0 && resolvedGuest) {
            const updatedGuest = await guestModel.findByIdAndUpdate(
                resolvedGuest._id,
                { $inc: { points: totalPoints } },
                { new: true }
            );
            if (updatedGuest) {
                pointsAwarded = true;
                guestLatestPoints = updatedGuest.points;
            }
        }

        // Auto-determine paymentStatus based on method & receipt presence
        // A client may only ask for "pending" / "pending_verification"; "paid" is set by the server (points) or by staff
        let finalPaymentStatus = ["pending", "pending_verification"].includes(paymentStatus) ? paymentStatus : undefined;
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

        // Create buying record. If it cannot be saved after the points were taken, give them back.
        let newBuying;
        try {
            // Generate human-friendly QR order code (PZ-XXXXXX)
            const orderCode = await generateOrderCode();
            newBuying = await buyingModel.create({
                orderCode,
                guest: resolvedGuest ? resolvedGuest._id : undefined,
                guestName: finalGuestName || "عميل مميز",
                guestPhone: finalGuestPhone,
                senderAccount: finalSenderAccount,
                tickets: validatedTickets,
                packages: validatedPackages,
                totalPrice,
                totalPoints,
                pointsAwarded,
                paymentMethod,
                paymentStatus: finalPaymentStatus,
                paymentProof: paymentProof || undefined,
                status: "confirmed",
                used: false,
                notes
            });
        } catch (createError) {
            if (pointsCharged > 0) {
                await guestModel.findByIdAndUpdate(resolvedGuest._id, { $inc: { points: pointsCharged } });
            }
            throw createError;
        }

        // Populate references
        const populatedBuying = await buyingModel.findById(newBuying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        // Broadcast real-time notification to dashboard
        try {
            await createAndEmitNotification({
                title: "طلب تذاكر وباقات جديد!",
                message: `طلب جديد رقم #${newBuying.orderCode} للعميل ${finalGuestName || "عميل مميز"} بقيمة ${totalPrice} ج.م`,
                type: "playzone_order",
                orderCode: newBuying.orderCode,
                orderId: newBuying._id,
                orderModelRef: "Buying",
                customerName: finalGuestName || "عميل مميز",
                customerPhone: finalGuestPhone || "",
                amount: totalPrice,
                metadata: {
                    order: populatedBuying,
                    ticketsCount: validatedTickets.length,
                    packagesCount: validatedPackages.length,
                    paymentMethod,
                    paymentStatus: finalPaymentStatus
                }
            });
        } catch (notifErr) {
            console.error("[createBuying] Notification error:", notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: finalPaymentStatus === "pending_verification"
                ? "تم إرسال الطلب وإيصال الدفع بنجاح، جاري مراجعة الإيصال من الإدارة وتأكيد التذكرة."
                : (paymentMethod === "cash"
                    ? "تم حجز التذكرة بنجاح! يرجى الدفع نقداً عند الوصول واستلام إسورة الدخول."
                    : "تمت عملية الشراء بنجاح!"),
            data: populatedBuying,
            buying: populatedBuying,
            pointsEarned: pointsAwarded ? totalPoints : 0,
            currentPoints: guestLatestPoints
        });
    } catch (error) {
        if (sendOrderError(res, error)) return;
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

            // Credit reward points to Guest if not credited yet (a points-paid order's totalPoints is what it cost, not what it earned)
            if (buying.guest && buying.paymentMethod !== "points" && buying.totalPoints > 0 && !buying.pointsAwarded) {
                await guestModel.findByIdAndUpdate(buying.guest, {
                    $inc: { points: buying.totalPoints }
                });
                buying.pointsAwarded = true;
            }
        } else if (action === "reject") {
            buying.paymentStatus = "failed";
            buying.status = "cancelled";
            buying.rejectionReason = rejectionReason || "تم رفض إيصال التحويل لعدم مطابقة البيانات أو وضوح الصورة";
            buying.paymentVerifiedAt = new Date();
            buying.verifiedBy = req.user ? req.user.name : "Admin";
            // If points were already credited on order placement, take them back (never below zero)
            if (buying.guest && buying.paymentMethod !== "points" && buying.totalPoints > 0 && buying.pointsAwarded) {
                await revokeEarnedPoints(buying.guest, buying.totalPoints);
                buying.pointsAwarded = false;
            }
            // A points-paid order that is rejected gets its points back
            await refundPointsOrder(buying._id);
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

        // Credit points to guest upon actual payment if not already credited
        if (buying.guest && buying.paymentMethod !== "points" && buying.totalPoints > 0 && !buying.pointsAwarded) {
            await guestModel.findByIdAndUpdate(buying.guest, {
                $inc: { points: buying.totalPoints }
            });
            buying.pointsAwarded = true;
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

        // Cancelled, failed or refunded: a points-paid order gives its points back (once)
        const closing = status === "cancelled" || ["failed", "refunded"].includes(paymentStatus);
        if (closing && await refundPointsOrder(buying._id)) {
            buying.pointsRefunded = true;
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
    getPaymentProof,
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
