const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env if running as standalone script
dotenv.config({ path: path.join(__dirname, "../../../Server/.env") });

const guestModel = require("../modules/guests/model");

const ADMIN_DATA = {
    name: "مدير النظام (Admin)",
    email: "admin@americandream.eg",
    phone: "01000000000",
    password: "Admin@123",
    age: "30",
    gender: "male",
    role: "admin",
    points: 1000
};

/**
 * Ensures an admin account exists with role: 'admin' and proper password.
 */
const seedAdmin = async () => {
    try {
        // Find existing admin by email or phone
        let admin = await guestModel.findOne({
            $or: [
                { email: ADMIN_DATA.email },
                { phone: ADMIN_DATA.phone }
            ]
        });

        if (admin) {
            let changed = false;
            if (admin.role !== "admin") {
                admin.role = "admin";
                changed = true;
            }
            // Check if password matches Admin@123; if not, update it
            const isMatch = await admin.comparePassword(ADMIN_DATA.password);
            if (!isMatch) {
                admin.password = ADMIN_DATA.password; // pre('save') will hash it
                changed = true;
            }

            if (changed) {
                await admin.save();
                console.log("👑 [SeedAdmin] Updated existing user to Admin with verified credentials.");
            } else {
                console.log("👑 [SeedAdmin] Admin account is already present and active.");
            }
            return admin;
        }

        // Create new Admin
        admin = new guestModel(ADMIN_DATA);
        await admin.save();
        console.log("👑 [SeedAdmin] Admin account created successfully in MongoDB!");
        return admin;
    } catch (err) {
        console.error("❌ [SeedAdmin] Error while seeding admin:", err.message);
        throw err;
    }
};

// Standalone execution support: node src/utils/seedAdmin.js
if (require.main === module) {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
        console.error("❌ [SeedAdmin] DB_URL is missing in environment variables.");
        process.exit(1);
    }

    mongoose.connect(dbUrl)
        .then(async () => {
            console.log("✅ [SeedAdmin] Connected to MongoDB for seeding...");
            await seedAdmin();
            console.log("🎉 [SeedAdmin] Seeding finished. Exiting.");
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ [SeedAdmin] Connection error:", err.message);
            process.exit(1);
        });
}

module.exports = seedAdmin;
