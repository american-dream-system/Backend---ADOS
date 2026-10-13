const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to DB');

        const mediaCol = mongoose.connection.collection('media');
        const ticketsCol = mongoose.connection.collection('tickets');
        const packagesCol = mongoose.connection.collection('packages');

        // ==========================================
        // 1. UPDATE EVENTS MEDIA IN MONGODB
        // ==========================================

        // A. Events Hero
        const eventsHeroImages = [
            'events/events-28.jpg',
            'events/events-29.jpg',
            'events/events-30.jpg',
            'events/events-31.jpg',
            'events/events-32.jpg'
        ];
        await mediaCol.updateOne(
            { page: 'events', section: 'hero' },
            {
                $set: {
                    images: eventsHeroImages,
                    title: 'EVENTS & HALLS',
                    titleAr: 'الحفلات والقاعات',
                    subtitle: 'Your event. Your space. Your moment.',
                    subtitleAr: 'مناسبتك. مساحتك الخاصة. لحظات تدوم.',
                    description: 'Find the perfect space for your celebration. From intimate gatherings to grand milestones, our waterfront venue brings world-class catering, ambient lighting, and personalized event management.',
                    descriptionAr: 'اختر المساحة المثالية لاحتفالك. من اللقاءات العائلية الدافئة إلى أضخم المناسبات، قاعاتنا على ضفاف قناة السويس تقدم أرقى بوفيهات الطعام والإضاءة والإشراف المتكامل.',
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated events/hero');

        // B. Events Occasion Cards
        const occasionItems = [
            {
                slot: 'birthday',
                title: 'Birthday Celebrations',
                titleAr: 'حفلات أعياد الميلاد',
                subtitle: 'AGES 1 - 99',
                subtitleAr: 'لكل الأعمار',
                description: 'Unforgettable birthday celebrations with themed decorations, energetic Play Zone access, and tailored catering.',
                descriptionAr: 'احتفالات أعياد ميلاد لا تُنسى مع ديكورات مميزة، ودخول مناطق الألعاب، وتورتة وبوفيه شهي.',
                image: 'events/events-01.jpg',
                badge: 'AGES 1 - 99',
                badgeAr: 'لكل الأعمار',
                buttonText: 'Explore Birthday',
                buttonTextAr: 'استكشف حفلات أعياد الميلاد',
                actionType: 'modal',
                actionTarget: 'birthday-builder',
                order: 1,
                isActive: true
            },
            {
                slot: 'family',
                title: 'Family Gatherings',
                titleAr: 'اللقاءات العائلية والمناسبات',
                subtitle: 'MULTI-GEN',
                subtitleAr: 'لكل أفراد العائلة',
                description: 'Cherished reunions and intimate milestones where all generations connect with seaside lounge seating.',
                descriptionAr: 'أجواء عائلية دافئة تجمع كل الأجيال. استمتع بجلسات خاصة مطلة على البحر ومأكولات شهية.',
                image: 'events/events-02.jpg',
                badge: 'MULTI-GEN',
                badgeAr: 'لكل أفراد العائلة',
                buttonText: 'Explore Family Gathering',
                buttonTextAr: 'استكشف اللقاءات العائلية',
                actionType: 'modal',
                actionTarget: 'builder',
                order: 2,
                isActive: true
            },
            {
                slot: 'general',
                title: 'Grand Events & Gala',
                titleAr: 'الحفلات والفعاليات الكبرى',
                subtitle: 'UP TO 450 GUESTS',
                subtitleAr: 'سعة حتى ٤٥٠ فرداً',
                description: 'From graduation banquets and private gala evenings to corporate retreats with state-of-the-art audiovisual systems.',
                descriptionAr: 'من حفلات التخرج والخطوبات إلى المؤتمرات واللقاءات السنوية، قاعاتنا تتسع لكافة احتياجاتكم مع أحدث أنظمة الصوت والإضاءة.',
                image: 'events/events-03.jpg',
                badge: 'UP TO 450 GUESTS',
                badgeAr: 'سعة حتى ٤٥٠ فرداً',
                buttonText: 'Explore General Events',
                buttonTextAr: 'استكشف القاعات الكبرى',
                actionType: 'modal',
                actionTarget: 'builder',
                order: 3,
                isActive: true
            },
            {
                slot: 'dating',
                title: 'Romantic Waterfront Dating',
                titleAr: 'دايتنج وعشاء رومانسي',
                subtitle: 'FOR 2 • PRIVATE VIBES',
                subtitleAr: 'لشخصين • إطلالة ساحرة',
                description: 'Intimate candlelight dining on the Suez Canal waterfront with exquisite cuisine and mood lighting.',
                descriptionAr: 'أمسية رومانسية هادئة على ضفاف القناة مع إضاءات خافتة، عشاء راقٍ، وتنسيق طاولات استثنائي لأجمل اللحظات لشخصين.',
                image: 'events/events-04.jpg',
                badge: 'FOR 2 • PRIVATE VIBES',
                badgeAr: 'لشخصين • إطلالة ساحرة',
                buttonText: 'Explore Romantic Dining',
                buttonTextAr: 'استكشف الدايتنج والعشاء الرومانسي',
                actionType: 'modal',
                actionTarget: 'builder',
                order: 4,
                isActive: true
            }
        ];
        await mediaCol.updateOne(
            { page: 'events', section: 'occasions' },
            {
                $set: {
                    title: 'Occasions & Celebrations',
                    titleAr: 'اختر مناسبتك المميزة',
                    images: occasionItems.map(i => i.image),
                    items: occasionItems,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated events/occasions');

        // C. Events Vibes Mosaic Gallery
        const vibesItems = [
            {
                slot: 'vibe-1',
                title: "Leo's 5th Birthday Milestone",
                titleAr: 'احتفال عيد ميلاد الأطفال مع العائلة',
                image: 'events/events-05.jpg',
                order: 1,
                isActive: true
            },
            {
                slot: 'vibe-2',
                title: 'Candlelit Floral Banquets',
                titleAr: 'تنسيق الطاولات والزهور الفاخرة',
                image: 'events/events-06.jpg',
                order: 2,
                isActive: true
            },
            {
                slot: 'vibe-3',
                title: 'Suez Canal Seaside Reception',
                titleAr: 'استقبال مسائي على ضفاف قناة السويس',
                image: 'events/events-07.jpg',
                order: 3,
                isActive: true
            },
            {
                slot: 'vibe-4',
                title: 'Executive Chef Live Plating',
                titleAr: 'محطة طهي واستعراض حي لكبار الشيفات',
                image: 'events/events-08.jpg',
                order: 4,
                isActive: true
            },
            {
                slot: 'vibe-5',
                title: 'Sunset Suez Canal Family Toast',
                titleAr: 'أجواء عائلية مميزة عند الغروب',
                image: 'events/events-09.jpg',
                order: 5,
                isActive: true
            },
            {
                slot: 'vibe-6',
                title: 'Luxury Evening Illuminations',
                titleAr: 'إضاءات وسهرات ليلية ساحرة',
                image: 'events/events-10.jpg',
                order: 6,
                isActive: true
            },
            {
                slot: 'vibe-7',
                title: 'Grand Hall Panoramic Setup',
                titleAr: 'تجهيزات القاعة الكبرى البانورامية',
                image: 'events/events-11.jpg',
                order: 7,
                isActive: true
            },
            {
                slot: 'vibe-8',
                title: 'Waterfront Terrace Memories',
                titleAr: 'ذكريات لا تُنسى على تراس القناة',
                image: 'events/events-12.jpg',
                order: 8,
                isActive: true
            }
        ];
        await mediaCol.updateOne(
            { page: 'events', section: 'vibes' },
            {
                $set: {
                    title: 'Vibes of Events',
                    titleAr: 'أجواء الحفلات والفعاليات',
                    images: vibesItems.map(v => v.image),
                    items: vibesItems,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated events/vibes');

        // D. Events Spaces & Halls
        const spacesItems = [
            {
                slot: 'indoor',
                title: 'INDOOR BALLROOM',
                titleAr: 'القاعة الداخلية الفاخرة',
                description: 'Immersive indoor celebration space with crystal chandeliers, customizable stage, private sound & lighting setup.',
                descriptionAr: 'قاعة احتفالات داخلية فاخرة بثريات كريستال، ومسرح مخصص، وتجهيزات صوت وإضاءة احترافية.',
                image: 'events/events-33.jpg',
                order: 1,
                isActive: true
            },
            {
                slot: 'roof',
                title: 'PANORAMIC ROOF',
                titleAr: 'الرووف البانورامي',
                description: 'Open-air breeze with panoramic sunset views over the historic Suez Canal, festoon fairy lighting.',
                descriptionAr: 'إطلالة بانورامية ساحرة في الهواء الطلق على غروب قناة السويس مع إضاءات احتفالية دافئة.',
                image: 'events/events-34.jpg',
                order: 2,
                isActive: true
            },
            {
                slot: 'outdoor',
                title: 'SEASIDE GARDEN',
                titleAr: 'الحديقة البحرية المفتوحة',
                description: "Lush seaside green lawn illuminated with warm fairy lights, spacious play zones for kids' fun.",
                descriptionAr: 'مسطح أخضر طبيعي مطل على القناة ومزين بالأضواء الدافئة، ومجاور لمناطق الألعاب والأنشطة.',
                image: 'events/events-35.jpg',
                order: 3,
                isActive: true
            }
        ];
        await mediaCol.updateOne(
            { page: 'events', section: 'spaces' },
            {
                $set: {
                    title: 'Spaces & Halls',
                    titleAr: 'القاعات والمساحات المتاحة',
                    images: spacesItems.map(s => s.image),
                    items: spacesItems,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated events/spaces');

        // ==========================================
        // 2. UPDATE FUN PARK MEDIA IN MONGODB
        // ==========================================

        // A. Fun Park Hero
        const funParkHeroImages = [
            'fun-park/fun-park-01.PNG',
            'fun-park/fun-park-02.PNG',
            'fun-park/fun-park-03.png',
            'fun-park/fun-park-04.PNG'
        ];
        await mediaCol.updateOne(
            { page: 'fun-park', section: 'hero' },
            {
                $set: {
                    title: 'Fun Park',
                    titleAr: 'فن بارك',
                    subtitle: 'Play. Explore. Feel The Thrill.',
                    subtitleAr: 'العب. استكشف. عش الإثارة والمرح بلا حدود.',
                    images: funParkHeroImages,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated fun-park/hero');

        // B. Fun Park Explore Attractions
        const funParkExploreItems = [
            {
                slot: 'explore_1',
                title: 'Bumper Cars Arena',
                titleAr: 'سيارات التصادم الكهربائية',
                description: 'High-energy bumper collisions and fun drifting for all family members.',
                descriptionAr: 'تصادمات حماسية ومناورات سريعة ومرح لا ينتهي لجميع أفراد العائلة.',
                image: 'fun-park/fun-park-05.png',
                order: 1,
                isActive: true
            },
            {
                slot: 'explore_2',
                title: 'Grand Classic Carousel',
                titleAr: 'الدوامة الملكية الكلاسيكية',
                description: 'Illuminated golden carousel with gentle magical rides for children and families.',
                descriptionAr: 'دوامة الأحلام المضيئة بأنغام موسيقية وجولات ساحرة للأطفال والعائلات.',
                image: 'fun-park/fun-park-06.png',
                order: 2,
                isActive: true
            },
            {
                slot: 'explore_3',
                title: 'Junior GP Speedway',
                titleAr: 'حلبة سباق الصغار السريعة',
                description: 'Karting adventure designed for junior racers with full safety harnesses.',
                descriptionAr: 'حلبة سيارات سباق مصممة خصيصاً للمتسابقين الصغار مع أعلى معايير الأمان.',
                image: 'fun-park/fun-park-07.png',
                order: 3,
                isActive: true
            },
            {
                slot: 'explore_4',
                title: 'Interactive Fun Slides',
                titleAr: 'منطقة التزحلق والترامبولين',
                description: 'Multi-level slides, trampolines and obstacle arenas for endless jumping.',
                descriptionAr: 'زحاليق متعددة المستويات وترامبولين ومتاهات حركية لتفريغ طاقة الأطفال.',
                image: 'fun-park/fun-park-08.png',
                order: 4,
                isActive: true
            },
            {
                slot: 'explore_5',
                title: 'Skill & Arcade Zone',
                titleAr: 'صالة ألعاب المهارات والأركيد',
                description: 'Modern gaming machines, basketball throws, air hockey and instant ticket prizes.',
                descriptionAr: 'أحدث ماكينات ألعاب الأركيد ورمي السلة وإير هوكي وجوائز التذاكر الفورية.',
                image: 'fun-park/fun-park-09.png',
                order: 5,
                isActive: true
            },
            {
                slot: 'explore_6',
                title: 'Family Play Park Adventure',
                titleAr: 'ساحة الألعاب الجماعية',
                description: 'Outdoor attractions, swings, and climbing sets on lush waterfront grounds.',
                descriptionAr: 'ألعاب مفتوحة ومراجيح ومسارات تسلق وسط حدائق المنتزه الخلابة.',
                image: 'fun-park/fun-park-10.png',
                order: 6,
                isActive: true
            }
        ];
        await mediaCol.updateOne(
            { page: 'fun-park', section: 'explore' },
            {
                $set: {
                    title: 'Explore Fun Park',
                    titleAr: 'استكشف ألعاب ومناطق فن بارك',
                    images: funParkExploreItems.map(e => e.image),
                    items: funParkExploreItems,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated fun-park/explore');

        // C. Fun Park Packages
        const funParkPkgItems = [
            { slot: 'pkg_1', title: 'Single Midweek Pass', titleAr: 'تذكرة فردية منتصف الأسبوع', image: 'fun-park/fun-park-11.png' },
            { slot: 'pkg_2', title: 'Duo Midweek Pass', titleAr: 'تذكرة الثنائي منتصف الأسبوع', image: 'fun-park/fun-park-12.png' },
            { slot: 'pkg_3', title: 'Friends Midweek Pass', titleAr: 'تذكرة الأصدقاء منتصف الأسبوع', image: 'fun-park/fun-park-13.png' },
            { slot: 'pkg_4', title: 'Single Weekend Pass', titleAr: 'تذكرة فردية نهاية الأسبوع', image: 'fun-park/fun-park-14.png' },
            { slot: 'pkg_5', title: 'Duo Weekend Pass', titleAr: 'تذكرة الثنائي نهاية الأسبوع', image: 'fun-park/fun-park-15.png' },
            { slot: 'pkg_6', title: 'Friends Weekend Pass', titleAr: 'تذكرة الأصدقاء نهاية الأسبوع', image: 'fun-park/fun-park-16.png' }
        ];
        await mediaCol.updateOne(
            { page: 'fun-park', section: 'packages' },
            {
                $set: {
                    title: 'fun-park packages',
                    titleAr: 'باقات وتذاكر فن بارك',
                    images: funParkPkgItems.map(p => p.image),
                    items: funParkPkgItems,
                    isActive: true
                }
            },
            { upsert: true }
        );
        console.log('✅ Updated fun-park/packages');

        // ==========================================
        // 3. UPDATE TICKETS COLLECTION IN MONGODB
        // ==========================================
        const ticketImages = [
            'fun-park/fun-park-11.png',
            'fun-park/fun-park-12.png',
            'fun-park/fun-park-13.png',
            'fun-park/fun-park-14.png'
        ];
        const funTickets = await ticketsCol.find({ page: 'funZone' }).toArray();
        for (let i = 0; i < funTickets.length; i++) {
            const imgPath = ticketImages[i % ticketImages.length];
            await ticketsCol.updateOne(
                { _id: funTickets[i]._id },
                { $set: { image: `/media/${imgPath}` } }
            );
        }
        console.log(`✅ Updated ${funTickets.length} funZone tickets with server media images.`);

        // ==========================================
        // 4. UPDATE BIRTHDAY PACKAGES IN MONGODB
        // ==========================================
        const birthdayPackages = await packagesCol.find({ page: 'birthday' }).toArray();
        const bdayImages = [
            'events/events-14.jpg',
            'events/events-15.jpg',
            'events/events-16.jpg'
        ];
        for (let i = 0; i < birthdayPackages.length; i++) {
            const imgPath = bdayImages[i % bdayImages.length];
            await packagesCol.updateOne(
                { _id: birthdayPackages[i]._id },
                { $set: { image: `/media/${imgPath}` } }
            );
        }
        console.log(`✅ Updated ${birthdayPackages.length} birthday packages with server media images.`);

        console.log('🎉 ALL DATABASE MEDIA UPDATED SUCCESSFULLY WITH SERVER ASSETS!');
        process.exit(0);
    } catch(e) {
        console.error('❌ Error updating media in database:', e);
        process.exit(1);
    }
})();
