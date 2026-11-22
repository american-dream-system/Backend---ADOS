const express = require("express");
const router = express.Router();
const { adminOnly } = require("../../middlewares/authMiddleware");
const rateLimit = require("../../middlewares/rateLimit");
const EventRequest = require("./model");
const { createEventRequest, getEventRequests, updateEventRequestStatus } = require("./services");
const { createEventRequestValidator, statusValidator } = require("./validator");

const say = rateLimit.bilingual;

// Public: 5 requests per 10 minutes per client address (req.ip is the real visitor behind Cloudflare/Traefik, see
// middlewares/clientIp.js), and 5 per hour per phone number
const perIp = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: say("طلبات حجز كثيرة جداً. حاول مرة أخرى بعد بضع دقائق.", "Too many booking requests. Please try again in a few minutes."),
});
const perPhone = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyOf: (req) => EventRequest.normalizePhone(req.body && req.body.customerPhone) || req.ip,
    message: say("طلبات حجز كثيرة لهذا الرقم. حاول مرة أخرى لاحقاً.", "Too many booking requests for this phone number. Please try again later."),
});

router.post("/", perIp, createEventRequestValidator, perPhone, createEventRequest);

// Admin only
router.get("/", adminOnly, getEventRequests);
router.patch("/:id/status", adminOnly, statusValidator, updateEventRequestStatus);

module.exports = router;
