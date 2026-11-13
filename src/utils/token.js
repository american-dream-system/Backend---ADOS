const jwt = require("jsonwebtoken");

const MIN_SECRET_LENGTH = 32;

const requireSecret = (name) => {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`${name} is not set`);
    }
    return value;
};

// Called once at startup: the server must not run without strong, distinct JWT secrets.
const assertJwtSecrets = () => {
    const access = requireSecret("JWT_SECRET_KEY");
    const refresh = requireSecret("JWT_REFRESH_SECRET");
    if (access.length < MIN_SECRET_LENGTH || refresh.length < MIN_SECRET_LENGTH) {
        throw new Error(`JWT secrets must be at least ${MIN_SECRET_LENGTH} characters`);
    }
    if (access === refresh) {
        throw new Error("JWT_SECRET_KEY and JWT_REFRESH_SECRET must be different");
    }
};

// @desc Generate access JWT token
const createToken = (payload) => {
    return jwt.sign(payload, requireSecret("JWT_SECRET_KEY"), {
        expiresIn: process.env.JWT_EXPIRE_TIME || "7d",
    });
};

// @desc Generate refresh JWT token
const createRefreshToken = (payload) => {
    return jwt.sign(payload, requireSecret("JWT_REFRESH_SECRET"), {
        expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || "90d",
    });
};

// @desc Verify access token
const verifyToken = (token) => {
    return jwt.verify(token, requireSecret("JWT_SECRET_KEY"));
};

// @desc Verify refresh token
const verifyRefreshToken = (token) => {
    return jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"));
};

module.exports = {
    assertJwtSecrets,
    createToken,
    createRefreshToken,
    verifyToken,
    verifyRefreshToken
};
