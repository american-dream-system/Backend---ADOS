const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { getPaymentAccountsSetting, setPaymentAccounts } = require("./services");

// Public: customers see the accounts they pay to (cached; every write flushes the public cache)
router.get("/", getPaymentAccountsSetting);

// Admin only
router.put("/", adminOnly, setPaymentAccounts);

module.exports = router;
