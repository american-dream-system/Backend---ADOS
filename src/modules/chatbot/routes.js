const express = require("express");
const router = express.Router();
const {
    sendMessage,
    createSession,
    getSessionHistory,
    clearSession,
    listSessions,
    getAvailableTools,
    healthCheck
} = require("./services");

const {
    sendMessageValidator,
    createSessionValidator,
    sessionIdParamValidator
} = require("./validator");

const { verifyToken } = require("../../utils/token");
const guestModel = require("../guests/model");

// Optional Guest Auth: extracts guest if JWT Bearer token is provided
const optionalGuestAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (token) {
            try {
                const decoded = verifyToken(token);
                if (decoded && decoded.id) {
                    const currentGuest = await guestModel.findById(decoded.id);
                    if (currentGuest) {
                        req.guest = currentGuest;
                    }
                }
            } catch (e) {
                // Skip invalid tokens for optional auth
            }
        }
        next();
    } catch (err) {
        next();
    }
};

// Health & connectivity check
router.get("/health", healthCheck);

// Tools & Capabilities catalog
router.get("/tools", getAvailableTools);

// Send message to chatbot (with tool execution)
router.post("/message", optionalGuestAuth, sendMessageValidator, sendMessage);
router.post("/", optionalGuestAuth, sendMessageValidator, sendMessage);

// Session management
router.post("/session", optionalGuestAuth, createSessionValidator, createSession);
router.get("/sessions", optionalGuestAuth, listSessions);
router.get("/session/:sessionId", sessionIdParamValidator, getSessionHistory);
router.delete("/session/:sessionId", sessionIdParamValidator, clearSession);

module.exports = router;
