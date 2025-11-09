import { Request, Response } from 'express';
import { dictionaryService } from '../services/dictionaryService';

export const dictionaryController = {
    async create(req: Request, res: Response) {
        try {
            const { name, description, isPublic, sourceLangId, targetLangId } = req.body;
            if (!name || sourceLangId == null || targetLangId == null) {
                return res.status(400).json({
                    error: 'name, sourceLangId and targetLangId are required',
                });
            }
            if (typeof description === 'string' && description.length > 50) {
                return res.status(400).json({ error: 'Description must be 50 characters or fewer' });
            }
            const userId = req.user!.id;
            const dictionary = await dictionaryService.createDictionary({
                name,
                description,
                isPublic,
                createdById: userId,
                sourceLangId: Number(sourceLangId), // Предполагается, что клиент отправляет ID
                targetLangId: Number(targetLangId), // Предполагается, что клиент отправляет ID
            });
            res.status(201).json(dictionary);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getAll(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const dictionaries = await dictionaryService.getDictionaries(
                userId
            );
            res.json(dictionaries);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getPublic(req: Request, res: Response) {
        try {
            const { sourceLangId, targetLangId, sortBy, sortOrder, search, learnedPercentageMin, learnedPercentageMax, limit, offset } =
                req.query;

            const filters: any = {};
            if (sourceLangId) filters.sourceLangId = Number(sourceLangId);
            if (targetLangId) filters.targetLangId = Number(targetLangId);
            if (sortBy)
                filters.sortBy = sortBy as 'likes' | 'name' | 'createdAt' | 'learnedPercentage';
            if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';
            if (search) filters.search = search as string;
            if (learnedPercentageMin) filters.learnedPercentageMin = Number(learnedPercentageMin);
            if (learnedPercentageMax) filters.learnedPercentageMax = Number(learnedPercentageMax);

            // Получаем userId если пользователь авторизован
            const userId = req.user?.id;

            const pageLimit = Math.max(1, Math.min(Number(limit) || 9, 50));
            const pageOffset = Math.max(0, Number(offset) || 0);

            const dictionaries = await dictionaryService.getPublicDictionariesWithProgress(
                filters,
                userId,
                { limit: pageLimit, offset: pageOffset }
            );
            res.json(dictionaries);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const dictionary = await dictionaryService.getByIdWithMeta(Number(id), userId);
            if (!dictionary) return res.status(404).json({ error: 'Dictionary not found' });
            res.json(dictionary);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, isPublic, sourceLangId, targetLangId } = req.body;
            const userId = req.user!.id;
            if (typeof description === 'string' && description.length > 50) {
                return res.status(400).json({ error: 'Description must be 50 characters or fewer' });
            }
            const dictionary = await dictionaryService.updateDictionary(
                Number(id),
                {
                    name,
                    description,
                    isPublic,
                    sourceLangId:
                        sourceLangId == null ? undefined : Number(sourceLangId),
                    targetLangId:
                        targetLangId == null ? undefined : Number(targetLangId),
                },
                userId
            );
            res.json(dictionary);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            await dictionaryService.deleteDictionary(Number(id), userId);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async likeDictionary(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const result = await dictionaryService.likeDictionaryByUser(
                Number(id),
                userId
            );
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getUserLikes(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const dictionaries = await dictionaryService.getUserLikes(userId);
            res.json(dictionaries);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
};
