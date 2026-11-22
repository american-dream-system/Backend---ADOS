const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const { getContactInfo, setContactInfo } = require("./services");

// Public: the website reads this (cached; every write flushes the public cache)
router.get("/", getContactInfo);

// Admin only
router.put("/", adminOnly, setContactInfo);

module.exports = router;
