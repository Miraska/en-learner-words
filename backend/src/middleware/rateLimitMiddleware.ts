import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const rateLimitMiddleware = (maxRequests: number) => {
    return rateLimit({
        windowMs: Number(
            process.env.HINT_RATE_LIMIT_WINDOW_MS || 24 * 60 * 60 * 1000
        ), // default 24h
        max: async (req: any) => {
            const userId = req.user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            return user?.subscriptionTier === 'premium'
                ? Number(process.env.HINT_RATE_LIMIT_PREMIUM_MAX || 0) ||
                      Infinity
                : Number(process.env.HINT_RATE_LIMIT_FREE_MAX || maxRequests);
        },
        message: 'Hint limit reached for today',
    });
};
