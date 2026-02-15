"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGoogleToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const googleClient = new google_auth_library_1.OAuth2Client(env_1.env.googleClientId);
const verifyGoogleToken = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env_1.env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
        throw new Error("Invalid Google token");
    }
    const user = await User_1.User.findOneAndUpdate({ googleId: payload.sub }, {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email,
        avatarUrl: payload.picture,
    }, { new: true, upsert: true });
    const token = jsonwebtoken_1.default.sign({ id: user.id }, env_1.env.jwtSecret, {
        expiresIn: "7d",
    });
    return { user, token };
};
exports.verifyGoogleToken = verifyGoogleToken;
//# sourceMappingURL=authService.js.map