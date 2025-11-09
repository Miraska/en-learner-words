"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.jwtUtils = {
    generateToken(userId, email) {
        // Set token expiration to 30 days as requested
        return jsonwebtoken_1.default.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    },
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    },
};
