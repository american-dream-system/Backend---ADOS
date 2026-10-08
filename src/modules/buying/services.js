const buyingModel = require("./model");
const ticketModel = require("../tickets/model");
const packageModel = require("../packges/model");
const guestModel = require("../guests/model");

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

// @desc Buy tickets and/or packages
// @route POST /api/buying
// @access Public / Private
const createBuying = async (req, res, next) => {
    try {
        const {
            guest: guestId,
            guestName: reqGuestName,
            guestPhone: reqGuestPhone,
            tickets = [],
            packages = [],
            paymentMethod = "cash",
            paymentStatus = "pending",
            paymentProof,
            notes
        } = req.body;

        if ((!tickets || tickets.length === 0) && (!packages || packages.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "Purchase must contain at least one ticket or package"
            });
        }

        // Resolve Guest details if provided
        let resolvedGuest = null;
        let finalGuestName = reqGuestName || "";
        let finalGuestPhone = reqGuestPhone || "";

        if (guestId) {
            resolvedGuest = await guestModel.findById(guestId);
            if (resolvedGuest) {
                finalGuestName = finalGuestName || resolvedGuest.name;
                finalGuestPhone = finalGuestPhone || resolvedGuest.phone;
            }
        } else if (finalGuestPhone) {
            // Optional lookup if guest exists by phone
            resolvedGuest = await guestModel.findOne({ phone: finalGuestPhone });
        }

        // Process and validate Tickets
        const validatedTickets = [];
        if (Array.isArray(tickets) && tickets.length > 0) {
            for (const item of tickets) {
                const ticketId = item.ticket || item.id || item._id;
                const qty = Math.max(1, parseInt(item.quantity) || 1);

                const ticketDoc = await ticketModel.findById(ticketId);
                if (!ticketDoc) {
                    return res.status(404).json({
                        success: false,
                        message: `Ticket with ID '${ticketId}' not found`
                    });
                }

                const unitPrice = ticketDoc.priceAfterDiscount !== undefined && ticketDoc.priceAfterDiscount !== null
                    ? ticketDoc.priceAfterDiscount
                    : ticketDoc.price;
                const pointsUnit = ticketDoc.pointsGets || 0;
                const lineTotal = unitPrice * qty;
                const linePoints = pointsUnit * qty;

                validatedTickets.push({
                    ticket: ticketDoc._id,
                    title: ticketDoc.title,
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
                const packageId = item.package || item.id || item._id;
                const qty = Math.max(1, parseInt(item.quantity) || 1);

                const packageDoc = await packageModel.findById(packageId);
                if (!packageDoc) {
                    return res.status(404).json({
                        success: false,
                        message: `Package with ID '${packageId}' not found`
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
                    title: packageDoc.title,
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

        // Generate human-friendly QR order code
        const orderCode = await generateOrderCode();

        // Create buying record
        const newBuying = await buyingModel.create({
            orderCode,
            guest: resolvedGuest ? resolvedGuest._id : (guestId || undefined),
            guestName: finalGuestName,
            guestPhone: finalGuestPhone,
            tickets: validatedTickets,
            packages: validatedPackages,
            totalPrice,
            totalPoints,
            paymentMethod,
            paymentStatus,
            paymentProof,
            status: "confirmed",
            used: false,
            notes
        });

        // Credit points to Guest record if guest exists
        if (resolvedGuest && totalPoints > 0) {
            await guestModel.findByIdAndUpdate(resolvedGuest._id, {
                $inc: { points: totalPoints }
            });
        }

        // Populate references
        const populatedBuying = await buyingModel.findById(newBuying._id)
            .populate("guest")
            .populate("tickets.ticket")
            .populate("packages.package");

        res.status(201).json({
            success: true,
            message: "Purchase completed successfully",
            data: populatedBuying
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

        // Try find by MongoDB ID if valid ObjectId, else by orderCode
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
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
    createBuying,
    getAllBuyings,
    getBuyingById,
    getBuyingByCode,
    getBuyingsByGuest,
    redeemBuying,
    updateBuyingStatus,
    deleteBuying
};
