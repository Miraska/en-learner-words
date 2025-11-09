import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';

export const sessionController = {
    async me(req: Request, res: Response) {
        try {
            const user = req.user!;
            const prisma = new (require('@prisma/client').PrismaClient)();
            const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, nickname: true, createdAt: true } });
            if (!dbUser) return res.status(404).json({ error: 'User not found' });
            res.json(dbUser);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async create(req: Request, res: Response) {
        try {
            const { dictionaryId, recalled, notRecalled, unknown, mode, isMultiplayer } = req.body;
            if (
                dictionaryId == null ||
                recalled == null ||
                notRecalled == null ||
                unknown == null
            ) {
                return res
                    .status(400)
                    .json({
                        error: 'dictionaryId, recalled, notRecalled, unknown are required',
                    });
            }
            const userId = req.user!.id;
            const session = await sessionService.createSession({
                dictionaryId: Number(dictionaryId),
                userId,
                recalled: Number(recalled),
                notRecalled: Number(notRecalled),
                unknown: Number(unknown),
                mode: typeof mode === 'string' ? mode : undefined,
                isMultiplayer: typeof isMultiplayer === 'boolean' ? isMultiplayer : false,
            });
            res.status(201).json(session);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getUserSessions(req: Request, res: Response) {
        try {
            const authUserId = req.user!.id;
            const { userId } = req.params;
            const requestedUserId = Number(userId);
            if (!userId || Number.isNaN(requestedUserId)) {
                return res
                    .status(400)
                    .json({ error: 'Valid userId param is required' });
            }
            if (requestedUserId !== authUserId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const sessions = await sessionService.getUserSessions(
                requestedUserId
            );
            res.json(sessions);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
};
