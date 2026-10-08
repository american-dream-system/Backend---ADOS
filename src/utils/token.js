const jwt = require("jsonwebtoken");

// @desc Generate access JWT token
const createToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET_KEY || "american_dream_guest_secret_jwt_key_2026_super_secure",
        { expiresIn: process.env.JWT_EXPIRE_TIME || "7d" }
    );
};

// @desc Generate refresh JWT token
const createRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET || "american_dream_guest_refresh_secret_key_2026_super_secure",
        { expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || "90d" }
    );
};

// @desc Verify access token
const verifyToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || "american_dream_guest_secret_jwt_key_2026_super_secure"
    );
};

// @desc Verify refresh token
const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || "american_dream_guest_refresh_secret_key_2026_super_secure"
    );
};

module.exports = {
    createToken,
    createRefreshToken,
    verifyToken,
    verifyRefreshToken
};
