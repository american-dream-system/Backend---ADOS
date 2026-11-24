const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const guestSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        minlength: 6
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    age: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true
    },
    role: {
        type: String,
        enum: ["guest", "user", "admin"],
        default: "guest"
    },
    points: {
        type: Number,
        default: 0
    },
    isVip: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    },
    // Favorites: only the kind and the id of the item (never a name, image or price: the app resolves those from
    // current data). At most 200 per guest. Changed only through /api/guests/me/favorites.
    favorites: {
        type: [{
            _id: false,
            kind: { type: String, enum: ["dish", "ticket", "package", "zone", "featured"], required: true },
            itemId: { type: String, required: true, maxlength: 64 }
        }],
        default: undefined
    },
    // The guest's personal QR: a random, unguessable code made on the server the first time it is needed. It carries
    // no personal data and is never returned by any other endpoint (see toJSON).
    qrCode: {
        type: String,
        unique: true,
        sparse: true
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetCode: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    passwordResetVerified: {
        type: Boolean,
        default: false
    },
    children: [
        {
            name: {
                type: String,
                required: true
            },
            age: {
                type: String,
                required: true
            },
            gender: {
                type: String,
                enum: ["male", "female"],
                required: true
            },
        }
    ],
}, { timestamps: true });

// Hash password before saving
guestSchema.pre("save", async function(next) {
    if (!this.isModified("password") || !this.password) {
        return typeof next === "function" ? next() : undefined;
    }
    this.password = await bcrypt.hash(this.password, 12);
    if (typeof next === "function") next();
});

// Compare password method
guestSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Omit sensitive data when serialized to JSON
guestSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.passwordResetCode;
    delete obj.refreshToken;
    delete obj.qrCode;
    delete obj.favorites;
    return obj;
};

module.exports = mongoose.model("Guest", guestSchema);