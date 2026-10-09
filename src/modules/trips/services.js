const TripBooking = require("./model");
const Guest = require("../guests/model");

// Preset Trip Packages matching Client DesktopTripsPage
const TRIP_OFFERS = [
    {
        id: "full-dream",
        titleAr: "يوم الحلم الكامل",
        titleEn: "FULL DREAM DAY",
        descAr: "تجربة شاملة طوال اليوم عبر جميع مناطق الألعاب مع وجبة غداء كاملة ومرشد مخصص للمجموعة.",
        descEn: "Comprehensive all-day experience across all 4 zones with lunch and dedicated group host.",
        price: 380,
        badgeAr: "الأكثر طلباً",
        badgeEn: "Most Popular",
        inclusionsAr: [
            "دخول مفتوح لجميع مناطق الألعاب (فن بارك، التحدي والمغامرات)",
            "وجبة غداء ساخنة متكاملة (سندوتشات أو وجبة أطفال + عصير)",
            "مرشد سياحي وترفيهي مرافق طوال اليوم + صورة تذكارية جماعية",
            "إشراف أمني مستمر وتواجد مسعفين مجهزين"
        ],
        inclusionsEn: [
            "Play Zone Unlimited Access (Fun Park, Challenge & Adventure)",
            "Full Hot Lunch Meal (Sandwich options or Kids Meal + Juice)",
            "Dedicated Experience Guide & Welcome Group Photo Souvenir",
            "Continuous Safety Supervision & First Aid Station Access"
        ]
    },
    {
        id: "play-dine",
        titleAr: "لعب ووجبة لذيذة",
        titleEn: "PLAY & DINE",
        descAr: "باقة متوازنة تجمع بين ألعاب مختارة ووجبة شهية، مثالية للرحلات الصباحية أو المسائية.",
        descEn: "A balanced package with exciting play and a delicious meal, perfect for morning or afternoon trips.",
        price: 290,
        badgeAr: "أفضل قيمة",
        badgeEn: "Best Value",
        inclusionsAr: [
            "دخول منطقتي ألعاب من اختياركم (فن بارك أو التحدي أو المغامرات)",
            "وجبة كومبو للأطفال + عصير طازج أو مشروب منعش",
            "مشرف مخصص لتنظيم الدخول وتناول الوجبات",
            "مسابقات جماعية وألعاب حماسية مع جوائز وهدايا"
        ],
        inclusionsEn: [
            "Play Zone Access (Choose 2 Zones: Fun Park, Challenge or Adventure)",
            "Kids Combo Meal & Fresh Juice / Soft Drink",
            "Dedicated Area Host to coordinate arrival and meal",
            "Group Activities & Team-Building Games (with prizes)"
        ]
    },
    {
        id: "play-zone",
        titleAr: "تجربة الألعاب الترفيهية",
        titleEn: "PLAY ZONE EXPERIENCE",
        descAr: "طاقة وحماس بدون توقف! دخول كامل ومفتوح لمناطق الألعاب والأنشطة بدون وجبات.",
        descEn: "Pure play and energy burn! Full access to games and activities without catering.",
        price: 210,
        badgeAr: "اقتصادية وممتعة",
        badgeEn: "Budget Friendly",
        inclusionsAr: [
            "دخول يوم كامل لجميع مناطق الألعاب الثلاث",
            "صورة جماعية تذكارية للمدرسة أو المؤسسة",
            "مرشد استقبال لتنظيم الحضور وتعليمات السلامة",
            "أساور دخول منسقة لسلامة الأطفال"
        ],
        inclusionsEn: [
            "Full Day Play Zone access across all 3 play zones",
            "Group photo souvenir for the school / organization",
            "Dedicated Group Host for check-in & orientation",
            "Coordinated System and Return Zone Safety Passes"
        ]
    }
];

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

// @desc Get available Trip Offers
// @route GET /api/trips/offers (or /packages)
// @access Public
const getTripOffers = async (req, res) => {
    return res.status(200).json({
        success: true,
        count: TRIP_OFFERS.length,
        offers: TRIP_OFFERS
    });
};

// @desc Calculate Trip Cost and Supervisor complimentary ratio
// @route POST /api/trips/calculate
// @access Public
const calculateTripCost = async (req, res) => {
    try {
        const { offerId = "full-dream", students = 15, isSupervisorsManual = false, supervisors } = req.body;
        const offer = TRIP_OFFERS.find(o => o.id === offerId) || TRIP_OFFERS[0];
        const studentCount = Math.max(15, parseInt(students, 10) || 15);
        
        let calculatedSupervisors = Math.max(1, Math.floor(studentCount / 15));
        if (isSupervisorsManual && supervisors) {
            calculatedSupervisors = Math.max(1, parseInt(supervisors, 10));
        }

        const totalPrice = studentCount * offer.price;

        return res.status(200).json({
            success: true,
            data: {
                offerId: offer.id,
                offerTitle: offer.titleEn,
                pricePerStudent: offer.price,
                students: studentCount,
                supervisors: calculatedSupervisors,
                freeSupervisors: Math.max(1, Math.floor(studentCount / 15)),
                totalPrice
            }
        });
    } catch (error) {
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
            offerId = "full-dream",
            offerTitle,
            pricePerStudent,
            studentsCount = 15,
            supervisorsCount,
            isSupervisorsManual = false,
            ageGroups = ["6-9", "10-12"],
            tripDate,
            shift = "morning",
            arrivalTime = "09:30 AM",
            quotationScreenshot = "",
            notes = "",
            status = "quote_generated",
            bookingCode: requestedCode
        } = req.body;

        if (!orgName || !contactName || !phone || !tripDate) {
            return res.status(400).json({
                success: false,
                message: "يرجى تعبئة جميع الحقول المطلوبة (اسم الجهة، اسم المنسق، رقم الهاتف، وتاريخ الرحلة)"
            });
        }

        const studentsNum = Math.max(15, parseInt(studentsCount, 10) || 15);

        // Find package price
        const matchedOffer = TRIP_OFFERS.find(o => o.id === offerId);
        const resolvedPrice = pricePerStudent || (matchedOffer ? matchedOffer.price : 380);
        const resolvedTitle = offerTitle || (matchedOffer ? matchedOffer.titleEn : "FULL DREAM DAY");

        // Calculate supervisors
        let finalSupervisors = supervisorsCount;
        if (!isSupervisorsManual || !finalSupervisors) {
            finalSupervisors = Math.max(1, Math.floor(studentsNum / 15));
        }

        const totalPrice = studentsNum * resolvedPrice;

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
            offerId,
            offerTitle: resolvedTitle,
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

        return res.status(201).json({
            success: true,
            message: "تم حفظ طلب عرض سعر / حجز الرحلة بنجاح",
            trip: populated
        });
    } catch (error) {
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
        const limit = parseInt(req.query.limit, 10) || 20;
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
            const nextDay = new Date(dateObj);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.tripDate = { $gte: dateObj, $lt: nextDay };
        }

        if (req.query.search) {
            filter.$or = [
                { orgName: { $regex: req.query.search, $options: "i" } },
                { contactName: { $regex: req.query.search, $options: "i" } },
                { phone: { $regex: req.query.search, $options: "i" } },
                { bookingCode: { $regex: req.query.search, $options: "i" } }
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
        const guestId = req.guest?._id || req.query.guestId;
        const phone = req.query.phone || req.guest?.phone;

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

        // Recalculate price if students or offer changed
        if (updates.studentsCount || updates.offerId) {
            const studentCount = updates.studentsCount ? parseInt(updates.studentsCount, 10) : trip.studentsCount;
            const offerId = updates.offerId || trip.offerId;
            const matchedOffer = TRIP_OFFERS.find(o => o.id === offerId);
            const price = updates.pricePerStudent || (matchedOffer ? matchedOffer.price : trip.pricePerStudent);

            updates.totalPrice = studentCount * price;
            if (!updates.isSupervisorsManual && !updates.supervisorsCount) {
                updates.supervisorsCount = Math.max(1, Math.floor(studentCount / 15));
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

module.exports = {
    getTripOffers,
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
