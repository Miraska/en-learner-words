"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const rateLimitMiddleware = (maxRequests) => {
    return (0, express_rate_limit_1.default)({
        windowMs: Number(process.env.HINT_RATE_LIMIT_WINDOW_MS || 24 * 60 * 60 * 1000), // default 24h
        max: (req) => __awaiter(void 0, void 0, void 0, function* () {
            const userId = req.user.id;
            const user = yield prisma.user.findUnique({
                where: { id: userId },
            });
            return (user === null || user === void 0 ? void 0 : user.subscriptionTier) === 'premium'
                ? Number(process.env.HINT_RATE_LIMIT_PREMIUM_MAX || 0) ||
                    Infinity
                : Number(process.env.HINT_RATE_LIMIT_FREE_MAX || maxRequests);
        }),
        message: 'Hint limit reached for today',
    });
};
exports.rateLimitMiddleware = rateLimitMiddleware;
