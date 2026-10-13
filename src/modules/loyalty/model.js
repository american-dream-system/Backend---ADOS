const mongoose = require("mongoose");

const loyaltySettingsSchema = new mongoose.Schema({
    // Is loyalty points system active
    isEnabled: {
        type: Boolean,
        default: true
    },
    // How many points equal 1 Egyptian Pound (EGP) for redemption/payment
    // Example: 10 means 10 points = 1 EGP (100 EGP cart requires 1,000 points)
    // Example: 1 means 1 point = 1 EGP
    pointsPerEgp: {
        type: Number,
        required: [true, "معدل النقاط لكل جنيه مطلوب"],
        default: 10,
        min: [0.01, "معدل النقاط يجب أن يكون أكبر من 0"]
    },
    // How many points the guest earns for every 1 EGP spent
    // Example: 1 means 1 EGP spent earns 1 point (spending 150 EGP earns 150 points)
    pointsEarnedPerEgp: {
        type: Number,
        required: [true, "معدل اكتساب النقاط لكل جنيه مطلوب"],
        default: 1,
        min: [0, "معدل اكتساب النقاط لا يمكن أن يكون سالباً"]
    },
    // Minimum points in balance required to use points as a payment method
    minRedeemPoints: {
        type: Number,
        default: 50,
        min: 0
    },
    // Maximum percentage of an order total that can be paid via points (100 = full payment allowed)
    maxOrderCoverPercentage: {
        type: Number,
        default: 100,
        min: 1,
        max: 100
    },
    // Welcome bonus points credited to new guests upon registration
    welcomeBonusPoints: {
        type: Number,
        default: 100,
        min: 0
    },
    // Admin notes or program description
    descriptionAr: {
        type: String,
        default: "كل 10 نقاط تساوي 1 جنيه مصري عند الدفع، ويربح العميل 1 نقطة لكل جنيه يتم إنفاقه."
    },
    descriptionEn: {
        type: String,
        default: "Every 10 points equals 1 EGP at checkout, and earn 1 point for every 1 EGP spent."
    },
    lastUpdatedBy: {
        type: String,
        default: "Admin"
    }
}, {
    timestamps: true
});

// Ensure singleton pattern - helper method to get or create defaults
loyaltySettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            isEnabled: true,
            pointsPerEgp: 10,
            pointsEarnedPerEgp: 1,
            minRedeemPoints: 50,
            maxOrderCoverPercentage: 100,
            welcomeBonusPoints: 100
        });
    }
    return settings;
};

module.exports = mongoose.model("LoyaltySettings", loyaltySettingsSchema);
