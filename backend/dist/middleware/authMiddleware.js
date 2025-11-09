"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jwtUtils_1 = require("../utils/jwtUtils");
const authMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwtUtils_1.jwtUtils.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token) {
        // Если токена нет, просто продолжаем без пользователя
        req.user = undefined;
        return next();
    }
    try {
        const decoded = jwtUtils_1.jwtUtils.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        // Если токен невалидный, продолжаем без пользователя
        req.user = undefined;
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
