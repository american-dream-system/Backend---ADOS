require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  const dbUrl = process.env.DB_URL;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(dbUrl);
  const db = mongoose.connection.db;
  const packages = await db.collection('packages').find({}).toArray();
  for (const p of packages) {
    let newCat = p.category;
    let newPage = p.page;
    const catStr = String(p.category || '');
    const titleAr = String(p.titleAr || '');
    const titleEn = String(p.titleEn || '').toLowerCase();

    if (catStr === '6ac8a1c69add9600f9903c9b' || titleAr.includes('مغامرة') || titleEn.includes('adventure')) {
      newCat = 'adventure';
      newPage = 'adventure';
    } else if (catStr === '6ac8a1c69add9600f9903c9a' || titleAr.includes('تحدي') || titleEn.includes('challenge')) {
      newCat = 'challenge';
      newPage = 'challenge';
    } else if (catStr.toLowerCase() === 'midweek') {
      newCat = 'midweek';
    } else if (catStr.toLowerCase() === 'weekend') {
      newCat = 'weekend';
    } else if (catStr.toLowerCase() === 'family' || titleAr.includes('عائل') || titleEn.includes('family')) {
      newCat = 'family';
    }

    if (newCat !== p.category || newPage !== p.page) {
      console.log('Updating', p._id, 'cat:', p.category, '->', newCat, 'page:', p.page, '->', newPage);
      await db.collection('packages').updateOne(
        { _id: p._id },
        { $set: { category: newCat, page: newPage } }
      );
    }
  }
  console.log('All packages updated successfully!');
  await mongoose.disconnect();
}

fix().catch(console.error);
