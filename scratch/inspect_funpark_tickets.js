const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        const tickets = await mongoose.connection.collection('tickets').find({
            page: { $in: ['funZone', 'fun-park', 'fun'] }
        }).toArray();
        console.log('Fun park tickets count:', tickets.length);
        console.log(tickets.map(t => ({ id: t._id, title: t.title, page: t.page, image: t.image })));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
