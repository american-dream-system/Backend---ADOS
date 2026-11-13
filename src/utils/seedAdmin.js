const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env if running as standalone script
dotenv.config({ path: path.join(__dirname, "../../.env") });

const guestModel = require("../modules/guests/model");

const MIN_PASSWORD_LENGTH = 12;

// Credentials come only from the environment; nothing is hardcoded.
const readAdminConfig = () => {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const phone = (process.env.ADMIN_PHONE || "").trim();
    const password = process.env.ADMIN_PASSWORD || "";

    const missing = [];
    if (!email) missing.push("ADMIN_EMAIL");
    if (!phone) missing.push("ADMIN_PHONE");
    if (!password) missing.push("ADMIN_PASSWORD");
    if (missing.length) {
        throw new Error(`Missing required env variables: ${missing.join(", ")}`);
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    return {
        name: (process.env.ADMIN_NAME || "Admin").trim(),
        email,
        phone,
        password,
        age: "30",
        gender: "male",
        role: "admin",
        points: 0,
    };
};

/**
 * Creates the admin account if it does not exist yet.
 * An existing account (matched by email or phone) is never modified:
 * its password and role are left untouched.
 */
const seedAdmin = async () => {
    const adminData = readAdminConfig();

    const existing = await guestModel.findOne({
        $or: [{ email: adminData.email }, { phone: adminData.phone }],
    });

    if (existing) {
        console.log(
            `👑 [SeedAdmin] Account already exists (role: ${existing.role}); left unchanged.`
        );
        return existing;
    }

    const admin = new guestModel(adminData);
    await admin.save();
    console.log("👑 [SeedAdmin] Admin account created.");
    return admin;
};

// Standalone execution support: node src/utils/seedAdmin.js
if (require.main === module) {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
        console.error("❌ [SeedAdmin] DB_URL is missing in environment variables.");
        process.exit(1);
    }

    try {
        readAdminConfig();
    } catch (err) {
        console.error("❌ [SeedAdmin]", err.message);
        process.exit(1);
    }

    mongoose.connect(dbUrl)
        .then(async () => {
            await seedAdmin();
            process.exit(0);
        })
        .catch((err) => {
            console.error("❌ [SeedAdmin]", err.message);
            process.exit(1);
        });
}

module.exports = seedAdmin;
