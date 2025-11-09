import { Request, Response } from 'express';
import { languageService } from '../services/languageService';

export const languageController = {
    async getAll(_req: Request, res: Response) {
        try {
            const languages = await languageService.getAll();
            res.json(languages);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async listPairs(_req: Request, res: Response) {
        try {
            const pairs = await languageService.listPairs();
            res.json(pairs);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async createPair(req: Request, res: Response) {
        try {
            const { sourceLangId, targetLangId } = req.body as any;
            if (sourceLangId == null || targetLangId == null) {
                return res.status(400).json({ error: 'sourceLangId and targetLangId are required' });
            }
            const pair = await languageService.createPair(Number(sourceLangId), Number(targetLangId));
            res.status(201).json(pair);
        } catch (error) {
            
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async deletePair(req: Request, res: Response) {
        try {
            const { id } = req.params as any;
            const force = String(req.query.force || '').toLowerCase() === 'true';
            const userId = (req as any).user?.id as number | undefined;
            const deleted = await languageService.deletePair(Number(id), force, userId);
            res.status(200).json(deleted);
        } catch (error: any) {
            const code = (error as any)?.code;
            if (code === 'PAIR_IN_USE') {
                return res.status(409).json({ error: 'Language pair is in use', count: (error as any)?.count });
            }
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async getPairUsage(req: Request, res: Response) {
        try {
            const { id } = req.params as any;
            const count = await languageService.countPairUsage(Number(id));
            res.json({ count });
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
};
