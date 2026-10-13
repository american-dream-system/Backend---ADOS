const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        const docs = await mongoose.connection.collection('media').find({
            page: { $in: ['events', 'fun-park'] }
        }).toArray();
        for (const d of docs) {
            console.log('--- Page:', d.page, 'Section:', d.section, 'Title:', d.title);
            console.log('Images:', d.images);
            console.log('Items:', (d.items || []).map(it => ({ slot: it.slot, title: it.title, image: it.image })));
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
