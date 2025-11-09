import { Request, Response } from 'express';
import { wordService } from '../services/wordService';

export const wordController = {
    async create(req: Request, res: Response) {
        try {
            const { word, translation, dictionaryId, languageId } = req.body;
            if (!word || !translation || !dictionaryId || !languageId) {
                return res.status(400).json({
                    error: 'word, translation, dictionaryId, languageId are required',
                });
            }
            const userId = req.user!.id;
            const newWord = await wordService.createWord(
                {
                    word,
                    translation,
                    dictionaryId,
                    languageId: Number(languageId),
                },
                userId
            );
            res.status(201).json(newWord);
        } catch (error) {
            if ((error as any).code === 'WORD_DUPLICATE') {
                return res
                    .status(409)
                    .json({ error: 'Word already exists in this dictionary' });
            }
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async createBulk(req: Request, res: Response) {
        try {
            const { words, dictionaryId, languageId } = req.body;
            if (!words || !Array.isArray(words) || !dictionaryId || !languageId) {
                return res.status(400).json({
                    error: 'words array, dictionaryId, languageId are required',
                });
            }
            const userId = req.user!.id;
            const results = await wordService.createWordsBulk(
                words,
                dictionaryId,
                languageId,
                userId
            );
            res.status(201).json(results);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getAll(req: Request, res: Response) {
        try {
            const { dictionaryId } = req.query;
            if (!dictionaryId) {
                return res
                    .status(400)
                    .json({ error: 'dictionaryId is required' });
            }
            const userId = req.user?.id;
            const words = await wordService.getWords(
                Number(dictionaryId),
                userId
            );
            res.json(words);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { word, translation, languageId } = req.body;
            const userId = req.user!.id;
            const updatedWord = await wordService.updateWord(
                Number(id),
                { word, translation, languageId },
                userId
            );
            res.json(updatedWord);
        } catch (error) {
            if ((error as any).code === 'WORD_DUPLICATE') {
                return res
                    .status(409)
                    .json({ error: 'Word already exists in this dictionary' });
            }
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            await wordService.deleteWord(Number(id), userId);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async setLearned(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { learned, userTranslation } = req.body as {
                learned: boolean;
                userTranslation?: string;
            };
            const userId = req.user!.id;
            const entry = await wordService.setLearned(
                Number(id),
                userId,
                Boolean(learned),
                userTranslation
            );
            res.json(entry);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getLearned(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const words = await wordService.getLearnedWords(userId);
            res.json(words);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },

    async getByLanguagePair(req: Request, res: Response) {
        try {
            const { sourceLangId, targetLangId } = req.query;
            if (!sourceLangId || !targetLangId) {
                return res
                    .status(400)
                    .json({ error: 'sourceLangId and targetLangId are required' });
            }
            const userId = req.user?.id;
            const words = await wordService.getWordsByLanguagePair(
                Number(sourceLangId),
                Number(targetLangId),
                userId
            );
            res.json(words);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
    async setLearnedByText(req: Request, res: Response) {
        try {
            const { word } = req.params as any;
            const { learned, userTranslation, languageId, overwrite, dictionaryId, sourceLangId, targetLangId } = req.body as {
                learned: boolean;
                userTranslation?: string;
                languageId?: number | null;
                overwrite?: boolean;
                dictionaryId?: number | null;
                sourceLangId?: number | null;
                targetLangId?: number | null;
            };
            const userId = req.user!.id;
            const entry = await wordService.setLearnedByText(
                userId,
                String(word),
                Boolean(learned),
                userTranslation,
                typeof languageId === 'number' ? Number(languageId) : null,
                Boolean(overwrite),
                typeof dictionaryId === 'number' ? Number(dictionaryId) : null,
                typeof sourceLangId === 'number' ? Number(sourceLangId) : null,
                typeof targetLangId === 'number' ? Number(targetLangId) : null
            );
            res.json(entry);
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    },
};
