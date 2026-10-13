const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to DB');

        const LoyaltySettings = require('../src/modules/loyalty/model');
        const settings = await LoyaltySettings.getSettings();
        const rate = settings.pointsEarnedPerEgp || 2;
        const welcome = settings.welcomeBonusPoints || 100;

        const guest = await mongoose.connection.collection('guests').findOne({ phone: '01226810306' });
        if (!guest) {
            console.log('Guest not found');
            process.exit(1);
        }
        console.log('Found guest:', guest.name, 'current points:', guest.points);

        // Update buyings pointsAwarded
        const buyings = await mongoose.connection.collection('buyings').find({ guest: guest._id }).toArray();
        let ticketPoints = 0;
        for (const b of buyings) {
            ticketPoints += (b.totalPoints || 0);
            await mongoose.connection.collection('buyings').updateOne(
                { _id: b._id },
                { $set: { pointsAwarded: true } }
            );
        }
        console.log('Ticket points:', ticketPoints, 'across', buyings.length, 'orders');

        // Update menu orders
        const menuOrders = await mongoose.connection.collection('menuorders').find({
            $or: [{ guest: guest._id }, { customerPhone: '01226810306' }]
        }).toArray();
        let foodPoints = 0;
        for (const m of menuOrders) {
            const pts = Math.round((m.subtotal || m.totalAmount || 0) * rate);
            foodPoints += pts;
            await mongoose.connection.collection('menuorders').updateOne(
                { _id: m._id },
                { $set: { totalPoints: pts, pointsAwarded: true, guest: guest._id } }
            );
        }
        console.log('Food delivery points:', foodPoints, 'across', menuOrders.length, 'orders');

        const totalEarnedPoints = welcome + ticketPoints + foodPoints;
        await mongoose.connection.collection('guests').updateOne(
            { _id: guest._id },
            { $set: { points: totalEarnedPoints } }
        );

        console.log('Updated guest total points to:', totalEarnedPoints);

        const updated = await mongoose.connection.collection('guests').findOne({ _id: guest._id });
        console.log('Verified guest points:', updated.points);

        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
