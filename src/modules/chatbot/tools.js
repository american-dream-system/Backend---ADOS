const Ticket = require("../tickets/model");
const Package = require("../packges/model");
const MenuItem = require("../menu/model");
const MenuOrder = require("../menu/orderModel");
const BookingTable = require("../bookingTable/model");
const BuyingOrder = require("../buying/model");
const Guest = require("../guests/model");

// Gemini Function Declarations (Tools)
const chatbotToolDeclarations = [
    {
        name: "getTickets",
        description: "عرض تذاكر الألعاب والمناطق الترفيهية المتاحة في أمريكان دريم مع تفاصيل الأسعار والخصومات ونقاط المكافآت والمناطق.",
        parameters: {
            type: "OBJECT",
            properties: {
                page: {
                    type: "STRING",
                    description: "المنطقة الترفيهية: funZone (منطقة المرح), kidsArea (منطقة الأطفال), challengeZone (منطقة التحدي), adventureZone (منطقة المغامرات)"
                },
                priceType: {
                    type: "STRING",
                    description: "نوع السعر: hour (بالساعة) أو game (باللعبة)"
                },
                maxPrice: {
                    type: "NUMBER",
                    description: "الحد الأقصى لسعر التذكرة بالجنيه"
                }
            }
        }
    },
    {
        name: "getPackages",
        description: "عرض الباقات والعروض الترويجية التوفيرية المتاحة في أمريكان دريم مع تفاصيل السعر ونقاط المكافآت.",
        parameters: {
            type: "OBJECT",
            properties: {
                search: {
                    type: "STRING",
                    description: "كلمة بحث للبحث في اسم الباقة أو وصفها"
                }
            }
        }
    },
    {
        name: "getMenuItems",
        description: "البحث في قائمة طعام ومشروبات مطعم أمريكان دريم وعرض الوجبات والأسعار والأطباق المميزة.",
        parameters: {
            type: "OBJECT",
            properties: {
                category: {
                    type: "STRING",
                    description: "تصنيف الطعام: burgers, pizza, grills, drinks, coffee, sweets, meals, cafe"
                },
                search: {
                    type: "STRING",
                    description: "اسم الوجبة أو المشروب للبحث عنه بالعربية أو الإنجليزية"
                },
                onlySpecials: {
                    type: "BOOLEAN",
                    description: "إذا كان true، يعرض فقط الأطباق الخاصة للشيف (Chef's Special)"
                }
            }
        }
    },
    {
        name: "checkTableAvailability",
        description: "التحقق من إمكانية حجز طاولة في مطعم أمريكان دريم بتاريخ ووقت ومنطقة محددة وعدد المقاعد المشغولة.",
        parameters: {
            type: "OBJECT",
            properties: {
                date: {
                    type: "STRING",
                    description: "تاريخ الحجز بصيغة YYYY-MM-DD"
                },
                time: {
                    type: "STRING",
                    description: "الموعد المطلوب (مثال: 6:00 PM, 7:30 PM, 9:00 PM)"
                },
                area: {
                    type: "STRING",
                    description: "منطقة الجلوس: Family 1, Family 2, Family 3, Roof, Indoor, Relaxation Area"
                }
            },
            required: ["date", "time"]
        }
    },
    {
        name: "bookTable",
        description: "إتمام حجز طاولة للعميل في مطعم أمريكان دريم وتوليد كود حجز فريد (TB-XXXXXX).",
        parameters: {
            type: "OBJECT",
            properties: {
                guestName: {
                    type: "STRING",
                    description: "اسم العميل المسجل باسمه الحجز"
                },
                guestPhone: {
                    type: "STRING",
                    description: "رقم هاتف العميل (يفضل 11 رقم)"
                },
                date: {
                    type: "STRING",
                    description: "تاريخ الحجز بصيغة YYYY-MM-DD"
                },
                time: {
                    type: "STRING",
                    description: "ساعة وتوقيت الحجز (مثال: 7:00 PM)"
                },
                numberOfPerson: {
                    type: "NUMBER",
                    description: "عدد الأفراد / المقاعد المطلوبة"
                },
                area: {
                    type: "STRING",
                    description: "منطقة الجلوس المفضلة (Family 1, Family 2, Family 3, Roof, Indoor, Relaxation Area)"
                },
                notes: {
                    type: "STRING",
                    description: "ملاحظات إضافية أو مناسبات خاصة مثل عيد ميلاد"
                }
            },
            required: ["guestName", "guestPhone", "date", "time", "numberOfPerson"]
        }
    },
    {
        name: "createFoodOrder",
        description: "طلب وجبات من قائمة طعام المطعم (دليفري أو استلام تيك أواي أو داخل المطعم).",
        parameters: {
            type: "OBJECT",
            properties: {
                customerName: {
                    type: "STRING",
                    description: "اسم العميل"
                },
                customerPhone: {
                    type: "STRING",
                    description: "رقم هاتف العميل"
                },
                orderType: {
                    type: "STRING",
                    description: "نوع الطلب: delivery (توصيل), takeaway (استلام), dine_in (داخل الصالة)"
                },
                deliveryAddress: {
                    type: "STRING",
                    description: "عنوان التوصيل بالتفصيل (مطلوب إذا كان orderType هو delivery)"
                },
                items: {
                    type: "ARRAY",
                    description: "قائمة الأصناف المطلوبة",
                    items: {
                        type: "OBJECT",
                        properties: {
                            itemName: {
                                type: "STRING",
                                description: "اسم الصنف أو جزء منه للبحث عنه في المنيو"
                            },
                            quantity: {
                                type: "NUMBER",
                                description: "الكمية المطلوبة (افتراضي: 1)"
                            }
                        },
                        required: ["itemName"]
                    }
                },
                paymentMethod: {
                    type: "STRING",
                    description: "طريقة الدفع: cash, cod, card, instapay, vodafone_cash"
                },
                deliveryNotes: {
                    type: "STRING",
                    description: "ملاحظات خاصة بالتوصيل أو تحضير الطعام"
                }
            },
            required: ["customerName", "customerPhone", "items"]
        }
    },
    {
        name: "checkOrderStatus",
        description: "الاستعلام عن حالة أي طلب أو حجز في أمريكان دريم باستخدام كود الحجز أو الطلب (TB-XXXXXX أو PZ-XXXXXX أو MN-XXXXXX).",
        parameters: {
            type: "OBJECT",
            properties: {
                code: {
                    type: "STRING",
                    description: "كود الحجز أو الطلب (مثال: TB-123456 لحجز الطاولة، PZ-123456 لتذاكر الألعاب، MN-123456 لطلبات المطعم)"
                }
            },
            required: ["code"]
        }
    },
    {
        name: "getParkInfo",
        description: "الحصول على معلومات عامة عن ملاهي ومطعم أمريكان دريم مثل مواعيد العمل، العنوان، وسائل التواصل، والقواعد.",
        parameters: {
            type: "OBJECT",
            properties: {
                topic: {
                    type: "STRING",
                    description: "موضوع الاستفسار: hours (مواعيد العمل), location (الموقع والعنوان), contact (التواصل), rules (شروط وقواعد الدخول), all (جميع المعلومات)"
                }
            }
        }
    }
];

// Helper to generate unique codes
const generateRandomCode = (prefix) => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${rand}`;
};

// Dispatch and execute tool logic
const executeChatbotTool = async (name, args = {}, context = {}) => {
    try {
        switch (name) {
            case "getTickets": {
                const query = {};
                if (args.page) query.page = args.page;
                if (args.priceType) query.priceType = args.priceType;
                if (args.maxPrice) {
                    query.$or = [
                        { priceAfterDiscount: { $lte: args.maxPrice } },
                        { price: { $lte: args.maxPrice } }
                    ];
                }

                const tickets = await Ticket.find(query).limit(10).lean();
                return {
                    success: true,
                    count: tickets.length,
                    tickets: tickets.map(t => ({
                        id: t._id,
                        title: t.title,
                        description: t.description,
                        page: t.page,
                        price: t.price,
                        discountPrice: t.priceAfterDiscount,
                        priceType: t.priceType,
                        hourPrice: t.hourPrice,
                        gamesPrice: t.gamesPrice,
                        age: t.age,
                        points: t.pointsGets
                    }))
                };
            }

            case "getPackages": {
                const query = {};
                if (args.search) {
                    query.$or = [
                        { title: { $regex: args.search, $options: "i" } },
                        { description: { $regex: args.search, $options: "i" } }
                    ];
                }

                const packages = await Package.find(query).limit(10).lean();
                return {
                    success: true,
                    count: packages.length,
                    packages: packages.map(p => ({
                        id: p._id,
                        title: p.title,
                        description: p.description,
                        price: p.price,
                        discountPrice: p.priceAfterDiscount,
                        points: p.pointsGets
                    }))
                };
            }

            case "getMenuItems": {
                const query = { available: true };
                if (args.category) query.category = args.category.toLowerCase();
                if (args.onlySpecials) query.isChefSpecial = true;
                if (args.search) {
                    query.$or = [
                        { nameAr: { $regex: args.search, $options: "i" } },
                        { nameEn: { $regex: args.search, $options: "i" } },
                        { descAr: { $regex: args.search, $options: "i" } },
                        { descEn: { $regex: args.search, $options: "i" } }
                    ];
                }

                const items = await MenuItem.find(query).limit(15).lean();
                return {
                    success: true,
                    count: items.length,
                    menuItems: items.map(item => ({
                        id: item._id,
                        nameAr: item.nameAr,
                        nameEn: item.nameEn,
                        price: item.price,
                        priceAfterDiscount: item.priceAfterDiscount || item.price,
                        category: item.category,
                        rating: item.rating,
                        isChefSpecial: item.isChefSpecial,
                        descAr: item.descAr
                    }))
                };
            }

            case "checkTableAvailability": {
                const { date, time, area } = args;
                const queryDate = new Date(date);
                const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
                const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

                const filter = {
                    date: { $gte: startOfDay, $lte: endOfDay },
                    status: { $ne: "cancelled" }
                };
                if (time) filter.time = time;
                if (area) filter.area = area;

                const existingBookings = await BookingTable.find(filter).lean();
                const totalBookedPersons = existingBookings.reduce((sum, b) => sum + (b.numberOfPerson || 0), 0);

                const areaCapacity = 50; // standard slot capacity per area
                const availableSeats = Math.max(0, areaCapacity - totalBookedPersons);
                const isAvailable = availableSeats >= 2;

                return {
                    success: true,
                    requestedDate: date,
                    requestedTime: time,
                    requestedArea: area || "أي منطقة",
                    isAvailable,
                    availableSeats,
                    activeBookingsCount: existingBookings.length,
                    message: isAvailable 
                        ? `نعم، تتوفر أماكن شاغرة (${availableSeats} مقعد متاح) في هذا التوقيت.` 
                        : "عذراً، هذا التوقيت ممتلئ تقريباً، يرجى اختيار موعد أو منطقة أخرى."
                };
            }

            case "bookTable": {
                const {
                    guestName,
                    guestPhone,
                    date,
                    time,
                    numberOfPerson = 2,
                    area = "Family 1",
                    notes = ""
                } = args;

                // Lookup or create guest record
                let guest = null;
                if (context.guestId) {
                    guest = await Guest.findById(context.guestId);
                }
                if (!guest && guestPhone) {
                    guest = await Guest.findOne({ phone: guestPhone });
                    if (!guest) {
                        guest = await Guest.create({
                            name: guestName,
                            phone: guestPhone,
                            age: "Adult",
                            gender: "male",
                            children: []
                        });
                    }
                }

                // Generate unique code
                let bookingCode = generateRandomCode("TB");
                while (await BookingTable.findOne({ bookingCode })) {
                    bookingCode = generateRandomCode("TB");
                }

                const newBooking = await BookingTable.create({
                    bookingCode,
                    guest: guest ? guest._id : (context.guestId || null),
                    guestName: guestName || (guest ? guest.name : "عميل مميز"),
                    guestPhone: guestPhone || (guest ? guest.phone : ""),
                    area,
                    date: new Date(date),
                    time,
                    numberOfPerson: Number(numberOfPerson),
                    notes,
                    status: "confirmed"
                });

                return {
                    success: true,
                    message: "تم تأكيد حجز الطاولة بنجاح!",
                    bookingDetails: {
                        bookingCode: newBooking.bookingCode,
                        guestName: newBooking.guestName,
                        guestPhone: newBooking.guestPhone,
                        area: newBooking.area,
                        date: newBooking.date.toISOString().split("T")[0],
                        time: newBooking.time,
                        numberOfPerson: newBooking.numberOfPerson,
                        status: newBooking.status
                    }
                };
            }

            case "createFoodOrder": {
                const {
                    customerName,
                    customerPhone,
                    orderType = "delivery",
                    deliveryAddress = "",
                    items = [],
                    paymentMethod = "cash",
                    deliveryNotes = ""
                } = args;

                if (!items || items.length === 0) {
                    return { success: false, message: "يجب اختيار صنف واحد على الأقل من قائمة الطعام." };
                }

                const resolvedItems = [];
                let subtotal = 0;

                for (const reqItem of items) {
                    // Find item in Menu by name
                    const menuItem = await MenuItem.findOne({
                        $or: [
                            { nameAr: { $regex: reqItem.itemName, $options: "i" } },
                            { nameEn: { $regex: reqItem.itemName, $options: "i" } }
                        ],
                        available: true
                    });

                    if (menuItem) {
                        const quantity = Number(reqItem.quantity) || 1;
                        const price = menuItem.priceAfterDiscount || menuItem.price;
                        const lineTotal = price * quantity;
                        subtotal += lineTotal;

                        resolvedItems.push({
                            menuItem: menuItem._id,
                            nameEn: menuItem.nameEn,
                            nameAr: menuItem.nameAr,
                            price,
                            quantity,
                            lineTotal
                        });
                    }
                }

                if (resolvedItems.length === 0) {
                    return {
                        success: false,
                        message: "لم يتم العثور على الأصناف المطلوبة في قائمة الطعام الحالية. يرجى مراجعة أسماء الأصناف."
                    };
                }

                const deliveryFee = orderType === "delivery" ? 25 : 0;
                const totalAmount = subtotal + deliveryFee;

                let orderCode = generateRandomCode("MN");
                while (await MenuOrder.findOne({ orderCode })) {
                    orderCode = generateRandomCode("MN");
                }

                const newOrder = await MenuOrder.create({
                    orderCode,
                    customerName,
                    customerPhone,
                    orderType,
                    deliveryAddress,
                    deliveryNotes,
                    items: resolvedItems,
                    subtotal,
                    deliveryFee,
                    vatAmount: 0,
                    totalAmount,
                    paymentMethod,
                    paymentStatus: "pending",
                    status: "confirmed"
                });

                return {
                    success: true,
                    message: "تم إنشاء طلب الطعام بنجاح!",
                    orderSummary: {
                        orderCode: newOrder.orderCode,
                        customerName: newOrder.customerName,
                        orderType: newOrder.orderType,
                        itemsCount: resolvedItems.length,
                        items: resolvedItems.map(i => `${i.nameAr || i.nameEn} (×${i.quantity}) - ${i.lineTotal} ج.م`),
                        subtotal,
                        deliveryFee,
                        totalAmount,
                        estimatedTime: orderType === "delivery" ? "30-45 دقيقة" : "15-20 دقيقة",
                        status: newOrder.status
                    }
                };
            }

            case "checkOrderStatus": {
                const { code } = args;
                const cleanCode = code.trim().toUpperCase();

                // 1. Table Booking
                if (cleanCode.startsWith("TB-")) {
                    const booking = await BookingTable.findOne({ bookingCode: cleanCode }).lean();
                    if (booking) {
                        return {
                            success: true,
                            type: "table_booking",
                            bookingCode: booking.bookingCode,
                            guestName: booking.guestName,
                            area: booking.area,
                            date: new Date(booking.date).toISOString().split("T")[0],
                            time: booking.time,
                            numberOfPerson: booking.numberOfPerson,
                            status: booking.status
                        };
                    }
                }

                // 2. Menu Restaurant Order
                if (cleanCode.startsWith("MN-")) {
                    const menuOrder = await MenuOrder.findOne({ orderCode: cleanCode }).lean();
                    if (menuOrder) {
                        return {
                            success: true,
                            type: "menu_order",
                            orderCode: menuOrder.orderCode,
                            customerName: menuOrder.customerName,
                            orderType: menuOrder.orderType,
                            totalAmount: menuOrder.totalAmount,
                            status: menuOrder.status,
                            createdAt: menuOrder.createdAt
                        };
                    }
                }

                // 3. Tickets / Packages Buying Order
                if (cleanCode.startsWith("PZ-")) {
                    const buyOrder = await BuyingOrder.findOne({ orderCode: cleanCode }).lean();
                    if (buyOrder) {
                        return {
                            success: true,
                            type: "tickets_buying_order",
                            orderCode: buyOrder.orderCode,
                            guestName: buyOrder.guestName,
                            totalAmount: buyOrder.totalAmount,
                            status: buyOrder.status,
                            paymentStatus: buyOrder.paymentStatus
                        };
                    }
                }

                // Search across all if prefix wasn't matching
                const bookingSearch = await BookingTable.findOne({ bookingCode: cleanCode }).lean();
                if (bookingSearch) {
                    return { success: true, type: "table_booking", ...bookingSearch };
                }

                const menuSearch = await MenuOrder.findOne({ orderCode: cleanCode }).lean();
                if (menuSearch) {
                    return { success: true, type: "menu_order", ...menuSearch };
                }

                const buyingSearch = await BuyingOrder.findOne({ orderCode: cleanCode }).lean();
                if (buyingSearch) {
                    return { success: true, type: "buying_order", ...buyingSearch };
                }

                return {
                    success: false,
                    message: `لم نتمكن من العثور على أي حجز أو طلب بالكود: ${cleanCode}. يرجى التحقق من صحة الكود.`
                };
            }

            case "getParkInfo": {
                const info = {
                    parkName: "أمريكان دريم (American Dream Kids Area & Restaurant)",
                    location: "القاهرة - مصر، مجمع الترفيه والمطاعم",
                    workingHours: "يومياً من 10:00 صباحاً حتى 12:00 منتصف الليل (أيام العطلات حتى 1:00 صباحاً)",
                    zones: [
                        { name: "funZone", title: "منطقة المرح", desc: "ألعاب حركية ومطاطية وترامبولين للأطفال" },
                        { name: "kidsArea", title: "منطقة الأطفال الصغار", desc: "ألعاب آمنة وتفاعلية للأطفال دون 6 سنوات" },
                        { name: "challengeZone", title: "منطقة التحدي", desc: "ألعاب ذكاء وتحديات وتسلق" },
                        { name: "adventureZone", title: "منطقة المغامرات", desc: "متاهات وسيارات سباق وتجارب شيقة" }
                    ],
                    restaurant: {
                        areas: ["Family 1", "Family 2", "Family 3", "Roof", "Indoor", "Relaxation Area"],
                        cuisines: ["برجر أمريكي فاخر", "بيتزا إيطالية", "مشويات", "وجبات أطفال", "عصائر وحلويات ومشروبات ساخنة"]
                    },
                    contact: {
                        phone: "01000000000 / 01100000000",
                        whatsapp: "01000000000",
                        email: "support@americandream.com"
                    },
                    safetyRules: [
                        "ارتداء الجوارب الخاصة في منطقة الألعاب إلزامي",
                        "ممنوع إدخال المأكولات والمشروبات من خارج المجمع",
                        "يجب وجود مرافق للأطفال أقل من 4 سنوات"
                    ]
                };

                if (args.topic === "hours") return { success: true, hours: info.workingHours };
                if (args.topic === "location") return { success: true, location: info.location };
                if (args.topic === "contact") return { success: true, contact: info.contact };
                if (args.topic === "rules") return { success: true, rules: info.safetyRules };

                return { success: true, ...info };
            }

            default:
                return { success: false, message: `Tool '${name}' not implemented` };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || "حدث خطأ أثناء تنفيذ الأداة"
        };
    }
};

module.exports = {
    chatbotToolDeclarations,
    executeChatbotTool
};
