const LoyaltySettings = require("./model");
const guestModel = require("../guests/model");

// @desc Get active loyalty points configuration
// @route GET /api/loyalty/settings
// @route GET /api/points/settings
// @access Public
const getLoyaltySettings = async (req, res, next) => {
    try {
        const settings = await LoyaltySettings.getSettings();

        // Computed metrics for convenience
        const egpValuePerPoint = Number((1 / settings.pointsPerEgp).toFixed(4));

        res.status(200).json({
            success: true,
            message: "تم جلب إعدادات نظام النقاط بنجاح",
            data: {
                ...settings.toObject(),
                egpValuePerPoint,
                example: {
                    spend100EgpEarnsPoints: Math.round(100 * settings.pointsEarnedPerEgp),
                    buy100EgpOrderCostsPoints: Math.round(100 * settings.pointsPerEgp),
                    points1000ValueInEgp: Number((1000 / settings.pointsPerEgp).toFixed(2))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc Update loyalty points configuration
// @route PUT /api/loyalty/settings
// @route PUT /api/points/settings
// @access Admin / Manager
const updateLoyaltySettings = async (req, res, next) => {
    try {
        const {
            isEnabled,
            pointsPerEgp,
            pointsEarnedPerEgp,
            minRedeemPoints,
            maxOrderCoverPercentage,
            welcomeBonusPoints,
            descriptionAr,
            descriptionEn
        } = req.body;

        let settings = await LoyaltySettings.findOne();
        if (!settings) {
            settings = new LoyaltySettings();
        }

        if (typeof isEnabled === "boolean") settings.isEnabled = isEnabled;
        if (pointsPerEgp !== undefined && pointsPerEgp !== null) {
            const p = Number(pointsPerEgp);
            if (p <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "معدل النقاط لكل جنيه يجب أن يكون أكبر من 0 (مثال: 10 أو 5 أو 1)"
                });
            }
            settings.pointsPerEgp = p;
        }

        if (pointsEarnedPerEgp !== undefined && pointsEarnedPerEgp !== null) {
            const pe = Number(pointsEarnedPerEgp);
            if (pe < 0) {
                return res.status(400).json({
                    success: false,
                    message: "معدل اكتساب النقاط لا يمكن أن يكون سالباً"
                });
            }
            settings.pointsEarnedPerEgp = pe;
        }

        if (minRedeemPoints !== undefined) settings.minRedeemPoints = Math.max(0, Number(minRedeemPoints) || 0);
        if (maxOrderCoverPercentage !== undefined) settings.maxOrderCoverPercentage = Math.min(100, Math.max(1, Number(maxOrderCoverPercentage) || 100));
        if (welcomeBonusPoints !== undefined) settings.welcomeBonusPoints = Math.max(0, Number(welcomeBonusPoints) || 0);
        if (descriptionAr) settings.descriptionAr = descriptionAr;
        if (descriptionEn) settings.descriptionEn = descriptionEn;

        settings.lastUpdatedBy = req.user?.name || req.guest?.name || "Admin";

        await settings.save();

        const egpValuePerPoint = Number((1 / settings.pointsPerEgp).toFixed(4));

        res.status(200).json({
            success: true,
            message: "تم تحديث إعدادات نظام النقاط وقيمة التحويل بنجاح",
            data: {
                ...settings.toObject(),
                egpValuePerPoint,
                example: {
                    spend100EgpEarnsPoints: Math.round(100 * settings.pointsEarnedPerEgp),
                    buy100EgpOrderCostsPoints: Math.round(100 * settings.pointsPerEgp),
                    points1000ValueInEgp: Number((1000 / settings.pointsPerEgp).toFixed(2))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc Calculate points from EGP or EGP from points (Simulation/Helper)
// @route POST /api/loyalty/calculate
// @route POST /api/points/calculate
// @access Public
const calculatePoints = async (req, res, next) => {
    try {
        const { egpAmount, pointsAmount } = req.body;
        const settings = await LoyaltySettings.getSettings();

        const result = {
            pointsPerEgp: settings.pointsPerEgp,
            pointsEarnedPerEgp: settings.pointsEarnedPerEgp,
            isEnabled: settings.isEnabled
        };

        if (egpAmount !== undefined && egpAmount !== null) {
            const egp = Number(egpAmount) || 0;
            result.egpAmount = egp;
            result.requiredPointsToPay = Math.round(egp * settings.pointsPerEgp);
            result.pointsEarnedOnPurchase = Math.round(egp * settings.pointsEarnedPerEgp);
        }

        if (pointsAmount !== undefined && pointsAmount !== null) {
            const pts = Number(pointsAmount) || 0;
            result.pointsAmount = pts;
            result.valueInEgp = Number((pts / settings.pointsPerEgp).toFixed(2));
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// @desc Admin grants or adjusts points for a specific guest
// @route POST /api/loyalty/adjust-points
// @route POST /api/points/adjust-points
// @access Admin / Manager
const adjustGuestPoints = async (req, res, next) => {
    try {
        const { guestId, phone, pointsDelta, reason } = req.body;

        if (!guestId && !phone) {
            return res.status(400).json({
                success: false,
                message: "يرجى تحديد معرف الضيف (guestId) أو رقم هاتفه"
            });
        }

        const delta = Number(pointsDelta);
        if (isNaN(delta) || delta === 0) {
            return res.status(400).json({
                success: false,
                message: "يرجى تحديد عدد نقاط صالح للإضافة أو الخصم"
            });
        }

        const query = guestId ? { _id: guestId } : { phone: String(phone).trim() };
        const guest = await guestModel.findOne(query);

        if (!guest) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على ملف الضيف المحدد"
            });
        }

        const previousPoints = Number(guest.points) || 0;
        const newPoints = Math.max(0, previousPoints + delta);
        guest.points = newPoints;
        await guest.save();

        const settings = await LoyaltySettings.getSettings();
        const valueInEgp = Number((newPoints / settings.pointsPerEgp).toFixed(2));

        res.status(200).json({
            success: true,
            message: delta > 0 
                ? `تم إضافة ${delta} نقطة لرصيد الضيف بنجاح` 
                : `تم خصم ${Math.abs(delta)} نقطة من رصيد الضيف بنجاح`,
            data: {
                guestId: guest._id,
                name: guest.name,
                phone: guest.phone,
                previousPoints,
                pointsDelta: delta,
                currentPoints: newPoints,
                valueInEgp,
                reason: reason || (delta > 0 ? "تعديل رصيد بواسطة الإدارة" : "خصم نقاط بواسطة الإدارة")
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLoyaltySettings,
    updateLoyaltySettings,
    calculatePoints,
    adjustGuestPoints
};
