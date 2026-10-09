const mongoose = require("mongoose");
const guestModel = require("./model");
const buyingModel = require("../buying/model");
const tripModel = require("../trips/model");
const eventModel = require("../events/model");
const bookingTableModel = require("../bookingTable/model");
const menuOrderModel = require("../menu/orderModel");

// ==========================================
// GUEST MANAGEMENT CRUD SERVICES
// ==========================================

// @desc create guest
// @route POST /api/guests
// @access Private
const createGuest = async (req, res, next) => {
    try {
        const guest = await guestModel.create(req.body);
        if (!guest) {
            return res.status(400).json({ success: false, message: "فشل إنشاء الضيف" });
        }
        res.status(201).json({ success: true, message: "تم إنشاء الضيف بنجاح", data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc get all guests
// @route GET /api/guests
// @access Private
const getAllGuests = async (req, res, next) => {
    try {
        const guests = await guestModel.find();
        res.status(200).json({ success: true, count: guests.length, data: guests });
    } catch (error) {
        next(error);
    }
};

// @desc get guest by id
// @route GET /api/guests/:id
// @access Private
const getGuestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findById(id);
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود" });
        }
        res.status(200).json({ success: true, data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc update guest
// @route PUT /api/guests/:id
// @access Private
const updateGuest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود للتعديل" });
        }
        res.status(200).json({ success: true, message: "تم تحديث بيانات الضيف بنجاح", data: guest });
    } catch (error) {
        next(error);
    }
};

// @desc delete guest
// @route DELETE /api/guests/:id
// @access Private
const deleteGuest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const guest = await guestModel.findByIdAndDelete(id);
        if (!guest) {
            return res.status(404).json({ success: false, message: "الضيف غير موجود للحذف" });
        }
        res.status(200).json({ success: true, message: "تم حذف الضيف بنجاح" });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GUEST FULL DOSSIER & TRANSACTIONS HISTORY
// ==========================================

// @desc Get complete guest dossier with all bookings, purchases, orders & financial ledger
// @route GET /api/guests/:id/full-history
// @route GET /api/guests/:id/history
// @route GET /api/guests/full-history?phone=...
// @access Private / Admin
const getGuestFullHistory = async (req, res, next) => {
    try {
        const rawTarget = req.params.id || req.query.id || req.query.guestId || req.query.phone || req.query.search || "";
        const target = typeof rawTarget === "string" ? rawTarget.trim() : String(rawTarget);

        if (!target) {
            return res.status(400).json({
                success: false,
                message: "يرجى تحديد معرف الضيف (ID) أو رقم هاتفه"
            });
        }

        const isMongoId = mongoose.Types.ObjectId.isValid(target) && target.length === 24;
        let guest = null;

        if (isMongoId) {
            guest = await guestModel.findById(target).lean();
        }

        if (!guest) {
            guest = await guestModel.findOne({
                $or: [
                    { phone: target },
                    { email: target.toLowerCase() }
                ]
            }).lean();
        }

        // Determine identifiers for querying relations
        const guestId = guest ? guest._id : (isMongoId ? new mongoose.Types.ObjectId(target) : null);
        const guestPhone = guest ? guest.phone : (target.match(/^[0-9+]+$/) ? target : null);

        // Build search conditions for each module
        const buyingFilter = [];
        const tripFilter = [];
        const eventFilter = [];
        const tableFilter = [];
        const orderFilter = [];

        if (guestId) {
            buyingFilter.push({ guest: guestId });
            tripFilter.push({ guest: guestId });
            eventFilter.push({ guest: guestId });
            tableFilter.push({ guest: guestId });
            orderFilter.push({ guest: guestId }, { user: guestId });
        }

        if (guestPhone) {
            buyingFilter.push({ guestPhone: guestPhone });
            tripFilter.push({ phone: guestPhone });
            eventFilter.push({ contactPhone: guestPhone });
            tableFilter.push({ guestPhone: guestPhone });
            orderFilter.push({ customerPhone: guestPhone });
        }

        // If no valid identifier exists to search collections
        if (buyingFilter.length === 0 && tripFilter.length === 0 && eventFilter.length === 0 && tableFilter.length === 0 && orderFilter.length === 0) {
            return res.status(404).json({
                success: false,
                message: "المعرف غير صالح ولم يتم العثور على أي ضيف مطابق"
            });
        }

        // Fetch all 5 modules in parallel
        const [purchases, trips, events, tables, menuOrders] = await Promise.all([
            buyingModel.find({ $or: buyingFilter })
                .populate("tickets.ticket")
                .populate("packages.package")
                .sort({ createdAt: -1 })
                .lean(),
            tripModel.find({ $or: tripFilter })
                .sort({ createdAt: -1 })
                .lean(),
            eventModel.find({ $or: eventFilter })
                .sort({ createdAt: -1 })
                .lean(),
            bookingTableModel.find({ $or: tableFilter })
                .sort({ createdAt: -1 })
                .lean(),
            menuOrderModel.find({ $or: orderFilter })
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // Check if guest or any transaction exists
        if (!guest && purchases.length === 0 && trips.length === 0 && events.length === 0 && tables.length === 0 && menuOrders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على أي بيانات أو معاملات مسجلة لهذا الضيف أو رقم الهاتف"
            });
        }

        // Detect guest name if unregistered customer with orders
        const detectedName = guest?.name ||
            purchases[0]?.guestName ||
            events[0]?.contactName ||
            trips[0]?.contactName ||
            menuOrders[0]?.customerName ||
            tables[0]?.guestName ||
            "ضيف غير مسجل";

        const guestProfile = guest ? {
            _id: guest._id,
            name: guest.name,
            phone: guest.phone,
            email: guest.email || null,
            age: guest.age || null,
            gender: guest.gender || null,
            role: guest.role || "guest",
            points: Number(guest.points) || 0,
            children: guest.children || [],
            isRegistered: true,
            createdAt: guest.createdAt,
            updatedAt: guest.updatedAt
        } : {
            _id: null,
            name: detectedName,
            phone: guestPhone,
            email: null,
            age: "غير محدد",
            gender: "غير محدد",
            role: "guest",
            points: 0,
            children: [],
            isRegistered: false,
            createdAt: purchases[0]?.createdAt || trips[0]?.createdAt || events[0]?.createdAt || menuOrders[0]?.createdAt || new Date()
        };

        // Financial calculations
        const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
        const totalTripsAmount = trips.reduce((sum, t) => sum + (Number(t.totalPrice) || 0), 0);
        const totalEventsAmount = events.reduce((sum, e) => sum + (Number(e.totalPrice) || 0), 0);
        const totalRestaurantAmount = menuOrders.reduce((sum, m) => sum + (Number(m.totalAmount) || 0), 0);
        const totalSpent = Number((totalPurchasesAmount + totalTripsAmount + totalEventsAmount + totalRestaurantAmount).toFixed(2));

        // Build normalized chronological ledger / timeline
        const timeline = [];

        // 1. Passes & Packages purchases
        purchases.forEach(p => {
            const ticketNames = (p.tickets || []).map(t => `${t.title || t.ticket?.title || 'تذكرة'} (x${t.quantity || 1})`).join('، ');
            const packageNames = (p.packages || []).map(pkg => `${pkg.title || pkg.package?.title || 'باقة'} (x${pkg.quantity || 1})`).join('، ');
            const itemsSummary = [ticketNames, packageNames].filter(Boolean).join(' + ') || 'شراء تذاكر / باقات';

            timeline.push({
                id: p._id,
                category: "passes",
                categoryAr: "شراء باقات وتذاكر PlayZone",
                categoryEn: "PlayZone Passes & Packages",
                code: p.orderCode,
                date: p.createdAt,
                amount: Number(p.totalPrice) || 0,
                currency: "EGP",
                status: p.status || "confirmed",
                paymentMethod: p.paymentMethod || "cash",
                paymentStatus: p.paymentStatus || "pending",
                title: itemsSummary,
                description: `طلب تذاكر وباقات برقم ${p.orderCode} بمبلغ ${p.totalPrice} ج.م`,
                raw: p
            });
        });

        // 2. School / Organization Trips
        trips.forEach(t => {
            timeline.push({
                id: t._id,
                category: "trips",
                categoryAr: "حجز رحلة مدرسية / مجموعة",
                categoryEn: "School & Group Trip Booking",
                code: t.bookingCode,
                date: t.createdAt,
                tripDate: t.tripDate,
                amount: Number(t.totalPrice) || 0,
                currency: t.currency || "EGP",
                status: t.status || "quote_generated",
                paymentMethod: "N/A",
                paymentStatus: t.status === "confirmed" ? "paid" : "pending",
                title: `${t.orgName || 'مدرسة/جهة'} — ${t.offerTitle || 'رحلة مدرسية'}`,
                description: `${t.studentsCount || 0} طالب + ${t.supervisorsCount || 0} مشرفين | تاريخ الرحلة: ${t.tripDate ? new Date(t.tripDate).toLocaleDateString('ar-EG') : 'غير محدد'}`,
                raw: t
            });
        });

        // 3. Events & Birthday Hall Bookings
        events.forEach(e => {
            const celebrantText = e.birthdayDetails?.celebrantName ? ` (عيد ميلاد: ${e.birthdayDetails.celebrantName})` : '';
            timeline.push({
                id: e._id,
                category: "events",
                categoryAr: "حجز قاعة / حفل عيد ميلاد",
                categoryEn: "Events & Celebration Hall Booking",
                code: e.bookingCode,
                date: e.createdAt,
                eventDate: e.eventDate,
                amount: Number(e.totalPrice) || 0,
                currency: "EGP",
                status: e.status || "inquiry",
                paymentMethod: e.depositProof ? "receipt_uploaded" : "N/A",
                paymentStatus: e.paymentStatus || "unpaid",
                title: `${e.spaceTitle || e.space || 'قاعة احتفالات'}${celebrantText}`,
                description: `${e.totalGuests || 0} فرد | الفترة: ${e.session || 'مسائية'} (${e.sessionTime || ''})`,
                raw: e
            });
        });

        // 4. Restaurant Table Bookings
        tables.forEach(tbl => {
            timeline.push({
                id: tbl._id,
                category: "tables",
                categoryAr: "حجز طاولة مطعم",
                categoryEn: "Restaurant Table Reservation",
                code: tbl.bookingCode || `TB-${tbl._id.toString().slice(-6).toUpperCase()}`,
                date: tbl.createdAt,
                reservationDate: tbl.date,
                amount: 0,
                currency: "EGP",
                status: tbl.status || "pending",
                paymentMethod: "on_arrival",
                paymentStatus: "N/A",
                title: `طاولة في منطقة: ${tbl.area || 'المطعم'}`,
                description: `عدد الأفراد: ${tbl.numberOfPerson || 1} فرد | الساعة: ${tbl.time || 'غير محدد'}`,
                raw: tbl
            });
        });

        // 5. Restaurant Orders & Food Delivery
        menuOrders.forEach(m => {
            const itemsSummary = (m.items || []).map(i => `${i.nameAr || i.nameEn || 'وجبة'} (x${i.quantity || 1})`).join('، ') || 'طلب وجبات مطعم';
            timeline.push({
                id: m._id,
                category: "restaurant",
                categoryAr: "طلب وجبات مطعم ودليفري",
                categoryEn: "Restaurant Food & Delivery Order",
                code: m.orderCode,
                date: m.createdAt,
                amount: Number(m.totalAmount) || 0,
                currency: "EGP",
                status: m.status || "pending",
                paymentMethod: m.paymentMethod || "cod",
                paymentStatus: m.paymentStatus || "pending",
                title: `${m.orderType === 'delivery' ? 'توصيل للمنزل' : 'وجبات مطعم'}: ${itemsSummary.slice(0, 50)}${itemsSummary.length > 50 ? '...' : ''}`,
                description: `العنوان: ${m.deliveryAddress || 'داخل المطعم'} | الإجمالي: ${m.totalAmount} ج.م`,
                raw: m
            });
        });

        // Sort timeline chronologically (latest first)
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Consolidated Summary
        const summary = {
            totalSpent,
            totalTransactionsCount: timeline.length,
            purchases: {
                count: purchases.length,
                totalAmount: Number(totalPurchasesAmount.toFixed(2))
            },
            trips: {
                count: trips.length,
                totalAmount: Number(totalTripsAmount.toFixed(2))
            },
            events: {
                count: events.length,
                totalAmount: Number(totalEventsAmount.toFixed(2))
            },
            tableReservations: {
                count: tables.length
            },
            restaurantOrders: {
                count: menuOrders.length,
                totalAmount: Number(totalRestaurantAmount.toFixed(2))
            },
            pointsBalance: guestProfile.points,
            firstActivityDate: timeline.length > 0 ? timeline[timeline.length - 1].date : null,
            lastActivityDate: timeline.length > 0 ? timeline[0].date : null
        };

        res.status(200).json({
            success: true,
            message: "تم جلب ملف الضيف الشامل وسجل المعاملات بنجاح",
            data: {
                guest: guestProfile,
                summary,
                timeline,
                purchases,
                trips,
                events,
                tableReservations: tables,
                restaurantOrders: menuOrders
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all guests with aggregated metrics & spending summaries (for Admin)
// @route GET /api/guests/summary
// @access Private / Admin
const getAllGuestsSummary = async (req, res, next) => {
    try {
        const guests = await guestModel.find().lean();
        const guestIds = guests.map(g => g._id);
        const guestPhones = guests.map(g => g.phone).filter(Boolean);

        const [purchasesAgg, tripsAgg, eventsAgg, ordersAgg] = await Promise.all([
            buyingModel.aggregate([
                { $match: { $or: [{ guest: { $in: guestIds } }, { guestPhone: { $in: guestPhones } }] } },
                { $group: { _id: "$guestPhone", total: { $sum: "$totalPrice" }, count: { $sum: 1 }, guestId: { $first: "$guest" } } }
            ]),
            tripModel.aggregate([
                { $match: { $or: [{ guest: { $in: guestIds } }, { phone: { $in: guestPhones } }] } },
                { $group: { _id: "$phone", total: { $sum: "$totalPrice" }, count: { $sum: 1 }, guestId: { $first: "$guest" } } }
            ]),
            eventModel.aggregate([
                { $match: { $or: [{ guest: { $in: guestIds } }, { contactPhone: { $in: guestPhones } }] } },
                { $group: { _id: "$contactPhone", total: { $sum: "$totalPrice" }, count: { $sum: 1 }, guestId: { $first: "$guest" } } }
            ]),
            menuOrderModel.aggregate([
                { $match: { $or: [{ guest: { $in: guestIds } }, { customerPhone: { $in: guestPhones } }] } },
                { $group: { _id: "$customerPhone", total: { $sum: "$totalAmount" }, count: { $sum: 1 }, guestId: { $first: "$guest" } } }
            ])
        ]);

        const statsMap = {};
        const addStats = (arr) => {
            arr.forEach(item => {
                const key = item._id || (item.guestId ? String(item.guestId) : null);
                if (!key) return;
                if (!statsMap[key]) {
                    statsMap[key] = { totalSpent: 0, totalCount: 0 };
                }
                statsMap[key].totalSpent += item.total || 0;
                statsMap[key].totalCount += item.count || 0;
            });
        };

        addStats(purchasesAgg);
        addStats(tripsAgg);
        addStats(eventsAgg);
        addStats(ordersAgg);

        const enrichedGuests = guests.map(g => {
            const phoneStats = statsMap[g.phone] || { totalSpent: 0, totalCount: 0 };
            const idStats = statsMap[String(g._id)] || { totalSpent: 0, totalCount: 0 };
            const totalSpent = Number((phoneStats.totalSpent + idStats.totalSpent).toFixed(2));
            const totalCount = phoneStats.totalCount + idStats.totalCount;

            return {
                ...g,
                totalSpent,
                totalTransactionsCount: totalCount
            };
        });

        // Sort by totalSpent descending
        enrichedGuests.sort((a, b) => b.totalSpent - a.totalSpent);

        res.status(200).json({
            success: true,
            count: enrichedGuests.length,
            data: enrichedGuests
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGuest,
    getAllGuests,
    getGuestById,
    updateGuest,
    deleteGuest,
    getGuestFullHistory,
    getAllGuestsSummary
};