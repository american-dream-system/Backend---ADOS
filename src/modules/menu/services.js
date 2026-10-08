const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const menuItemModel = require("./model");
const menuOrderModel = require("./orderModel");

// @desc Middleware to resize and save uploaded menu item image
const resizeMenuItemImage = async (req, res, next) => {
    try {
        if (req.file) {
            const uploadDir = path.join("upload", "menu");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `menu-${Date.now()}.jpeg`;
            await sharp(req.file.buffer)
                .resize(1024, 1024, {
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(path.join(uploadDir, fileName));

            req.body.image = `/upload/menu/${fileName}`;
        }
        next();
    } catch (error) {
        next(error);
    }
};

// @desc Seed items list representing the restaurant & cafe menu
const SEED_MENU_ITEMS = [
    {
        nameEn: "Artisanal Brioche Cheeseburger Meal",
        nameAr: "وجبة برجر البريوش بالجبنة الفاخرة",
        descEn: "Freshly grilled beef patty, melted cheddar, crispy shoestring fries & signature sauce",
        descAr: "برجر لحم مشوي طازج مع جبن الشيدر الذائب، بطاطس مقرمشة وصوص أمريكان دريم الخاص",
        price: 185,
        priceAfterDiscount: 165,
        category: "burgers",
        rating: 4.9,
        image: "/photo/kid area pic/Freshly grilled brioche cheeseburger with crispy shoestring fries and artisanal dip in craft takeaway presentation.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Waterfront Sunset Mixed Grill",
        nameAr: "مشاوي الواجهة المائية المشكلة",
        descEn: "Tender kebab skewers, shish tawook, grilled kofta, basmati rice & fresh salads",
        descAr: "كباب وكفتة وشيش طاووق متبل على الفحم يقدم مع أرز بسمتي وسلطات طازجة",
        price: 340,
        priceAfterDiscount: 310,
        category: "grills",
        rating: 5.0,
        image: "/photo/kid area pic/Canal-side sunset dinner terrace with warm string lights, dining tables, grilled meats, salads, and sparkling water.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Italian Stone-Baked Quattro Formaggi",
        nameAr: "بيتزا الأجبان الأربعة الحجرية",
        descEn: "Authentic thin crust pizza with mozzarella, parmesan, gorgonzola & fresh basil",
        descAr: "عجينة إيطالية هشة ومقرمشة مع مزيج 4 أجبان فاخرة وصلصة الطماطم الإيطالية",
        price: 175,
        priceAfterDiscount: 155,
        category: "pizza",
        rating: 4.8,
        image: "/photo/kid area pic/mosaic-card-2.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Island Breeze Mango Mocktail",
        nameAr: "كوكتيل نسيم الجزيرة بالمانجو",
        descEn: "Fresh Ismailia mango puree, passion fruit syrup, sparkling soda & mint",
        descAr: "مانجو إسماعيلية طازجة مع باشن فروت وصودا منعشة وأوراق النعناع",
        price: 70,
        priceAfterDiscount: 60,
        category: "drinks",
        rating: 4.9,
        image: "/photo/kid area pic/Image (1).png",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Iced Caramel Macchiato & Latte",
        nameAr: "آيسد كراميل ماكياتو ولاتيه إسباني",
        descEn: "Premium double espresso shots, chilled steamed milk & golden buttery caramel drizzle",
        descAr: "إسبريسو فاخر مع حليب بارد وصلصة كراميل غنية ومثلجة على ضفاف القناة",
        price: 65,
        priceAfterDiscount: 55,
        category: "coffee",
        rating: 4.8,
        image: "/photo/kid area pic/Image (2).png",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Super Kid Chicken Nuggets",
        nameAr: "وجبة ناجتس الدجاج الابطال",
        descEn: "6 pcs golden nuggets + french fries + apple juice",
        descAr: "٦ قطع ناجتس مقرمشة + بطاطس + عصير تفاح",
        price: 120,
        priceAfterDiscount: 110,
        category: "meals",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Mini Dream Cheeseburger",
        nameAr: "ميني تشيز برجر دريم",
        descEn: "Juicy beef mini patty + cheese + crispy fries",
        descAr: "برجر لحم بقري طازج + جبنة + بطاطس مقرمشة",
        price: 135,
        priceAfterDiscount: 125,
        category: "meals",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Cheesy Kids Pizza Slice",
        nameAr: "شريحة بيتزا الموزاريلا",
        descEn: "Rich mozzarella cheese pizza slice with fresh tomato sauce",
        descAr: "شريحة بيتزا بجبن الموزاريلا الغنية وصلصة الطماطم",
        price: 95,
        priceAfterDiscount: 85,
        category: "meals",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Fresh Mango Sunshine Smoothie",
        nameAr: "سموذي المانجو الطازج",
        descEn: "100% real fresh mango juice topped with vanilla drizzle",
        descAr: "عصير مانجو طازج ١٠٠٪ مع لمسة فانيليا",
        price: 65,
        priceAfterDiscount: 55,
        category: "drinks",
        rating: 5.0,
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Berry Blast Milkshake",
        nameAr: "ميلك شيك التوت البري",
        descEn: "Creamy strawberry & blueberry blend with whipped cream",
        descAr: "مزيج الفرولة والتوت البري مع الكريمة المخفوقة",
        price: 75,
        priceAfterDiscount: 65,
        category: "drinks",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Rainbow Ice Cream Sundae",
        nameAr: "آيس كريم رينبو صنداي",
        descEn: "3 scoops vanilla, chocolate & strawberry with sprinkles",
        descAr: "٣ بولات آيس كريم متنوعة مع السكر الملون",
        price: 70,
        priceAfterDiscount: 60,
        category: "sweets",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Caramel Butter Popcorn Bucket",
        nameAr: "دلو بوب كورن بالكراميل",
        descEn: "Freshly popped warm popcorn with rich caramel coating",
        descAr: "فشار طازج وساخن بصلصة الكراميل الغنية",
        price: 55,
        priceAfterDiscount: 45,
        category: "sweets",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500&auto=format&fit=crop&q=80",
        isChefSpecial: false,
        available: true
    },
    {
        nameEn: "Classic Gourmet Smashed Burger",
        nameAr: "كلاسيك جورميه سماشد برجر",
        descEn: "Double smash patties, aged melted cheddar, crisp romaine, caramelized onions & signature house relish",
        descAr: "شريحتان سماش لحم بقري بلدي، شيدر معتق ذائب، خس مقرمش، بصل مكرمل وصوص دريم السري المميز",
        price: 180,
        priceAfterDiscount: 160,
        category: "burgers",
        rating: 4.9,
        image: "/photo/kid area pic/dish_burger.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Artisanal Margherita Bufala Pizza",
        nameAr: "بيتزا مارجريتا بوفالو الحرفية",
        descEn: "Hand-stretched Neapolitan crust, San Marzano tomato coulis, fresh buffalo mozzarella, fresh sweet basil",
        descAr: "عجينة نابوليتان هشة مخبوزة على الحجر، صلصة سان مارزانو، موزاريلا بافلو طازجة وريحان عطري",
        price: 220,
        priceAfterDiscount: 195,
        category: "pizza",
        rating: 4.9,
        image: "/photo/kid area pic/dish_pizza.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Iced Salted Caramel Barista Latte",
        nameAr: "آيسد سولتد كراميل باريستا لاتيه",
        descEn: "Double shot specialty espresso, silky steamed oat milk, handcrafted salted caramel drizzle over crystal ice",
        descAr: "دبل شوت إسبريسو كولومبي فاخر، حليب بارد حريري، صلصة كراميل مملح ومكعبات ثلج كريستالية",
        price: 90,
        priceAfterDiscount: 80,
        category: "coffee",
        rating: 4.8,
        image: "/photo/kid area pic/dish_latte.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "American Dream Crispy Deluxe Box",
        nameAr: "أمريكان دريم كريسبي ديلوكس بوكس",
        descEn: "Juicy craft burger, seasoned crinkle fries, creamy dipping sauce, and cold craft beverage in eco box",
        descAr: "برجر كرافت جوسي شهي، بطاطس كرينكل مقرمشة مبهرة، صوص تغميس كريمي ومشروب بارد في بوكس مميز",
        price: 260,
        priceAfterDiscount: 235,
        category: "meals",
        rating: 5.0,
        image: "/photo/kid area pic/dish_deluxe_box.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Decadent Valrhona Fudge Cake",
        nameAr: "كيك فادج شوكولاتة فالرونا الفاخرة",
        descEn: "Warm layered Belgian chocolate sponge, silky dark ganache, fresh canal raspberries & mint leaves",
        descAr: "طبقات كيك شوكولاتة بلجيكية دافئة غنية بالجناش الحريري، توت العليق الطازج وأوراق النعناع",
        price: 140,
        priceAfterDiscount: 125,
        category: "sweets",
        rating: 4.9,
        image: "/photo/kid area pic/dish_cake.png",
        isChefSpecial: true,
        available: true
    },
    {
        nameEn: "Passionfruit Mango Breeze Cooler",
        nameAr: "باشن فروت ومانجو بريز كولر المنعش",
        descEn: "Cold-pressed ripe mango, tangy passionfruit pulp, fresh mint leaves, crushed ice & sparkling soda",
        descAr: "عصير مانجو إسماعيلية طازج معصور بارداً، لب باشن فروت حامض حلو، نعناع طازج وصودا فوارة",
        price: 95,
        priceAfterDiscount: 85,
        category: "drinks",
        rating: 4.9,
        image: "/photo/kid area pic/dish_cooler.png",
        isChefSpecial: true,
        available: true
    }
];

// @desc Seed restaurant menu with default items
// @route POST /api/menu/seed
const seedMenu = async (req, res, next) => {
    try {
        const force = req.query.force === "true";
        const count = await menuItemModel.countDocuments();
        if (count > 0 && !force) {
            const items = await menuItemModel.find();
            return res.status(200).json({
                success: true,
                message: "قائمة الطعام ممتلئة بالفعل",
                count: items.length,
                data: items
            });
        }

        if (force) {
            await menuItemModel.deleteMany({});
        }

        const insertedItems = await menuItemModel.insertMany(SEED_MENU_ITEMS);
        res.status(201).json({
            success: true,
            message: `تم إضافة ${insertedItems.length} صنف إلى قائمة الطعام بنجاح`,
            count: insertedItems.length,
            data: insertedItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc Create a new menu item
// @route POST /api/menu
const createMenuItem = async (req, res, next) => {
    try {
        const newItem = await menuItemModel.create(req.body);
        res.status(201).json({
            success: true,
            message: "تم إنشاء الصنف في قائمة الطعام بنجاح",
            data: newItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all menu items with search & filters
// @route GET /api/menu
const getAllMenuItems = async (req, res, next) => {
    try {
        const { category, search, isChefSpecial, available, minPrice, maxPrice, sort } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const filter = {};

        // Category filter
        if (category && category !== "all") {
            // Map common aliases
            if (category === "food") {
                filter.category = { $in: ["burgers", "pizza", "grills", "meals", "food"] };
            } else if (category === "cafe") {
                filter.category = { $in: ["coffee", "drinks", "cafe"] };
            } else if (category === "desserts") {
                filter.category = { $in: ["sweets", "desserts"] };
            } else {
                filter.category = category;
            }
        }

        // Available filter
        if (available !== undefined) {
            filter.available = available === "true";
        }

        // Chef special filter
        if (isChefSpecial !== undefined) {
            filter.isChefSpecial = isChefSpecial === "true";
        }

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search in English & Arabic titles/descriptions
        if (search) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { nameEn: regex },
                { nameAr: regex },
                { descEn: regex },
                { descAr: regex }
            ];
        }

        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") sortOption = { price: 1 };
        if (sort === "price_desc") sortOption = { price: -1 };
        if (sort === "rating") sortOption = { rating: -1 };
        if (sort === "name") sortOption = { nameEn: 1 };

        const totalItems = await menuItemModel.countDocuments(filter);
        const items = await menuItemModel.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: items.length,
            total: totalItems,
            page,
            pages: Math.ceil(totalItems / limit) || 1,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get distinct categories with item counts
// @route GET /api/menu/categories
const getCategories = async (req, res, next) => {
    try {
        const stats = await menuItemModel.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const categories = stats.map(s => ({
            category: s._id,
            count: s.count
        }));

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get a single menu item by ID
// @route GET /api/menu/:id
const getMenuItemById = async (req, res, next) => {
    try {
        const item = await menuItemModel.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "الصنف غير موجود بقائمة الطعام"
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update a menu item by ID
// @route PUT /api/menu/:id
const updateMenuItem = async (req, res, next) => {
    try {
        const updatedItem = await menuItemModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: "الصنف غير موجود للتعديل"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم تحديث بيانات الصنف بنجاح",
            data: updatedItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc Delete a menu item by ID
// @route DELETE /api/menu/:id
const deleteMenuItem = async (req, res, next) => {
    try {
        const item = await menuItemModel.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: "الصنف غير موجود للحذف"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم حذف الصنف من قائمة الطعام بنجاح"
        });
    } catch (error) {
        next(error);
    }
};

// @desc Place a quick or delivery food order
// @route POST /api/menu/order
const placeOrder = async (req, res, next) => {
    try {
        const {
            customerName,
            customerPhone,
            deliveryAddress,
            deliveryNotes,
            orderType = "delivery",
            items = [],
            paymentMethod = "cod"
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "قائمة الأصناف مطلوبة ويجب أن تحتوي على صنف واحد على الأقل"
            });
        }

        // Generate unique order code
        const codeNumber = Math.floor(1000 + Math.random() * 9000);
        const orderCode = orderType === "delivery" ? `AD-DLV-${codeNumber}` : `ORD-${codeNumber}`;

        // Normalize items and compute totals
        let subtotal = 0;
        const normalizedItems = items.map(item => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.qty || item.quantity || 1);
            const lineTotal = price * quantity;
            subtotal += lineTotal;

            return {
                menuItem: item.menuItem || (item.id && item.id.length === 24 ? item.id : undefined),
                nameEn: item.nameEn || item.title || "Menu Item",
                nameAr: item.nameAr || item.nameEn || "صنف من القائمة",
                price: price,
                quantity: quantity,
                lineTotal: lineTotal
            };
        });

        // Delivery fee & optional VAT logic matching frontend
        const deliveryFee = orderType === "delivery" ? (subtotal > 0 ? (req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) : 25) : 0) : 0;
        const vatAmount = req.body.vatAmount !== undefined ? Number(req.body.vatAmount) : 0;
        const totalAmount = subtotal + deliveryFee + vatAmount;

        const newOrder = await menuOrderModel.create({
            orderCode,
            customerName: customerName || "Guest Customer",
            customerPhone: customerPhone || "N/A",
            deliveryAddress: deliveryAddress || "Dine-in / Pickup",
            deliveryNotes: deliveryNotes || "",
            orderType,
            items: normalizedItems,
            subtotal,
            deliveryFee,
            vatAmount,
            totalAmount,
            paymentMethod,
            status: "pending"
        });

        res.status(201).json({
            success: true,
            message: "تم استلام الطلب بنجاح",
            orderId: newOrder.orderCode,
            orderCode: newOrder.orderCode,
            data: newOrder,
            items: newOrder.items
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get all restaurant food orders
// @route GET /api/menu/orders
const getAllOrders = async (req, res, next) => {
    try {
        const { status, phone, orderType } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;
        if (orderType) filter.orderType = orderType;
        if (phone) filter.customerPhone = new RegExp(phone.trim(), "i");

        const totalOrders = await menuOrderModel.countDocuments(filter);
        const orders = await menuOrderModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: orders.length,
            total: totalOrders,
            page,
            pages: Math.ceil(totalOrders / limit) || 1,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc Get an order by ID or orderCode
// @route GET /api/menu/orders/:id
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let order;

        if (id.startsWith("ORD-") || id.startsWith("AD-DLV-")) {
            order = await menuOrderModel.findOne({ orderCode: id });
        } else {
            order = await menuOrderModel.findById(id);
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "الطلب غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update an order status
// @route PUT /api/menu/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `حالة الطلب غير صالحة، الحالات المتاحة هي: ${allowedStatuses.join(", ")}`
            });
        }

        let order;
        if (id.startsWith("ORD-") || id.startsWith("AD-DLV-")) {
            order = await menuOrderModel.findOneAndUpdate(
                { orderCode: id },
                { status },
                { new: true }
            );
        } else {
            order = await menuOrderModel.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "الطلب غير موجود"
            });
        }

        res.status(200).json({
            success: true,
            message: "تم تحديث حالة الطلب بنجاح",
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    resizeMenuItemImage,
    seedMenu,
    createMenuItem,
    getAllMenuItems,
    getCategories,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    placeOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus
};
