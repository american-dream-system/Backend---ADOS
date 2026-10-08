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
    refreshToken: {
        type: String
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
    return obj;
};

module.exports = mongoose.model("Guest", guestSchema);