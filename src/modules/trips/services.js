const TripBooking = require("./model");
const Guest = require("../guests/model");
const { createAndEmitNotification } = require("../notifications/services");
const mongoose = require("mongoose");
const TripOffer = require("./offerModel");
const { mediaUrl, removeMediaFile } = require("../../utils/mediaFiles");
const { normalizeImagePath } = require("../../utils/mediaPath");
const { OrderError, wholeQty, round2, sendOrderError, MAX_STUDENTS } = require("../../utils/orderPricing");

// ---- Trip offers: stored in the database, edited from the admin. There are no built-in offers.

const serializeOffer = (o) => ({
    id: String(o._id),
    titleAr: o.titleAr,
    titleEn: o.titleEn,
    inclusionsAr: o.inclusionsAr || [],
    inclusionsEn: o.inclusionsEn || [],
    price: o.price,
    image: o.image ? mediaUrl(o.image) : "",
    minStudents: o.minStudents || 15,
    studentsPerSupervisor: o.studentsPerSupervisor || 15,
});

const listOffers = async () => {
    const offers = await TripOffer.find().sort({ order: 1, createdAt: 1 }).lean();
    return offers.map(serializeOffer);
};

// The offer by id, from the database; null for an unknown / malformed id
const findOffer = async (offerId) => {
    if (!offerId || !mongoose.isValidObjectId(String(offerId))) return null;
    return TripOffer.findById(String(offerId)).lean();
};

// Offer by id: a missing / unknown offer is refused, never replaced by another one
const offerOrFail = async (offerId) => {
    const offer = await findOffer(offerId);
    if (!offer) throw new OrderError("عرض الرحلة غير موجود", 404);
    return offer;
};
// Students: a whole number, at least the offer's minimum
const studentsOf = (value, minStudents = 15, fallback = minStudents) => {
    const n = wholeQty(value, { max: MAX_STUDENTS, label: "عدد الطلاب", fallback });
    if (n < minStudents) throw new OrderError(`أقل عدد للطلاب في هذا العرض هو ${minStudents} طالباً`, 400);
    return n;
};
// One free supervisor for every `studentsPerSupervisor` students, at least one
const freeSupervisorsOf = (students, studentsPerSupervisor = 15) => Math.max(1, Math.floor(students / (studentsPerSupervisor || 15)));
// Supervisors: a whole number 1..students
const supervisorsOf = (value, students) => wholeQty(value, { max: students, label: "عدد المشرفين" });
// Helper to generate unique quotation / booking code (AD-TRIP-XXXX)
const generateTripCode = async () => {
    let unique = false;
    let code = "";
    while (!unique) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        code = `AD-TRIP-${rand}`;
        const existing = await TripBooking.findOne({ bookingCode: code });
        if (!existing) {
            unique = true;
        }
    }
    return code;
};

// @desc Get available Trip Offers (exactly what the admin entered; empty when none)
// @route GET /api/trips/offers (or /packages)
// @access Public
const getTripOffers = async (req, res, next) => {
    try {
        const offers = await listOffers();
        return res.status(200).json({ success: true, count: offers.length, offers });
    } catch (error) {
        return next(error);
    }
};
// @desc Calculate Trip Cost and Supervisor complimentary ratio
// @route POST /api/trips/calculate
// @access Public
const calculateTripCost = async (req, res) => {
    try {
        const { offerId, students, isSupervisorsManual = false, supervisors } = req.body;
        const offer = await offerOrFail(offerId);
        const studentCount = studentsOf(students, offer.minStudents || 15);

        const freeSupervisors = freeSupervisorsOf(studentCount, offer.studentsPerSupervisor);
        let calculatedSupervisors = freeSupervisors;
        if (isSupervisorsManual && supervisors) {
            calculatedSupervisors = supervisorsOf(supervisors, studentCount);
        }

        const totalPrice = round2(studentCount * offer.price);

        return res.status(200).json({
            success: true,
            data: {
                offerId: String(offer._id),
                offerTitle: offer.titleEn,
                pricePerStudent: offer.price,
                students: studentCount,
                supervisors: calculatedSupervisors,
                freeSupervisors,
                totalPrice
            }
        });
    } catch (error) {
        if (sendOrderError(res, error)) return;
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Create Trip Quote / Booking
// @route POST /api/trips/quote (or POST /api/trips/book)
// @access Public / Authenticated
const createTripQuote = async (req, res) => {
    try {
        const {
            orgName,
            orgType = "School",
            contactName,
            phone,
            offerId,
            studentsCount,
            supervisorsCount,
            isSupervisorsManual = false,
            ageGroups = ["6-9", "10-12"],
            tripDate,
            shift = "morning",
            arrivalTime = "09:30 AM",
            quotationScreenshot = "",
            notes = "",
            status: requestedStatus,
            bookingCode: requestedCode
        } = req.body;

        if (!orgName || !contactName || !phone || !tripDate) {
            return res.status(400).json({
                success: false,
                message: "يرجى تعبئة جميع الحقول المطلوبة (اسم الجهة، اسم المنسق، رقم الهاتف، وتاريخ الرحلة)"
            });
        }

        // A client may only open a booking as a quote / inquiry; staff confirm it later
        const status = ["quote_generated", "inquiry", "pending"].includes(requestedStatus) ? requestedStatus : "quote_generated";
        // The price per student is the offer's price on the server; any price sent by the client is ignored
        const matchedOffer = await offerOrFail(offerId);
        const studentsNum = studentsOf(studentsCount, matchedOffer.minStudents || 15);
        const resolvedPrice = matchedOffer.price;
        // Both-language offer name kept with the booking, so it survives later offer edits or removal
        const offerPair = { ar: matchedOffer.titleAr, en: matchedOffer.titleEn };
        const resolvedTitle = matchedOffer.titleEn;

        // Calculate supervisors
        let finalSupervisors = supervisorsCount;
        if (!isSupervisorsManual || !finalSupervisors) {
            finalSupervisors = freeSupervisorsOf(studentsNum, matchedOffer.studentsPerSupervisor);
        } else {
            finalSupervisors = supervisorsOf(finalSupervisors, studentsNum);
        }

        const totalPrice = round2(studentsNum * resolvedPrice);

        // Generate or verify unique code
        let code = requestedCode;
        if (!code) {
            code = await generateTripCode();
        } else {
            const existing = await TripBooking.findOne({ bookingCode: code.toUpperCase() });
            if (existing) {
                code = await generateTripCode();
            }
        }

        // Resolve or auto-register Guest for seamless tracking
        let guestId = req.guest?._id;
        if (!guestId && phone) {
            let existingGuest = await Guest.findOne({ phone });
            if (!existingGuest) {
                existingGuest = await Guest.create({
                    name: contactName,
                    phone: phone,
                    age: "Adult",
                    gender: "male",
                    children: []
                });
            }
            guestId = existingGuest._id;
        }

        const newTrip = await TripBooking.create({
            bookingCode: code,
            guest: guestId,
            orgName,
            orgType,
            contactName,
            phone,
            offerId: String(matchedOffer._id),
            offerTitle: resolvedTitle,
            offerTitleAr: offerPair.ar,
            offerTitleEn: offerPair.en,
            pricePerStudent: resolvedPrice,
            studentsCount: studentsNum,
            supervisorsCount: finalSupervisors,
            isSupervisorsManual,
            ageGroups: Array.isArray(ageGroups) ? ageGroups : [ageGroups],
            tripDate: new Date(tripDate),
            shift,
            arrivalTime,
            totalPrice,
            quotationScreenshot,
            notes,
            status
        });

        const populated = await TripBooking.findById(newTrip._id).populate("guest", "name phone email");

        // Broadcast real-time notification to dashboard
        try {
            await createAndEmitNotification({
                title: "طلب رحلة مدرسية / مؤسسات جديد!",
                message: `حجز رحلة جديد #${code} لمنظمة (${orgName || "جهة خاصة"}) بعدد ${studentsNum} طالب بإجمالي ${totalPrice} ج.م`,
                type: "trip_booking",
                orderCode: code,
                orderId: newTrip._id,
                orderModelRef: "Trip",
                customerName: contactName || orgName || "مسؤول الرحلة",
                customerPhone: phone || "",
                amount: totalPrice,
                metadata: {
                    trip: populated,
                    orgName,
                    orgType,
                    studentsCount: studentsNum,
                    supervisorsCount: finalSupervisors,
                    tripDate,
                    shift
                }
            });
        } catch (notifErr) {
            console.error("[createTripQuote] Notification error:", notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "تم حفظ طلب عرض سعر / حجز الرحلة بنجاح",
            trip: populated
        });
    } catch (error) {
        if (sendOrderError(res, error)) return;
        // A value the booking model refuses (for example an unknown organization type) is a 400, not a 500
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: Object.values(error.errors || {}).map((e) => e.message).join(" / ") || error.message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get Trip by Quote Reference Code (e.g. AD-TRIP-1234)
// @route GET /api/trips/code/:code
// @access Public
const getTripByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const trip = await TripBooking.findOne({ bookingCode: code.toUpperCase() }).populate("guest", "name phone email");

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: `لم يتم العثور على رحلة بالكود المرجعي '${code}'`
            });
        }

        return res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get Trip by Mongo ID
// @route GET /api/trips/:id
// @access Public / Staff
const getTripById = async (req, res) => {
    try {
        const trip = await TripBooking.findById(req.params.id).populate("guest", "name phone email");
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "الرحلة غير موجودة"
            });
        }

        return res.status(200).json({
            success: true,
            trip
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get all trips with pagination and filters
// @route GET /api/trips
// @access Public / Staff
const getAllTrips = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200); // never an unbounded page
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.shift) {
            filter.shift = req.query.shift;
        }

        if (req.query.offerId) {
            filter.offerId = req.query.offerId;
        }

        if (req.query.date) {
            const dateObj = new Date(req.query.date);
            if (!Number.isNaN(dateObj.getTime())) { // an unreadable date is ignored instead of failing the request
                const nextDay = new Date(dateObj);
                nextDay.setDate(nextDay.getDate() + 1);
                filter.tripDate = { $gte: dateObj, $lt: nextDay };
            }
        }

        if (req.query.search) {
            // The text is searched as plain text: characters such as ( or + must not break the query
            const term = String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { orgName: { $regex: term, $options: "i" } },
                { contactName: { $regex: term, $options: "i" } },
                { phone: { $regex: term, $options: "i" } },
                { bookingCode: { $regex: term, $options: "i" } }
            ];
        }

        const total = await TripBooking.countDocuments(filter);
        const trips = await TripBooking.find(filter)
            .populate("guest", "name phone email")
            .sort({ tripDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            count: trips.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            trips
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get My Trips (by logged in guest or phone)
// @route GET /api/trips/my-trips
// @access Public / Auth
const getMyTrips = async (req, res) => {
    try {
        const admin = req.guest?.role === "admin";
        const guestId = req.guest?._id || (admin ? req.query.guestId : undefined);
        const phone = admin ? (req.query.phone || req.guest?.phone) : req.guest?.phone;

        if (!guestId && !phone) {
            return res.status(400).json({
                success: false,
                message: "يرجى تسجيل الدخول أو تمرير رقم الهاتف لاستعراض الرحلات"
            });
        }

        const filter = {};
        if (guestId) {
            filter.$or = [{ guest: guestId }, { phone: phone }];
        } else {
            filter.phone = phone;
        }

        const trips = await TripBooking.find(filter).sort({ tripDate: -1 });

        return res.status(200).json({
            success: true,
            count: trips.length,
            trips
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Update Trip Details
// @route PUT /api/trips/:id
// @access Staff / Auth
const updateTripBooking = async (req, res) => {
    try {
        const trip = await TripBooking.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: "الرحلة غير موجودة" });
        }

        const updates = { ...req.body };
        // Totals are never taken from the request: they are recomputed from the offer's server price
        delete updates.totalPrice;
        delete updates.pricePerStudent;

        // Recalculate price if students or offer changed
        if (updates.studentsCount || updates.offerId) {
            const offerId = updates.offerId || trip.offerId;
            const matchedOffer = await findOffer(offerId); // null for an old booking whose offer was removed: its saved price stays
            const studentCount = updates.studentsCount ? studentsOf(updates.studentsCount, matchedOffer ? (matchedOffer.minStudents || 15) : 1) : trip.studentsCount;
            const price = matchedOffer ? matchedOffer.price : trip.pricePerStudent;

            updates.pricePerStudent = price;
            updates.totalPrice = round2(studentCount * price);
            if (!updates.isSupervisorsManual && !updates.supervisorsCount) {
                updates.supervisorsCount = freeSupervisorsOf(studentCount, matchedOffer && matchedOffer.studentsPerSupervisor);
            }
        }

        const updatedTrip = await TripBooking.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        }).populate("guest", "name phone email");

        return res.status(200).json({
            success: true,
            message: "تم تحديث بيانات الرحلة بنجاح",
            trip: updatedTrip
        });
    } catch (error) {
        if (sendOrderError(res, error)) return;
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Update Trip Status
// @route PATCH /api/trips/:id/status
// @access Staff
const updateTripStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "يرجى تحديد الحالة الجديدة" });
        }

        const updated = await TripBooking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate("guest", "name phone email");

        if (!updated) {
            return res.status(404).json({ success: false, message: "الرحلة غير موجودة" });
        }

        return res.status(200).json({
            success: true,
            message: `تم تحديث حالة الرحلة إلى '${status}' بنجاح`,
            trip: updated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Delete Trip Booking
// @route DELETE /api/trips/:id
// @access Staff
const deleteTrip = async (req, res) => {
    try {
        const deleted = await TripBooking.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "الرحلة غير موجودة" });
        }

        return res.status(200).json({
            success: true,
            message: "تم حذف حجز الرحلة بنجاح"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ---- Admin: manage the offers (multipart or JSON; optional image in field "image")

const MAX_OFFERS = 50;
const MAX_LINES = 20;
const MAX_LINE_LENGTH = 160;

// Inclusions arrive as a list or as one text with a line per item
const linesOf = (v) => (Array.isArray(v) ? v : String(v == null ? "" : v).split(/\r?\n/))
    .map((x) => String(x).trim())
    .filter(Boolean);

// Reads and validates the fields of a create / update body; returns { error } or { values }
const readOfferBody = (body, { partial }) => {
    const values = {};
    const text = (f, max) => {
        if (body[f] === undefined) return partial ? null : `${f} is required`;
        const v = String(body[f] || "").trim();
        if (!v) return `${f} is required`;
        if (v.length > max) return `${f} can be up to ${max} characters`;
        values[f] = v;
        return null;
    };
    for (const [f, max] of [["titleEn", 120], ["titleAr", 120]]) {
        const err = text(f, max);
        if (err) return { error: err };
    }
    if (body.price !== undefined || !partial) {
        const price = Number(body.price);
        if (body.price === undefined || body.price === "" || !Number.isFinite(price) || price < 0 || price > 1000000) {
            return { error: "price must be a number from 0 to 1,000,000 (EGP per student)" };
        }
        values.price = round2(price);
    }
    for (const f of ["inclusionsEn", "inclusionsAr"]) {
        if (body[f] === undefined) continue;
        const lines = linesOf(body[f]);
        if (lines.length > MAX_LINES || lines.some((l) => l.length > MAX_LINE_LENGTH)) {
            return { error: `${f} can have up to ${MAX_LINES} lines of ${MAX_LINE_LENGTH} characters` };
        }
        values[f] = lines;
    }
    for (const f of ["minStudents", "studentsPerSupervisor"]) {
        if (body[f] === undefined || body[f] === "") continue;
        const n = Number(body[f]);
        if (!Number.isInteger(n) || n < 1 || n > MAX_STUDENTS) {
            return { error: `${f} must be a whole number from 1 to ${MAX_STUDENTS}` };
        }
        values[f] = n;
    }
    return { values };
};

// @route POST /api/trips/offers   (admin)
const createOffer = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        const { error, values } = readOfferBody(req.body || {}, { partial: false });
        if (error) {
            removeMediaFile(uploaded);
            return res.status(400).json({ success: false, message: error });
        }
        if ((await TripOffer.countDocuments()) >= MAX_OFFERS) {
            removeMediaFile(uploaded);
            return res.status(400).json({ success: false, message: `At most ${MAX_OFFERS} offers` });
        }
        const last = await TripOffer.findOne().sort({ order: -1 }).lean();
        const offer = await TripOffer.create({
            ...values,
            image: uploaded ? normalizeImagePath(uploaded) : "",
            order: last ? (last.order || 0) + 1 : 0,
        });
        return res.status(201).json({ success: true, offer: serializeOffer(offer), offers: await listOffers() });
    } catch (error) {
        removeMediaFile(uploaded);
        return next(error);
    }
};

// @route PUT /api/trips/offers/:id   (admin; image replaces the old one; removeImage=true clears it)
const updateOffer = async (req, res, next) => {
    const uploaded = req.body && req.body.image;
    try {
        const offer = mongoose.isValidObjectId(req.params.id) ? await TripOffer.findById(req.params.id) : null;
        if (!offer) {
            removeMediaFile(uploaded);
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
        const { error, values } = readOfferBody(req.body || {}, { partial: true });
        if (error) {
            removeMediaFile(uploaded);
            return res.status(400).json({ success: false, message: error });
        }
        const old = offer.image;
        Object.assign(offer, values);
        if (uploaded) offer.image = normalizeImagePath(uploaded);
        else if (String(req.body.removeImage) === "true") offer.image = "";
        await offer.save();
        if (old && old !== offer.image) removeMediaFile(old);
        return res.status(200).json({ success: true, offer: serializeOffer(offer), offers: await listOffers() });
    } catch (error) {
        removeMediaFile(uploaded);
        return next(error);
    }
};

// @route DELETE /api/trips/offers/:id   (admin; old bookings keep their saved name and price)
const deleteOffer = async (req, res, next) => {
    try {
        const offer = mongoose.isValidObjectId(req.params.id) ? await TripOffer.findByIdAndDelete(req.params.id) : null;
        if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
        if (offer.image) removeMediaFile(offer.image);
        return res.status(200).json({ success: true, offers: await listOffers() });
    } catch (error) {
        return next(error);
    }
};

// @route PUT /api/trips/offers/order   (admin) body: { ids } every offer id in the new order
const reorderOffers = async (req, res, next) => {
    try {
        const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(String) : [];
        const existing = await TripOffer.find().select("_id").lean();
        const have = existing.map((o) => String(o._id));
        if (ids.length !== have.length || new Set(ids).size !== ids.length || !ids.every((i) => have.includes(i))) {
            return res.status(400).json({ success: false, message: "ids must list every offer exactly once" });
        }
        await Promise.all(ids.map((id, i) => TripOffer.updateOne({ _id: id }, { order: i })));
        return res.status(200).json({ success: true, offers: await listOffers() });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getTripOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    reorderOffers,
    calculateTripCost,
    createTripQuote,
    getTripByCode,
    getTripById,
    getAllTrips,
    getMyTrips,
    updateTripBooking,
    updateTripStatus,
    deleteTrip
};
