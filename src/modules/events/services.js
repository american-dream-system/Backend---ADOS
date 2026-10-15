const EventBooking = require("./model");
const Guest = require("../guests/model");
const { createAndEmitNotification } = require("../notifications/services");

// Preset Venue Spaces matching Client
const EVENT_SPACES = [
    {
        id: "indoor",
        titleAr: "القاعة الداخلية الفاخرة",
        titleEn: "Luxury Indoor Hall",
        capacity: 120,
        capacityAr: "حتى ١٢٠ ضيفاً",
        capacityEn: "Up to 120 Guests",
        descAr: "قاعة احتفالات داخلية فاخرة بثريات كريستال، ومسرح مخصص، وتجهيزات صوت وإضاءة احترافية.",
        descEn: "Immersive indoor celebration space with crystal chandeliers, customizable stage, private sound & lighting setup.",
        image: "/photo/kid-area-pic/American Dream Ismailia luxury event hall architecture setup.png",
        fee: 0
    },
    {
        id: "roof",
        titleAr: "الرووف البانورامي",
        titleEn: "Panoramic Canal Roof",
        capacity: 80,
        capacityAr: "حتى ٨٠ ضيفاً",
        capacityEn: "Up to 80 Guests",
        descAr: "إطلالة بانورامية ساحرة في الهواء الطلق على غروب قناة السويس مع إضاءات احتفالية دافئة.",
        descEn: "Open-air breeze with panoramic sunset views over the historic Suez Canal, festoon fairy lighting.",
        image: "/photo/kid-area-pic/roof_photo_1.png",
        fee: 0
    },
    {
        id: "outdoor",
        titleAr: "الحديقة البحرية المفتوحة",
        titleEn: "Seaside Waterfront Lawn",
        capacity: 20,
        capacityAr: "أقصى حد ٢٠ ضيفاً (أعياد الميلاد)",
        capacityEn: "Max 20 Guests (Birthdays)",
        descAr: "مسطح أخضر طبيعي مطل على القناة ومزين بالأضواء الدافئة، ومجاور لمناطق الألعاب والأنشطة.",
        descEn: "Lush seaside green lawn illuminated with warm fairy lights, spacious play zones for kids' fun.",
        image: "/photo/kid-area-pic/Canal-side sunset dinner terrace with warm string lights, dining tables, grilled meats, salads, and sparkling water.png",
        fee: 0
    },
    {
        id: "grand_ballroom",
        titleAr: "قاعة أمريكان دريم الكبرى على القناة",
        titleEn: "American Dream Grand Waterfront Hall",
        capacity: 450,
        capacityAr: "سعة حتى ٤٥٠ ضيفاً",
        capacityEn: "Up to 450 Guests",
        descAr: "قاعة كبرى للفعاليات والمؤتمرات وحفلات التخرج والخطوبات مع أحدث أنظمة الصوت والشاشات العملاقة.",
        descEn: "Waterfront Grand Ballroom for galas, banquets, graduations, and large-scale corporate summits.",
        image: "/photo/kid-area-pic/Image (3).png",
        fee: 4500
    }
];

// Preset Birthday Packages matching BirthdayBuilderPage
const BIRTHDAY_PACKAGES = [
    {
        id: "explorer",
        nameAr: "مغامرة المستكشف",
        nameEn: "Explorer Adventure",
        basePrice: 7500,
        deposit: 2500,
        descAr: "أجواء لعب مليئة بالحماس والنشاط مصممة للاحتفالات المبهجة والأعمار الصغيرة.",
        descEn: "Dynamic play and high-energy excitement designed for vibrant parties.",
        featuresAr: [
            "ساعتان دخول مفتوح لكافة مناطق Play Zone",
            "منسق حفلات ومقدم استعراضات مخصص",
            "ديكورات بالونات مبهجة وتجهيز طاولات الاحتفال",
            "وجبات كيدز شهية (ناجتس/برجر + عصير طبيعي)",
            "دخول مجاني للمنتجع حتى ١٠ مرافقين بالغين"
        ]
    },
    {
        id: "champion",
        nameAr: "مغامرة الأبطال الشاملة",
        nameEn: "Champion Quest (All-Inclusive)",
        basePrice: 11500,
        deposit: 3500,
        isPopular: true,
        descAr: "التجربة الشاملة الأكثر تميزاً لأعياد الميلاد مع ألعاب الواقع الافتراضي وبوفيه الأبطال.",
        descEn: "The ultimate all-inclusive birthday experience with VR games and premium catering.",
        featuresAr: [
            "تذاكر يوم كامل لـ Play Zone + صالة ألعاب VR",
            "اثنان من منسقي الحفلات + عرض تميمة كرتونية خاص",
            "قوس بالونات كامل وخلفية تصوير مخصصة باسم الطفل",
            "بوفيه جورميه للأطفال + تورتة احتفالية من طبقتين",
            "مشروبات وضيافة قهوة وترحيب لـ ١٥ بالغاً",
            "هدايا تذكارية وصور مطبوعة فورية لكل طفل"
        ]
    },
    {
        id: "vip",
        nameAr: "الملكية الفاخرة على القناة (VIP)",
        nameEn: "Royal Waterfront VIP",
        basePrice: 16500,
        deposit: 5000,
        descAr: "حجز حصري كامل للمنطقة مع محطات طهي حي من الشيف وتغطية تصوير سينمائي احترافي.",
        descEn: "Exclusive private zone takeover with chef-curated live stations and VIP photography.",
        featuresAr: [
            "حجز حصري خاص للمكان لمدة ٤ ساعات متواصلة",
            "ألعاب المنتجع بالكامل بدون حدود (أركيد + VR)",
            "دي جي محترف ومهندس صوت وإضاءة سينمائية",
            "محطة طهي حي للشيف وتورتة ملكية فاخرة",
            "مصور فوتوغرافي وفيديو احترافي مع ريلز للمناسبة",
            "أساور VIP الإلكترونية وحقائب هدايا فاخرة للأطفال"
        ]
    }
];

// Helper to generate unique event booking code (EV-XXXXX or BD-XXXXX)
const generateEventCode = async (isBirthday = true) => {
    let unique = false;
    let code = "";
    const prefix = isBirthday ? "BD" : "EV";
    while (!unique) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        code = `${prefix}-${rand}`;
        const existing = await EventBooking.findOne({ bookingCode: code });
        if (!existing) {
            unique = true;
        }
    }
    return code;
};

// @desc Get Available Event Spaces / Halls
// @route GET /api/events/spaces
// @access Public
const getEventSpaces = async (req, res) => {
    return res.status(200).json({
        success: true,
        count: EVENT_SPACES.length,
        spaces: EVENT_SPACES
    });
};

// @desc Get Birthday Packages
// @route GET /api/events/packages
// @access Public
const getBirthdayPackages = async (req, res) => {
    return res.status(200).json({
        success: true,
        count: BIRTHDAY_PACKAGES.length,
        packages: BIRTHDAY_PACKAGES
    });
};

// @desc Check hall / space availability for a date and session
// @route GET /api/events/availability
// @access Public
const checkEventAvailability = async (req, res) => {
    try {
        const { date, space, session } = req.query;

        if (!date || !space) {
            return res.status(400).json({
                success: false,
                message: "يرجى تحديد التاريخ (date) والقاعة (space)"
            });
        }

        // Outdoor space is ALWAYS available without conflict check (only indoor and roof are checked)
        if (space === "outdoor") {
            return res.status(200).json({
                success: true,
                isAvailable: true,
                space,
                date,
                session: session || "all",
                conflictingBookingsCount: 0,
                message: "المساحة الخارجية مفتوحة ومتاحة للحجز دائماً"
            });
        }

        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        const filter = {
            space,
            eventDate: { $gte: dateObj, $lt: nextDay },
            status: { $in: ["pending_deposit", "deposit_verified", "confirmed"] }
        };

        if (session) {
            filter.session = session;
        }

        const conflictingBookings = await EventBooking.find(filter).select("bookingCode space session eventDate status");

        const isAvailable = conflictingBookings.length === 0;

        return res.status(200).json({
            success: true,
            isAvailable,
            space,
            date,
            session: session || "all",
            conflictingBookingsCount: conflictingBookings.length,
            message: isAvailable ? "الموعد متاح للحجز" : "الموعد محجوز مسبقاً، يرجى اختيار فترة أو قاعة أخرى"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Create Event / Birthday / Hall Booking
// @route POST /api/events/book
// @access Public / Authenticated
const createEventBooking = async (req, res) => {
    try {
        const {
            contactName,
            contactPhone,
            contactEmail = "",
            eventType = "birthday",
            title,
            space = "indoor",
            bookingMode = "package", // "package" or "per_guest"
            pricePerGuest = 0,
            selectedItems = [],
            birthdayDetails = {},
            totalGuests = 30,
            kidsCount,
            adultsCount,
            eventDate,
            session = "afternoon",
            sessionTime = "04:00 PM – 07:30 PM",
            basePrice,
            venueFee = 0,
            depositRequired,
            paymentMethod = "pending",
            specialRequests = "",
            bookingCode: customCode
        } = req.body;

        if (!contactName || !contactPhone || !eventDate || !space) {
            return res.status(400).json({
                success: false,
                message: "يرجى إدخال اسم العميل، الهاتف، القاعة، وتاريخ المناسبة"
            });
        }

        // Guests breakdown
        let guestsNum = Math.max(1, parseInt(totalGuests, 10) || 30);

        // Outdoor Birthday Limit: Strictly max 20 guests
        if (eventType === "birthday" && space === "outdoor" && guestsNum > 20) {
            return res.status(400).json({
                success: false,
                message: "أقصى عدد أفراد لعيد الميلاد في الحديقة الخارجية (Outdoor) هو 20 فرداً"
            });
        }

        const calculatedKids = kidsCount !== undefined ? parseInt(kidsCount, 10) : Math.round(guestsNum * (2 / 3));
        const calculatedAdults = adultsCount !== undefined ? parseInt(adultsCount, 10) : guestsNum - calculatedKids;

        // Resolve base price by booking mode (Package vs Per-Guest)
        let resolvedBasePrice = parseFloat(basePrice);
        let resolvedDeposit = parseFloat(depositRequired);
        let packageTitle = birthdayDetails.packageName;

        if (bookingMode === "per_guest") {
            const guestPrice = parseFloat(pricePerGuest) || 350;
            if (isNaN(resolvedBasePrice) || resolvedBasePrice <= 0) {
                resolvedBasePrice = guestsNum * guestPrice;
            }
            packageTitle = `حجز بعدد الأفراد (${guestsNum} ضيف)`;
            birthdayDetails.packageId = "custom";
            birthdayDetails.packageName = packageTitle;
        } else {
            // Package Mode
            if (eventType === "birthday") {
                const pkgId = birthdayDetails.packageId || "champion";
                const pkg = BIRTHDAY_PACKAGES.find(p => p.id === pkgId) || BIRTHDAY_PACKAGES[1];
                if (isNaN(resolvedBasePrice)) resolvedBasePrice = pkg.basePrice;
                if (isNaN(resolvedDeposit)) resolvedDeposit = pkg.deposit;
                packageTitle = pkg.nameEn;
            } else {
                // General hall or family
                if (isNaN(resolvedBasePrice)) resolvedBasePrice = 4500;
                if (isNaN(resolvedDeposit)) resolvedDeposit = Math.round(resolvedBasePrice * 0.3);
            }
        }

        // Space info
        const matchedSpace = EVENT_SPACES.find(s => s.id === space) || EVENT_SPACES[0];
        const spaceTitle = matchedSpace.titleEn;
        const fee = venueFee || matchedSpace.fee || 0;

        // Sanitize and calculate add-on items total
        let itemsSum = 0;
        const sanitizedItems = Array.isArray(selectedItems) ? selectedItems.map(it => ({
            id: String(it.id || ""),
            title: it.title || it.name || "إضافة خاصة",
            price: Math.max(0, parseFloat(it.price || 0) || 0),
            quantity: Math.max(1, parseInt(it.quantity || 1, 10)),
            image: it.image || ""
        })) : [];
        itemsSum = sanitizedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

        // Subtotal, 14% VAT, and Grand Total
        const subtotal = resolvedBasePrice + itemsSum;
        const vatRate = 0.14;
        const vatAmount = Math.round(subtotal * vatRate);
        const totalAmount = subtotal + fee + vatAmount;

        if (isNaN(resolvedDeposit) || resolvedDeposit <= 0) {
            resolvedDeposit = Math.round(totalAmount * 0.3);
        }

        // Generate Code
        let code = customCode;
        if (!code) {
            code = await generateEventCode(eventType === "birthday");
        }

        // Resolve or create Guest
        let guestId = req.guest?._id;
        if (!guestId && contactPhone) {
            let existing = await Guest.findOne({ phone: contactPhone });
            if (!existing) {
                existing = await Guest.create({
                    name: contactName,
                    phone: contactPhone,
                    email: contactEmail || undefined,
                    age: "Adult",
                    gender: "male",
                    children: []
                });
            }
            guestId = existing._id;
        }

        const newBooking = await EventBooking.create({
            bookingCode: code,
            guest: guestId,
            contactName,
            contactPhone,
            contactEmail,
            eventType,
            title: title || `${packageTitle || spaceTitle} Reservation`,
            space,
            spaceTitle,
            bookingMode,
            pricePerGuest: bookingMode === "per_guest" ? (parseFloat(pricePerGuest) || 350) : 0,
            selectedItems: sanitizedItems,
            itemsTotal: itemsSum,
            birthdayDetails: {
                celebrantName: birthdayDetails.celebrantName || "",
                celebrantAge: birthdayDetails.celebrantAge || "",
                packageId: birthdayDetails.packageId || (bookingMode === "per_guest" ? "custom" : "champion"),
                packageName: packageTitle || "Champion Quest"
            },
            totalGuests: guestsNum,
            kidsCount: calculatedKids,
            adultsCount: calculatedAdults,
            eventDate: new Date(eventDate),
            session,
            sessionTime,
            basePrice: resolvedBasePrice,
            venueFee: fee,
            vatRate,
            vatAmount,
            totalAmount,
            depositRequired: resolvedDeposit,
            depositPaid: false,
            paymentMethod,
            status: "pending_deposit",
            specialRequests
        });

        const populated = await EventBooking.findById(newBooking._id).populate("guest", "name phone email");

        // Broadcast real-time notification to dashboard
        try {
            await createAndEmitNotification({
                title: "حجز قاعة / مناسبة جديد!",
                message: `حجز مناسبة جديد #${code} (${spaceTitle || "قاعة الاحتفالات"}) للعميل ${contactName || "عميل"} بقيمة إجمالية ${totalAmount} ج.م (عربون: ${resolvedDeposit} ج.م)`,
                type: "event_booking",
                orderCode: code,
                orderId: newBooking._id,
                orderModelRef: "Event",
                customerName: contactName || "عميل",
                customerPhone: contactPhone || "",
                amount: totalAmount,
                metadata: {
                    booking: populated,
                    space,
                    spaceTitle,
                    eventType,
                    celebrantName: birthdayDetails?.celebrantName,
                    eventDate,
                    sessionTime,
                    depositRequired: resolvedDeposit
                }
            });
        } catch (notifErr) {
            console.error("[createEventBooking] Notification error:", notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "تم تسجيل حجز المناسبة بنجاح، يُرجى تأكيد دفع العربون",
            booking: populated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get Event Booking by Code (e.g. BD-29401 or EV-10294)
// @route GET /api/events/code/:code
// @access Public
const getEventByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const booking = await EventBooking.findOne({ bookingCode: code.toUpperCase() }).populate("guest", "name phone email");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `لم يتم العثور على حجز بالكود '${code}'`
            });
        }

        return res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get Event Booking by ID
// @route GET /api/events/:id
// @access Public / Staff
const getEventById = async (req, res) => {
    try {
        const booking = await EventBooking.findById(req.params.id).populate("guest", "name phone email");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "الحجز غير موجود"
            });
        }

        return res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get All Events with filters & pagination
// @route GET /api/events
// @access Staff
const getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.eventType) filter.eventType = req.query.eventType;
        if (req.query.space) filter.space = req.query.space;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.session) filter.session = req.query.session;

        if (req.query.date) {
            const dateObj = new Date(req.query.date);
            const nextDay = new Date(dateObj);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.eventDate = { $gte: dateObj, $lt: nextDay };
        }

        if (req.query.search) {
            filter.$or = [
                { contactName: { $regex: req.query.search, $options: "i" } },
                { contactPhone: { $regex: req.query.search, $options: "i" } },
                { bookingCode: { $regex: req.query.search, $options: "i" } },
                { "birthdayDetails.celebrantName": { $regex: req.query.search, $options: "i" } }
            ];
        }

        const total = await EventBooking.countDocuments(filter);
        const bookings = await EventBooking.find(filter)
            .populate("guest", "name phone email")
            .sort({ eventDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            count: bookings.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            bookings
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Get My Events (by phone or guest)
// @route GET /api/events/my-events
// @access Public / Auth
const getMyEvents = async (req, res) => {
    try {
        const guestId = req.guest?._id || req.query.guestId;
        const phone = req.query.phone || req.guest?.phone;

        if (!guestId && !phone) {
            return res.status(400).json({
                success: false,
                message: "يرجى تسجيل الدخول أو تمرير رقم الهاتف لاستعراض حجوزاتك"
            });
        }

        const filter = {};
        if (guestId) {
            filter.$or = [{ guest: guestId }, { contactPhone: phone }];
        } else {
            filter.contactPhone = phone;
        }

        const bookings = await EventBooking.find(filter).sort({ eventDate: 1 });

        return res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Upload payment proof receipt for deposit
// @route POST /api/events/:id/deposit-proof
// @access Public / Auth
const uploadDepositProof = async (req, res) => {
    try {
        const { paymentProof, paymentMethod = "instapay" } = req.body;
        const booking = await EventBooking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "الحجز غير موجود" });
        }

        booking.paymentProof = paymentProof || booking.paymentProof;
        booking.paymentMethod = paymentMethod;
        booking.status = "deposit_verified"; // Pending staff final confirmation
        booking.depositPaid = true;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "تم إرسال إيصال سداد العربون بنجاح، جاري المراجعة والتأكيد",
            booking
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Update event booking details
// @route PUT /api/events/:id
// @access Staff / Auth
const updateEventBooking = async (req, res) => {
    try {
        const updated = await EventBooking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate("guest", "name phone email");

        if (!updated) {
            return res.status(404).json({ success: false, message: "الحجز غير موجود" });
        }

        return res.status(200).json({
            success: true,
            message: "تم تحديث تفاصيل الحجز بنجاح",
            booking: updated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Update event booking status
// @route PATCH /api/events/:id/status
// @access Staff
const updateEventStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: "يرجى تحديد الحالة الجديدة" });
        }

        const updated = await EventBooking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate("guest", "name phone email");

        if (!updated) {
            return res.status(404).json({ success: false, message: "الحجز غير موجود" });
        }

        return res.status(200).json({
            success: true,
            message: `تم تحديث حالة الحجز إلى '${status}' بنجاح`,
            booking: updated
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc Delete Event Booking
// @route DELETE /api/events/:id
// @access Staff
const deleteEventBooking = async (req, res) => {
    try {
        const deleted = await EventBooking.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "الحجز غير موجود" });
        }

        return res.status(200).json({
            success: true,
            message: "تم حذف حجز المناسبة بنجاح"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getEventSpaces,
    getBirthdayPackages,
    checkEventAvailability,
    createEventBooking,
    getEventByCode,
    getEventById,
    getAllEvents,
    getMyEvents,
    uploadDepositProof,
    updateEventBooking,
    updateEventStatus,
    deleteEventBooking
};
