// Built-in catalog used ONLY while the admin has never saved the matching section on the server.
// Same ids and prices as the website defaults (american-dream: eventsMasterData.js, restaurantMasterData.js).
// Once the admin saves a section, the saved section (Media collection) is the price source.
module.exports = {
  "events": {
    "packagesByOccasion": {
      "birthday": [
        {
          "id": "explorer",
          "nameAr": "مغامرة المستكشف",
          "nameEn": "Explorer Adventure",
          "basePrice": 7500,
          "deposit": 2500
        },
        {
          "id": "champion",
          "nameAr": "مغامرة الأبطال الشاملة",
          "nameEn": "Champion Quest",
          "basePrice": 11500,
          "deposit": 3500,
          "isPopular": true
        },
        {
          "id": "vip",
          "nameAr": "الملكية الفاخرة على القناة (VIP)",
          "nameEn": "Royal Waterfront VIP",
          "basePrice": 16500,
          "deposit": 5000
        }
      ],
      "family": [
        {
          "id": "family_essential",
          "nameAr": "لمّة العائلة الهادئة",
          "nameEn": "Family Comfort Gathering",
          "basePrice": 4800,
          "deposit": 1500
        },
        {
          "id": "family_feast",
          "nameAr": "ضيافة الأهل وغروب القناة",
          "nameEn": "Sunset Family Feast",
          "basePrice": 8500,
          "deposit": 2500,
          "isPopular": true
        },
        {
          "id": "family_vip",
          "nameAr": "العزومة الملكية العائلية VIP",
          "nameEn": "Royal Family Waterfront VIP",
          "basePrice": 13500,
          "deposit": 4000
        }
      ],
      "general": [
        {
          "id": "general_meeting",
          "nameAr": "باقة الفعاليات والاجتماعات",
          "nameEn": "Corporate & Meeting Package",
          "basePrice": 6500,
          "deposit": 2000
        },
        {
          "id": "general_celebration",
          "nameAr": "باقة حفلات التخرج والاحتفالات",
          "nameEn": "Celebration & Banquet Gold",
          "basePrice": 12500,
          "deposit": 4000,
          "isPopular": true
        },
        {
          "id": "general_gala_vip",
          "nameAr": "باقة الجالا الكبرى VIP",
          "nameEn": "Grand Waterfront Gala VIP",
          "basePrice": 22000,
          "deposit": 7000
        }
      ],
      "dating": [
        {
          "id": "dating_sunset",
          "nameAr": "موعد الغروب الرومانسي",
          "nameEn": "Sunset Romance Date",
          "basePrice": 2400,
          "deposit": 800
        },
        {
          "id": "dating_candlelight",
          "nameAr": "عشاء ضوء الشموع على القناة",
          "nameEn": "Candlelight Waterfront Date",
          "basePrice": 4200,
          "deposit": 1500,
          "isPopular": true
        },
        {
          "id": "dating_royal_vip",
          "nameAr": "السهرة الملكية الخاصة لشخصين VIP",
          "nameEn": "Royal Waterfront Date VIP",
          "basePrice": 7500,
          "deposit": 2500
        }
      ]
    },
    "addItems": [
      {
        "id": "item-mascot",
        "titleAr": "عرض تميمة كرتونية خاصة",
        "titleEn": "Special Mascot Character Show",
        "price": 1200,
        "image": "/photo/kid-area-pic/icon/Icon99.png"
      },
      {
        "id": "item-magic",
        "titleAr": "فقرة الساحر وألعاب الخفة",
        "titleEn": "Magic & Illusion Show",
        "price": 1500,
        "image": "/photo/kid-area-pic/icon/Icon (11)12.png"
      },
      {
        "id": "item-face-painting",
        "titleAr": "رسم احترافي على وجوه الأطفال",
        "titleEn": "Kids Face Painting & Glitter Art",
        "price": 800,
        "image": "/photo/kid-area-pic/icon/Icon (9).png"
      },
      {
        "id": "item-balloon-arch",
        "titleAr": "قوس وديكور بالونات إضافي ثيم مخصص",
        "titleEn": "Custom Themed Balloon Arch",
        "price": 1800,
        "image": "/photo/loading.svg"
      },
      {
        "id": "item-dj-sound",
        "titleAr": "دي جي وهندسة صوت وإضاءة خاصة",
        "titleEn": "Professional DJ & Sound Setup",
        "price": 2500,
        "image": "/photo/loading.svg"
      },
      {
        "id": "item-photo-reels",
        "titleAr": "تغطية تصوير فوتوغرافي وفيديو ريلز",
        "titleEn": "Photography & Reels Coverage",
        "price": 2000,
        "image": "/photo/loading.svg"
      },
      {
        "id": "item-luxury-cake",
        "titleAr": "تورتة احتفالية فاخرة ٣ أدوار",
        "titleEn": "3-Tier Luxury Custom Cake",
        "price": 2200,
        "image": "/photo/loading.svg"
      },
      {
        "id": "item-juice-bar",
        "titleAr": "ترقية بار العصائر والكوكتيلات الطبيعية",
        "titleEn": "Fresh Fruit & Mocktail Bar",
        "price": 1400,
        "image": "/photo/loading.svg"
      }
    ],
    "pricePerGuestByOccasion": {
      "birthday": 350,
      "family": 400,
      "general": 450,
      "dating": 600
    }
  },
  "restaurant": {
    "items": [
      {
        "id": "rest-item-1",
        "title": "Artisanal Brioche Cheeseburger Meal",
        "titleAr": "وجبة برجر البريوش بالجبنة الفاخرة",
        "price": 185
      },
      {
        "id": "rest-item-2",
        "title": "Waterfront Sunset Mixed Grill",
        "titleAr": "مشاوي الواجهة المائية المشكلة",
        "price": 340
      },
      {
        "id": "rest-item-3",
        "title": "Italian Stone-Baked Quattro Formaggi",
        "titleAr": "بيتزا الأجبان الأربعة الحجرية",
        "price": 175
      },
      {
        "id": "rest-item-4",
        "title": "Island Breeze Mango Mocktail",
        "titleAr": "كوكتيل نسيم الجزيرة بالمانجو",
        "price": 70
      },
      {
        "id": "rest-item-5",
        "title": "Iced Caramel Macchiato & Latte",
        "titleAr": "آيسد كراميل ماكياتو ولاتيه إسباني",
        "price": 65
      },
      {
        "id": "rest-item-6",
        "title": "Super Kid Chicken Nuggets",
        "titleAr": "وجبة ناجتس الدجاج الأبطال",
        "price": 120
      },
      {
        "id": "rest-item-7",
        "title": "Mini Dream Cheeseburger",
        "titleAr": "ميني تشيز برجر دريم للأطفال",
        "price": 135
      },
      {
        "id": "rest-item-8",
        "title": "Cheesy Kids Mozzarella Pizza Slice",
        "titleAr": "شريحة بيتزا الموزاريلا للأطفال",
        "price": 95
      },
      {
        "id": "rest-item-9",
        "title": "Fresh Mango Sunshine Smoothie",
        "titleAr": "سموذي المانجو الطازج",
        "price": 65
      },
      {
        "id": "rest-item-10",
        "title": "Berry Blast Milkshake",
        "titleAr": "ميلك شيك التوت البري",
        "price": 75
      },
      {
        "id": "rest-item-11",
        "title": "Rainbow Ice Cream Sundae",
        "titleAr": "آيس كريم رينبو صنداي",
        "price": 60
      },
      {
        "id": "rest-item-12",
        "title": "Caramel Butter Popcorn Bucket",
        "titleAr": "دلو بوب كورن بالكراميل والزبدة",
        "price": 55
      },
      {
        "id": "rest-combo-1",
        "title": "Grand Family Feast Combo",
        "titleAr": "كومبو وليمة العائلة الكبرى",
        "price": 680
      },
      {
        "id": "rest-combo-2",
        "title": "Burger & Fun Duo Combo",
        "titleAr": "كومبو دبل برجر والمرح",
        "price": 360
      }
    ],
    "combosIds": [
      "rest-combo-1",
      "rest-combo-2"
    ]
  }
};
