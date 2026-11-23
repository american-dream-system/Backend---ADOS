const EventRequest = require("./model");
const Media = require("../media/model");
const EventsHome = require("../eventsHome/model");
const { createAndEmitNotification } = require("../notifications/services");
const { verifyToken } = require("../../utils/token");
const Guest = require("../guests/model");

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected"];
const KINDS = ["birthday", "family", "meeting"];
const MAX_BIRTHDAY_GUESTS = 25;
const MIN_MEETING = 10;
const MAX_MEETING = 300;

const fail = (status, message) => Object.assign(new Error(message), { status, expose: true });

const generateCode = async (kind) => {
    const prefix = { birthday: "BD", family: "FE", meeting: "ME" }[kind];
    for (let i = 0; i < 20; i++) {
        const code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
        if (!(await EventRequest.exists({ bookingCode: code }))) return code;
    }
    throw new Error("Could not generate a booking code");
};

// The admin's priced packages (Media page "events", section "packages"). No built-in packages exist here:
// a package that is not saved with a price above 0 cannot be booked.
const adminPackages = async (occasion) => {
    const doc = await Media.findOne({ page: "events", section: "packages" }).lean();
    const extra = (doc && doc.extraData) || {};
    const byOcc = extra.packagesByOccasion || {};
    const list =
        occasion === "birthday"
            ? byOcc.birthday && byOcc.birthday.length
                ? byOcc.birthday
                : extra.packages
            : byOcc[occasion];
    return (Array.isArray(list) ? list : [])
        .map((p) => ({
            id: String((p && p.id) || ""),
            nameAr: String((p && (p.nameAr || p.nameEn)) || "").trim(),
            nameEn: String((p && (p.nameEn || p.nameAr)) || "").trim(),
            price: Number(p && (p.basePrice !== undefined ? p.basePrice : p.price)),
            venueId: String((p && p.venueId) || ""),
        }))
        .filter((p) => p.id && Number.isFinite(p.price) && p.price > 0);
};

// Midweek = Sat to Wed, Weekend = Thu and Fri (the same split the Per Person card shows).
// The weekday is read from the calendar date itself (Date.UTC of Y-M-D, then getUTCDay), never from a local time, so it
// is the weekday of that date in Egypt on any server or browser time zone.
const tierOfDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun ... 4 Thu, 5 Fri
    return dow === 4 || dow === 5 ? "weekend" : "midweek";
};

// Today's date in Egypt (Africa/Cairo) as YYYY-MM-DD. "Not in the past" is judged on the Egypt calendar day, so the
// server's own time zone (UTC on the VPS) can never make an Egypt date look like yesterday or tomorrow.
const egyptToday = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// The admin's Family Events venues, Meetings spaces and Meetings equipment (Events Home page)
const eventsHomeLists = async () => {
    const home = await EventsHome.findOne({ key: "events-home" }).lean();
    return {
        familyVenues: (home && home.familyVenues) || [],
        meetingSpaces: (home && home.meetingSpaces) || [],
        meetingEquipment: (home && home.meetingEquipment) || [],
    };
};

// The chosen venue/space from an admin list: it must exist and the guest count must fit its range
const pickVenue = (list, venueId, guests, doc) => {
    const v = list.find((x) => String(x._id) === String(venueId || ""));
    if (!v) throw fail(409, "Choose one of the available venues");
    if (!Number.isInteger(guests) || guests < v.minGuests || guests > v.maxGuests) {
        throw fail(400, `${v.titleEn}: guests must be from ${v.minGuests} to ${v.maxGuests}`);
    }
    doc.venueId = String(v._id);
    doc.venue = v.titleEn.slice(0, 80);
    doc.venueAr = v.titleAr.slice(0, 80);
};

// The signed-in customer, if the request carries a valid token (the endpoint stays public)
const optionalGuest = async (req) => {
    try {
        const h = req.headers.authorization || "";
        if (!h.startsWith("Bearer ")) return null;
        const decoded = verifyToken(h.split(" ")[1]);
        const g = decoded && decoded.id ? await Guest.findById(decoded.id).select("_id").lean() : null;
        return g ? g._id : null;
    } catch (e) {
        return null;
    }
};

const toDateOnly = (value) => {
    const s = String(value || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const dt = new Date(`${s}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== s) return null;
    return s;
};

// @route POST /api/event-requests   (public, rate limited)
const createEventRequest = async (req, res, next) => {
    try {
        const b = req.body || {};
        const kind = b.kind;
        const dateStr = toDateOnly(b.eventDate);
        const guests = b.guestCount === undefined || b.guestCount === null || b.guestCount === "" ? null : Number(b.guestCount);
        const lang = b.lang === "en" ? "en" : "ar";

        // The event date is a calendar date (YYYY-MM-DD) in Egypt; it can't be before today in Egypt
        if (!dateStr || dateStr < egyptToday()) throw fail(400, "Choose today or a later date for the event");

        const doc = {
            kind,
            customerName: String(b.customerName).trim(),
            customerPhone: EventRequest.normalizePhone(b.customerPhone),
            guest: await optionalGuest(req),
            customerEmail: String(b.customerEmail || "").trim(),
            eventDate: new Date(`${dateStr}T00:00:00.000Z`),
            timeText: String(b.time || "").trim(),
            guestCount: guests,
            notes: String(b.notes || "").trim(),
            venue: kind === "birthday" ? String(b.venue || "").trim() : "",
            occasion: String(b.occasion || "").trim(),
            organizer: String(b.organizer || "").trim(),
            equipment: [],
            lang,
        };

        if (kind === "birthday") {
            if (!Number.isInteger(guests) || guests < 1 || guests > MAX_BIRTHDAY_GUESTS) {
                throw fail(400, `Guests must be from 1 to ${MAX_BIRTHDAY_GUESTS}`);
            }
            if (!doc.timeText) throw fail(400, "Choose the event time");
            if (b.packageId) {
                const pkg = (await adminPackages("birthday")).find((p) => p.id === String(b.packageId));
                if (!pkg) throw fail(409, "This package is not available");
                doc.priceMode = "package";
                doc.totalPrice = pkg.price;
                doc.snapshot = { packageId: pkg.id, packageNameAr: pkg.nameAr, packageNameEn: pkg.nameEn };
            } else {
                // Per-person booking: the tier follows the date, the price is the admin's price for that tier
                const tier = tierOfDate(dateStr);
                if (b.tier && b.tier !== tier) {
                    throw fail(400, tier === "weekend" ? "This date is a Weekend date (Thu - Fri)" : "This date is a Midweek date (Sat - Wed)");
                }
                const home = await EventsHome.findOne({ key: "events-home" }).lean();
                const t = home && home.birthdayPerPerson && home.birthdayPerPerson[tier];
                const price = t && Number.isFinite(t.price) && t.price > 0 ? t.price : null;
                if (price === null) throw fail(409, "The per-person price is not available for this day");
                doc.priceMode = "per_person";
                doc.totalPrice = Math.round(price * guests * 100) / 100;
                doc.snapshot = {
                    tier,
                    pricePerGuest: price,
                    includesAr: (t.includesAr || []).filter(Boolean),
                    includesEn: (t.includesEn || []).filter(Boolean),
                };
            }
        } else if (kind === "family") {
            if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 1000)) {
                throw fail(400, "Guests must be a whole number from 1 to 1000");
            }
            // The venue comes from the admin list; the guest count must fit its range
            const { familyVenues } = await eventsHomeLists();
            if (familyVenues.length) pickVenue(familyVenues, b.venueId, guests, doc);
            // Only a package of the chosen venue (or one tied to no venue) can be booked
            const pkg = (await adminPackages("family")).find(
                (p) => p.id === String(b.packageId || "") && (!familyVenues.length || !p.venueId || p.venueId === doc.venueId)
            );
            if (!pkg) throw fail(409, "This package is not available for the chosen venue");
            doc.priceMode = "package";
            doc.totalPrice = pkg.price;
            doc.snapshot = { packageId: pkg.id, packageNameAr: pkg.nameAr, packageNameEn: pkg.nameEn };
        } else {
            const { meetingSpaces, meetingEquipment } = await eventsHomeLists();
            if (meetingSpaces.length) {
                // The space comes from the admin list; the attendee count must fit its capacity
                pickVenue(meetingSpaces, b.venueId, guests, doc);
            } else if (!Number.isInteger(guests) || guests < MIN_MEETING || guests > MAX_MEETING) {
                throw fail(400, `Attendees must be from ${MIN_MEETING} to ${MAX_MEETING}`);
            }
            // Equipment: ids (or English names) of the admin's list; anything else is refused
            const asked = (Array.isArray(b.equipment) ? b.equipment : []).map((x) => String(x).trim()).filter(Boolean).slice(0, 30);
            const chosen = [];
            for (const key of asked) {
                const item = meetingEquipment.find((e) => String(e._id) === key || e.titleEn === key);
                if (!item) throw fail(409, "Choose equipment from the available list");
                if (!chosen.includes(item)) chosen.push(item);
            }
            doc.equipment = chosen.map((e) => e.titleEn);
            doc.equipmentAr = chosen.map((e) => e.titleAr);
            // Meetings have no fixed price: saved as a request, price on request (null, never 0)
            doc.priceMode = "on_request";
            doc.totalPrice = null;
        }

        const bookingCode = await generateCode(kind);
        const created = await EventRequest.create({ ...doc, bookingCode, status: "pending" });

        try {
            await createAndEmitNotification({
                title: "طلب حجز مناسبة جديد!",
                message: `طلب جديد #${bookingCode} (${kind}) بتاريخ ${dateStr}`,
                type: "event_booking",
                orderCode: bookingCode,
                customerName: doc.customerName,
                customerPhone: doc.customerPhone,
                amount: doc.totalPrice || 0,
                metadata: { kind, date: dateStr, guests, priceMode: doc.priceMode },
            });
        } catch (notifErr) {
            console.error("[createEventRequest] Notification error:", notifErr.message);
        }

        res.status(201).json({ success: true, message: "Booking request saved", data: created });
    } catch (error) {
        if (error && error.expose) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
};

// @route GET /api/event-requests   (admin) ?status=&kind=&q=&page=&limit=
const getEventRequests = async (req, res, next) => {
    try {
        const filter = {};
        if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
        if (KINDS.includes(req.query.kind)) filter.kind = req.query.kind;
        const q = String(req.query.q || "").trim().slice(0, 60);
        if (q) {
            const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            filter.$or = [{ bookingCode: rx }, { customerName: rx }, { customerPhone: rx }, { organizer: rx }];
        }
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const [data, total] = await Promise.all([
            EventRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            EventRequest.countDocuments(filter),
        ]);
        res.status(200).json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        next(error);
    }
};

// @route PATCH /api/event-requests/:id/status   (admin)  body: { status, rejectionReason? }
const updateEventRequestStatus = async (req, res, next) => {
    try {
        const { status } = req.body || {};
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(", ")}` });
        }
        // The reason belongs to a rejection only: any other status clears it
        const reason = status === "rejected" ? String(req.body.rejectionReason || "").trim().slice(0, 300) : "";
        const updated = await EventRequest.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason: reason },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Booking request not found" });
        res.status(200).json({ success: true, message: `Status updated to '${status}'`, data: updated });
    } catch (error) {
        next(error);
    }
};

module.exports = { createEventRequest, getEventRequests, updateEventRequestStatus, tierOfDate, egyptToday };
