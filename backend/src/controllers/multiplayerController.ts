import { Request, Response } from 'express';

function makeRoomId() {
    return Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36).slice(-4);
}

export const multiplayerController = {
    async create(req: Request, res: Response) {
        try {
            const { dictionaryId, mode } = req.body as { dictionaryId?: number; mode?: 'letters' | 'pair' | 'input' };
            if (!dictionaryId || !mode) {
                return res.status(400).json({ error: 'dictionaryId and mode are required' });
            }
            const roomId = makeRoomId();
            const joinUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/learn/${mode}/${dictionaryId}?room=${roomId}`;
            return res.status(201).json({ roomId, joinUrl });
        } catch (e) {
            return res.status(500).json({ error: (e as Error).message });
        }
    },

    async get(req: Request, res: Response) {
        const { roomId } = req.params as { roomId: string };
        if (!roomId) return res.status(400).json({ error: 'roomId required' });
        return res.json({ roomId });
    },
};


