/**
 * Reset System to Pristine State for Client Delivery
 * - Cleans test Media collection entries
 * - Seeds canonical official Media records
 * - Resets Tickets to standard official prices
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Media = require("../src/modules/media/model");
const Ticket = require("../src/modules/tickets/model");

const canonicalMedia = [
  // 1. Home Hero
  {
    page: "home",
    section: "hero",
    name: "home-hero",
    title: "American Dream Park",
    titleAr: "أمريكان دريم بارك",
    subtitle: "The ultimate entertainment destination for family and children",
    subtitleAr: "الوجهة الترفيهية المتكاملة للعائلات والأطفال",
    images: [
      "/photo/auabdui.png",
      "/photo/11515.png",
      "/photo/the last.png",
      "/photo/eeeee.png"
    ],
    items: [],
    isActive: true
  },

  // 2. Home Destination Mosaic (4 Highlights)
  {
    page: "home",
    section: "destination",
    name: "home-destination",
    title: "The Ultimate Destination",
    titleAr: "الوجهة الترفيهية المتكاملة",
    images: [
      "/photo/kid-area-pic/Kids sliding into colorful ball pit.png",
      "/photo/kid-area-pic/Family bumper car arena.png",
      "/photo/kid-area-pic/Laser & Tactical Arena.png",
      "/photo/kid-area-pic/Junior GP Speedway.png"
    ],
    items: [
      {
        slot: "mosaic_card_1",
        title: "Kids Area",
        titleAr: "منطقة الأطفال",
        subtitle: "Safe exploration, soft ball pits & creative joy",
        subtitleAr: "استكشاف آمن ومرح لا ينتهي للصغار",
        image: "/photo/kid-area-pic/Kids sliding into colorful ball pit.png",
        badge: "Ages 1 - 3",
        badgeAr: "الأعمار: 1 - 3 سنوات",
        actionType: "link",
        actionTarget: "kids-area",
        order: 1,
        isActive: true
      },
      {
        slot: "mosaic_card_2",
        title: "Fun Park",
        titleAr: "منطقة المرح",
        subtitle: "Family bumper cars, carousel & merry rides",
        subtitleAr: "سيارات تصادم، قطارات وألعاب جماعية مبهجة",
        image: "/photo/kid-area-pic/Family bumper car arena.png",
        badge: "Ages 4 - 12",
        badgeAr: "الأعمار: 4 - 12 سنة",
        actionType: "link",
        actionTarget: "fun-park",
        order: 2,
        isActive: true
      },
      {
        slot: "mosaic_card_3",
        title: "Challenge Zone",
        titleAr: "منطقة التحدي",
        subtitle: "Arcade games, basketball machines & air hockey",
        subtitleAr: "ألعاب مهارية، ماكينات ملاكمة وهوكي هوائي",
        image: "/photo/kid-area-pic/Laser & Tactical Arena.png",
        badge: "Arcade & Fun",
        badgeAr: "ألعاب أركيد وحماس",
        actionType: "link",
        actionTarget: "challenge",
        order: 3,
        isActive: true
      },
      {
        slot: "mosaic_card_4",
        title: "Adventure Zone",
        titleAr: "منطقة المغامرة",
        subtitle: "High ropes, bumper clash, VR arena & thrilling action",
        subtitleAr: "حلبات ببجي، كرات بامبر وعوالم افتراضية مشوقة",
        image: "/photo/kid-area-pic/Junior GP Speedway.png",
        badge: "Action Pass",
        badgeAr: "حماس ومغامرة",
        actionType: "link",
        actionTarget: "adventure",
        order: 4,
        isActive: true
      }
    ],
    isActive: true
  },

  // 3. Kids Area Hero
  {
    page: "kids-area",
    section: "hero",
    name: "kids-area-hero",
    title: "Kids Area",
    titleAr: "منطقة الأطفال",
    subtitle: "Safe fun & joyful moments for little champions",
    subtitleAr: "مرح آمن وذكريات سعيدة لأبطالنا الصغار",
    images: [
      "/photo/kid-area-pic/Kids sliding into colorful ball pit.png",
      "/photo/kid-area-pic/Toddler laughing in soft ball pit.png"
    ],
    items: [],
    isActive: true
  },

  // 4. Kids Area Explore
  {
    page: "kids-area",
    section: "explore",
    name: "kids-area-explore",
    title: "Explore Kids Area",
    titleAr: "استكشف منطقة الأطفال",
    images: [
      "/photo/kid-area-pic/Toddler laughing in soft ball pit.png",
      "/photo/kid-area-pic/explore-softplay.png",
      "/photo/kid-area-pic/Boy laughing playing with toys.png"
    ],
    items: [
      { slot: "explore_1", title: "Ball Pit Joy", titleAr: "مسبح الكرات الملون", image: "/photo/kid-area-pic/Toddler laughing in soft ball pit.png", order: 1, isActive: true },
      { slot: "explore_2", title: "Soft Play Maze", titleAr: "متاهة الألعاب الإسفنجية", image: "/photo/kid-area-pic/explore-softplay.png", order: 2, isActive: true },
      { slot: "explore_3", title: "Art Workshop", titleAr: "ورش الرسم والتلوين", image: "/photo/kid-area-pic/Boy laughing playing with toys.png", order: 3, isActive: true }
    ],
    isActive: true
  },

  // 5. Fun Park Hero
  {
    page: "fun-park",
    section: "hero",
    name: "fun-park-hero",
    title: "Fun Park",
    titleAr: "منطقة المرح",
    subtitle: "A world of fun, laughter, and endless smiles",
    subtitleAr: "عالم من المرح والضحك والابتسامات التي لا تنتهي",
    images: [
      "/photo/kid-area-pic/funpark-banner.png",
      "/photo/kid-area-pic/Classic illuminated carousel ride.png",
      "/photo/kid-area-pic/Family bumper car arena.png"
    ],
    items: [],
    isActive: true
  },

  // 6. Fun Park Explore
  {
    page: "fun-park",
    section: "explore",
    name: "fun-park-explore",
    title: "Explore Fun Park",
    titleAr: "استكشف منطقة المرح",
    images: [
      "/photo/kid-area-pic/Bumper Collision Bay.png",
      "/photo/kid-area-pic/Classic illuminated carousel ride.png",
      "/photo/kid-area-pic/Junior GP Speedway.png"
    ],
    items: [
      { slot: "explore_1", title: "Bumper Cars", titleAr: "سيارات التصادم العائلية", image: "/photo/kid-area-pic/Bumper Collision Bay.png", order: 1, isActive: true },
      { slot: "explore_2", title: "Classic Carousel", titleAr: "الدوامة الكلاسيكية المضيئة", image: "/photo/kid-area-pic/Classic illuminated carousel ride.png", order: 2, isActive: true },
      { slot: "explore_3", title: "Junior Speedway", titleAr: "سباق الجو كارت للصغار", image: "/photo/kid-area-pic/Junior GP Speedway.png", order: 3, isActive: true }
    ],
    isActive: true
  },

  // 7. Challenge Zone Hero
  {
    page: "challenge",
    section: "hero",
    name: "challenge-hero",
    title: "Challenge Zone",
    titleAr: "منطقة التحدي",
    subtitle: "Test your skills, reflexes, and athletic power",
    subtitleAr: "اختبر مهاراتك وسرعة ردود أفعالك وقوتك البدنية",
    images: [
      "/photo/kid-area-pic/Laser & Tactical Arena.png",
      "/photo/kid-area-pic/Air Hockey Table.png",
      "/photo/kid-area-pic/Boxing Punch Machine.png"
    ],
    items: [],
    isActive: true
  },

  // 8. Challenge Zone Explore
  {
    page: "challenge",
    section: "explore",
    name: "challenge-explore",
    title: "Explore Challenge Zone",
    titleAr: "استكشف منطقة التحدي",
    images: [
      "/photo/kid-area-pic/Laser & Tactical Arena.png",
      "/photo/kid-area-pic/Air Hockey Table.png",
      "/photo/kid-area-pic/Boxing Punch Machine.png"
    ],
    items: [
      { slot: "explore_1", title: "Tactical Arena", titleAr: "ساحة الرماية بالليزر", image: "/photo/kid-area-pic/Laser & Tactical Arena.png", order: 1, isActive: true },
      { slot: "explore_2", title: "Air Hockey", titleAr: "هوكي الهواء السريع", image: "/photo/kid-area-pic/Air Hockey Table.png", order: 2, isActive: true },
      { slot: "explore_3", title: "Boxing Challenge", titleAr: "تحدي قوة اللكمة", image: "/photo/kid-area-pic/Boxing Punch Machine.png", order: 3, isActive: true }
    ],
    isActive: true
  },

  // 9. Adventure Zone Hero
  {
    page: "adventure",
    section: "hero",
    name: "adventure-hero",
    title: "Adventure Zone",
    titleAr: "منطقة المغامرة",
    subtitle: "High adrenaline, VR immersion & real thrills",
    subtitleAr: "أعلى درجات الإثارة والواقع الافتراضي والمغامرة الواقعية",
    images: [
      "/photo/kid-area-pic/Junior GP Speedway.png",
      "/photo/kid-area-pic/High-Octane Racing.png",
      "/photo/kid-area-pic/Bumper Collision Bay.png"
    ],
    items: [],
    isActive: true
  },

  // 10. Adventure Zone Explore
  {
    page: "adventure",
    section: "explore",
    name: "adventure-explore",
    title: "Explore Adventure Zone",
    titleAr: "استكشف منطقة المغامرة",
    images: [
      "/photo/kid-area-pic/Laser & Tactical Arena.png",
      "/photo/kid-area-pic/Air Hockey Table.png",
      "/photo/kid-area-pic/Billiards Pool Table.png"
    ],
    items: [
      { slot: "explore_1", title: "PUBG Arena", titleAr: "حلبة ببجي الواقعية", image: "/photo/kid-area-pic/Laser & Tactical Arena.png", order: 1, isActive: true },
      { slot: "explore_2", title: "Bamber Ball", titleAr: "كرات البامبر الكروية", image: "/photo/kid-area-pic/Air Hockey Table.png", order: 2, isActive: true },
      { slot: "explore_3", title: "Car Clash", titleAr: "صدام السيارات الكهربائي", image: "/photo/kid-area-pic/Billiards Pool Table.png", order: 3, isActive: true }
    ],
    isActive: true
  },

  // 11. Restaurant Experiences
  {
    page: "restaurant",
    section: "experiences",
    name: "restaurant-experiences",
    title: "Dining Experiences",
    titleAr: "تجارب تناول الطعام المميزة",
    images: [
      "/photo/kid-area-pic/restaurant-family-table.png",
      "/photo/kid-area-pic/restaurant-menu-preview.png",
      "/photo/kid-area-pic/restaurant-delivery-scooter.png"
    ],
    items: [
      {
        slot: "table_booking",
        title: "VIP Table Booking",
        titleAr: "حجز طاولة VIP خاصة",
        subtitle: "Family & private seating with royal service",
        subtitleAr: "جلسات عائلية وخاصة مع خدمة ضيافة راقية",
        image: "/photo/kid-area-pic/restaurant-family-table.png",
        badge: "Exclusive",
        badgeAr: "خدمة مميزة",
        order: 1,
        isActive: true
      },
      {
        slot: "digital_menu",
        title: "Digital Food Menu",
        titleAr: "قائمة الطعام الرقمية",
        subtitle: "Browse gourmet burgers, pizzas & kids meals",
        subtitleAr: "تصفح أشهى البرجر والبيتزا ووجبات الأطفال",
        image: "/photo/kid-area-pic/restaurant-menu-preview.png",
        badge: "Live Order",
        badgeAr: "طلب مباشر",
        order: 2,
        isActive: true
      },
      {
        slot: "delivery",
        title: "Speed Delivery Service",
        titleAr: "خدمة التوصيل السريع",
        subtitle: "Hot fresh meals delivered across the whole park",
        subtitleAr: "وجبات ساخنة وطازجة تصلك لأي مكان بالبارك",
        image: "/photo/kid-area-pic/restaurant-delivery-scooter.png",
        badge: "Express",
        badgeAr: "توصيل سريع",
        order: 3,
        isActive: true
      }
    ],
    isActive: true
  }
];

const standardTickets = [
  // Kids Area
  {
    _id: "6ac8a1c79add9600f9903ca9",
    title: "تذكرة فردية منتصف الأسبوع",
    titleAr: "تذكرة فردية منتصف الأسبوع",
    titleEn: "Single Midweek",
    page: "kidsArea",
    timing: "midweek",
    price: 185,
    priceAfterDiscount: 100,
    saveBadge: "وفر 85 ج.م",
    saveBadgeAr: "وفر 85 ج.م",
    saveBadgeEn: "SAVE 85 EGP",
    badgeColor: "badge-cyan",
    age: "من سن 1 - 3 سنوات",
    ageAr: "من سن 1 - 3 سنوات",
    features: ["All-day entry + 1 Package", "جبس وألوان"],
    featuresAr: ["دخول طوال اليوم + باقة واحدة", "جبس وألوان"],
    bundle: "All-day entry + 1 Package جبس وألوان",
    bundleAr: "دخول طوال اليوم + باقة واحدة جبس وألوان",
    image: "/photo/kid-area-pic/Kids sliding into colorful ball pit.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 10
  },
  {
    _id: "6ac8a1c79add9600f9903caa",
    title: "تذكرة الأختين منتصف الأسبوع",
    titleAr: "تذكرة الأختين منتصف الأسبوع",
    titleEn: "Sisters Midweek",
    page: "kidsArea",
    timing: "midweek",
    price: 300,
    priceAfterDiscount: 150,
    saveBadge: "وفر 150 ج.م",
    saveBadgeAr: "وفر 150 ج.م",
    saveBadgeEn: "SAVE 150 EGP",
    badgeColor: "badge-blue",
    age: "من سن 1 - 3 سنوات",
    ageAr: "من سن 1 - 3 سنوات",
    features: ["All-day entry for 2 kids"],
    featuresAr: ["دخول طوال اليوم لطفلين"],
    bundle: "All-day entry for 2 kids",
    bundleAr: "دخول طوال اليوم لطفلين",
    image: "/photo/kid-area-pic/Classic illuminated carousel ride.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 15
  },
  {
    _id: "6ac8a1c79add9600f9903cab",
    title: "تذكرة فردية نهاية الأسبوع",
    titleAr: "تذكرة فردية نهاية الأسبوع",
    titleEn: "Single Weekend",
    page: "kidsArea",
    timing: "weekend",
    price: 185,
    priceAfterDiscount: 150,
    saveBadge: "وفر 35 ج.م",
    saveBadgeAr: "وفر 35 ج.م",
    saveBadgeEn: "SAVE 35 EGP",
    badgeColor: "badge-cyan",
    age: "من سن 1 - 3 سنوات",
    ageAr: "من سن 1 - 3 سنوات",
    features: ["All-day entry + 1 Package", "جبس وألوان", "+ Free coloring workshop + Party included"],
    featuresAr: ["دخول طوال اليوم + باقة واحدة", "جبس وألوان", "+ ورشة تلوين مجانية + حضور الحفلة"],
    bundle: "All-day entry + 1 Package جبس وألوان",
    bundleAr: "دخول طوال اليوم + باقة واحدة جبس وألوان",
    image: "/photo/kid-area-pic/kids-ball-pit-slide.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 15
  },
  {
    _id: "6ac8a1c79add9600f9903cac",
    title: "تذكرة الأختين نهاية الأسبوع",
    titleAr: "تذكرة الأختين نهاية الأسبوع",
    titleEn: "Sisters Weekend",
    page: "kidsArea",
    timing: "weekend",
    price: 370,
    priceAfterDiscount: 250,
    saveBadge: "وفر 120 ج.م",
    saveBadgeAr: "وفر 120 ج.م",
    saveBadgeEn: "SAVE 120 EGP",
    badgeColor: "badge-blue",
    age: "من سن 1 - 3 سنوات",
    ageAr: "من سن 1 - 3 سنوات",
    features: ["Entry for 2 kids + 2 Package", "جبس وألوان", "+ Free coloring workshop + Party included"],
    featuresAr: ["دخول لطفلين + باقتين", "جبس وألوان", "+ ورشة تلوين مجانية + حضور الحفلة"],
    bundle: "Entry for 2 kids + 2 Package جبس وألوان",
    bundleAr: "دخول لطفلين + باقتين جبس وألوان",
    image: "/photo/kid-area-pic/Boy laughing playing with toys.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 25
  },

  // Fun Park
  {
    _id: "6ac8a1c79add9600f9903cad",
    title: "تذكرة فردية نهاية الأسبوع للمرح",
    titleAr: "تذكرة فردية نهاية الأسبوع للمرح",
    titleEn: "Single Weekend",
    page: "funZone",
    timing: "weekend",
    price: 185,
    priceAfterDiscount: 100,
    saveBadge: "وفر 85 ج.م",
    saveBadgeAr: "وفر 85 ج.م",
    saveBadgeEn: "SAVE 85 EGP",
    badgeColor: "badge-cyan",
    age: "من سن 4 - 12 سنة",
    ageAr: "من سن 4 - 12 سنة",
    image: "/photo/kid-area-pic/Junior GP Speedway.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 10
  },
  {
    _id: "6ac8a1c79add9600f9903cae",
    title: "تذكرة الثنائي نهاية الأسبوع",
    titleAr: "تذكرة الثنائي نهاية الأسبوع",
    titleEn: "Family Weekend Duo",
    page: "funZone",
    timing: "weekend",
    price: 340,
    priceAfterDiscount: 190,
    saveBadge: "وفر 150 ج.م",
    saveBadgeAr: "وفر 150 ج.م",
    saveBadgeEn: "SAVE 150 EGP",
    badgeColor: "badge-blue",
    age: "من سن 4 - 12 سنة",
    ageAr: "من سن 4 - 12 سنة",
    image: "/photo/kid-area-pic/High-Octane Racing.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 19
  },
  {
    _id: "6ac8a1c79add9600f9903caf",
    title: "تذكرة منتصف الأسبوع للمرح",
    titleAr: "تذكرة منتصف الأسبوع للمرح",
    titleEn: "Single Midweek Fun",
    page: "funZone",
    timing: "midweek",
    price: 180,
    priceAfterDiscount: 90,
    saveBadge: "وفر 90 ج.م",
    saveBadgeAr: "وفر 90 ج.م",
    saveBadgeEn: "SAVE 90 EGP",
    badgeColor: "badge-cyan",
    age: "من سن 4 - 12 سنة",
    ageAr: "من سن 4 - 12 سنة",
    image: "/photo/kid-area-pic/Bumper Collision Bay.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 9
  },
  {
    _id: "6ac8a1c79add9600f9903cb0",
    title: "تذكرة الأختين منتصف الأسبوع للمرح",
    titleAr: "تذكرة الأختين منتصف الأسبوع للمرح",
    titleEn: "Sisters Midweek Fun",
    page: "funZone",
    timing: "midweek",
    price: 320,
    priceAfterDiscount: 160,
    saveBadge: "وفر 160 ج.م",
    saveBadgeAr: "وفر 160 ج.م",
    saveBadgeEn: "SAVE 160 EGP",
    badgeColor: "badge-blue",
    age: "من سن 4 - 12 سنة",
    ageAr: "من سن 4 - 12 سنة",
    image: "/photo/kid-area-pic/Classic illuminated carousel ride.png",
    thumb: "/photo/kid-area-pic/graphic-composition.png",
    priceType: "all-day",
    pointsGets: 16
  }
];

async function resetSystem() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected successfully to DB.");

    // 1. Delete all junk Media entries
    const delResult = await Media.deleteMany({});
    console.log(`Deleted ${delResult.deletedCount} old Media documents.`);

    // 2. Insert pristine canonical Media records
    const insertedMedia = await Media.insertMany(canonicalMedia);
    console.log(`Inserted ${insertedMedia.length} canonical Media documents.`);

    // 3. Update standard tickets with clean baseline
    for (const t of standardTickets) {
      await Ticket.findByIdAndUpdate(
        t._id,
        { $set: t },
        { upsert: true, new: true }
      );
    }
    console.log(`Updated ${standardTickets.length} standard tickets to official baseline.`);

    console.log("SUCCESS: System reset to pristine production state complete!");
    process.exit(0);
  } catch (err) {
    console.error("ERROR during reset:", err);
    process.exit(1);
  }
}

resetSystem();
