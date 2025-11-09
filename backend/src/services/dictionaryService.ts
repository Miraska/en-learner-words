import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dictionaryService = {
    async createDictionary(data: {
        name: string;
        description?: string;
        isPublic: boolean;
        createdById: number;
        sourceLangId: number;
        targetLangId: number;
    }) {
        return prisma.dictionary.create({
            data: {
                name: data.name,
                description: data.description,
                isPublic: data.isPublic,
                createdById: data.createdById,
                sourceLangId: data.sourceLangId,
                targetLangId: data.targetLangId,
            },
        });
    },

    async getByIdWithMeta(id: number, requestingUserId?: number) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id },
            include: {
                sourceLanguage: true,
                targetLanguage: true,
                createdBy: { select: { id: true, email: true, nickname: true } },
                _count: { select: { words: true } },
            },
        });
        if (!dictionary) return null;

        if (!requestingUserId) return dictionary;

        const dictionaryWords = await prisma.word.findMany({
            where: { dictionaryId: id },
            select: { word: true, translation: true, languageId: true },
        });
        if (dictionaryWords.length === 0) {
            return { ...dictionary, learnedStats: { learned: 0, unlearned: 0, percentage: 0 } } as any;
        }

        const learnedWords = await prisma.userWord.findMany({
            where: {
                userId: requestingUserId,
                learned: true,
                wordText: { in: dictionaryWords.map(w => w.word) },
                languageId: { in: dictionaryWords.map(w => w.languageId) },
            },
            select: { wordText: true, userTranslation: true, languageId: true },
        });

        let correctlyLearnedCount = 0;
        for (const dictWord of dictionaryWords) {
            const userLearnedWord = learnedWords.find(uw => uw.wordText === dictWord.word && uw.languageId === dictWord.languageId);
            if (userLearnedWord && userLearnedWord.userTranslation) {
                const dictTranslationWords = dictWord.translation
                    .toLowerCase()
                    .split(',')
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                const userTranslationWords = userLearnedWord.userTranslation
                    .toLowerCase()
                    .split(',')
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                const allWordsMatch = dictTranslationWords.every(dw => userTranslationWords.includes(dw));
                if (allWordsMatch) correctlyLearnedCount++;
            }
        }
        const percentage = Math.round((correctlyLearnedCount / dictionaryWords.length) * 100);
        return {
            ...dictionary,
            learnedStats: {
                learned: correctlyLearnedCount,
                unlearned: dictionaryWords.length - correctlyLearnedCount,
                percentage,
            },
        } as any;
    },

    async getDictionaries(userId: number) {
        return prisma.dictionary.findMany({
            where: { OR: [{ createdById: userId }, { isPublic: true }] },
            include: {
                _count: { select: { words: true } },
            },
        });
    },

    async getPublicDictionaries(filters?: {
        sourceLangId?: number;
        targetLangId?: number;
        sortBy?: 'likes' | 'name' | 'createdAt' | 'learnedPercentage';
        sortOrder?: 'asc' | 'desc';
        search?: string;
    }) {
        const where: any = { isPublic: true };

        // Language filtering logic:
        // - If both source and target provided: filter by both
        // - If only one provided: match dictionaries where either source OR target equals the selected language
        if (filters?.sourceLangId && filters?.targetLangId) {
            where.sourceLangId = filters.sourceLangId;
            where.targetLangId = filters.targetLangId;
        } else if (filters?.sourceLangId || filters?.targetLangId) {
            const langId = (filters?.sourceLangId || filters?.targetLangId) as number;
            where.OR = [{ sourceLangId: langId }, { targetLangId: langId }];
        }

        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }

        const orderBy: any = {};
        // Нельзя сортировать на уровне БД по вычисляемому полю learnedPercentage
        if (filters?.sortBy && filters.sortBy !== 'learnedPercentage') {
            orderBy[filters.sortBy] = filters.sortOrder || 'desc';
        } else {
            orderBy.likes = 'desc'; // По умолчанию сортируем по лайкам
        }

        return prisma.dictionary.findMany({
            where,
            orderBy,
            take: 100,
            include: {
                sourceLanguage: true,
                targetLanguage: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        nickname: true,
                    },
                },
                _count: {
                    select: {
                        words: true,
                    },
                },
            },
        });
    },

    async updateDictionary(
        id: number,
        data: {
            name?: string;
            description?: string;
            isPublic?: boolean;
            sourceLangId?: number;
            targetLangId?: number;
        },
        userId: number
    ) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id },
        });
        if (!dictionary || dictionary.createdById !== userId) {
            throw new Error('Not authorized or dictionary not found');
        }
        return prisma.dictionary.update({ where: { id }, data });
    },

    async deleteDictionary(id: number, userId: number) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id },
        });
        if (!dictionary || dictionary.createdById !== userId) {
            throw new Error('Not authorized or dictionary not found');
        }
        return prisma.dictionary.delete({ where: { id } });
    },

    async likeDictionary(id: number) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id },
        });
        if (!dictionary) {
            throw new Error('Dictionary not found');
        }
        return prisma.dictionary.update({
            where: { id },
            data: { likes: { increment: 1 } },
        });
    },

    async likeDictionaryByUser(id: number, userId: number) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id },
        });
        if (!dictionary) {
            throw new Error('Dictionary not found');
        }
        const existing = await prisma.dictionaryLike.findUnique({
            where: { userId_dictionaryId: { userId, dictionaryId: id } },
        });
        if (existing) {
            await prisma.dictionaryLike.delete({
                where: { userId_dictionaryId: { userId, dictionaryId: id } },
            });
            const updated = await prisma.dictionary.update({
                where: { id },
                data: { likes: { decrement: 1 } },
            });
            return { dictionary: updated, liked: false } as const;
        }
        await prisma.dictionaryLike.create({
            data: { userId, dictionaryId: id },
        });
        const updated = await prisma.dictionary.update({
            where: { id },
            data: { likes: { increment: 1 } },
        });
        return { dictionary: updated, liked: true } as const;
    },

    async getUserLikes(userId: number) {
        const likes = await prisma.dictionaryLike.findMany({
            where: { userId },
            include: {
                dictionary: {
                    include: {
                        sourceLanguage: true,
                        targetLanguage: true,
                        createdBy: { select: { id: true, email: true, nickname: true } },
                        _count: { select: { words: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        const dictionaries = likes.map((l: any) => l.dictionary);
        if (dictionaries.length === 0) return [];

        // Compute learnedPercentage per dictionary for this user (same as public logic)
        const withProgress = await Promise.all(
            dictionaries.map(async (dictionary: any) => {
                const dictionaryWords = await prisma.word.findMany({
                    where: { dictionaryId: dictionary.id },
                    select: { word: true, translation: true, languageId: true },
                });
                if (dictionaryWords.length === 0) {
                    return { ...dictionary, learnedPercentage: 0 };
                }

                const learnedWords = await prisma.userWord.findMany({
                    where: {
                        userId,
                        learned: true,
                        wordText: { in: dictionaryWords.map(w => w.word) },
                        languageId: { in: dictionaryWords.map(w => w.languageId) },
                    },
                    select: { wordText: true, userTranslation: true, languageId: true },
                });

                let correctlyLearnedCount = 0;
                for (const dictWord of dictionaryWords) {
                    const userLearnedWord = learnedWords.find(uw => uw.wordText === dictWord.word && uw.languageId === dictWord.languageId);
                    if (userLearnedWord && userLearnedWord.userTranslation) {
                        const dictTranslationWords = dictWord.translation
                            .toLowerCase()
                            .split(',')
                            .map(word => word.trim())
                            .filter(word => word.length > 0);
                        const userTranslationWords = userLearnedWord.userTranslation
                            .toLowerCase()
                            .split(',')
                            .map(word => word.trim())
                            .filter(word => word.length > 0);
                        const allWordsMatch = dictTranslationWords.every(dw => userTranslationWords.includes(dw));
                        if (allWordsMatch) correctlyLearnedCount++;
                    }
                }
                const learnedPercentage = Math.round((correctlyLearnedCount / dictionaryWords.length) * 100);
                return { ...dictionary, learnedPercentage };
            })
        );
        return withProgress;
    },

    async isLikedByUser(dictionaryId: number, userId: number) {
        const existing = await prisma.dictionaryLike.findUnique({
            where: { userId_dictionaryId: { userId, dictionaryId } },
        });
        return !!existing;
    },

    async getPublicDictionariesWithProgress(filters?: {
        sourceLangId?: number;
        targetLangId?: number;
        sortBy?: 'likes' | 'name' | 'createdAt' | 'learnedPercentage';
        sortOrder?: 'asc' | 'desc';
        search?: string;
        learnedPercentageMin?: number;
        learnedPercentageMax?: number;
    }, userId?: number, pagination?: { limit: number; offset: number }) {
        const where: any = { isPublic: true };

        // Language filtering logic consistent with non-progress variant
        if (filters?.sourceLangId && filters?.targetLangId) {
            where.sourceLangId = filters.sourceLangId;
            where.targetLangId = filters.targetLangId;
        } else if (filters?.sourceLangId || filters?.targetLangId) {
            const langId = (filters?.sourceLangId || filters?.targetLangId) as number;
            where.OR = [{ sourceLangId: langId }, { targetLangId: langId }];
        }

        if (filters?.search) {
            where.name = {
                contains: filters.search,
                mode: 'insensitive',
            };
        }

        const orderBy: any = {};
        // Избегаем сортировки на уровне БД по вычисляемому полю learnedPercentage
        if (filters?.sortBy && filters.sortBy !== 'learnedPercentage') {
            orderBy[filters.sortBy] = filters.sortOrder || 'desc';
        } else {
            orderBy.likes = 'desc'; // По умолчанию сортируем по лайкам
        }

        const dictionaries = await prisma.dictionary.findMany({
            where,
            orderBy,
            take: pagination?.limit ?? 100,
            skip: pagination?.offset ?? 0,
            include: {
                sourceLanguage: true,
                targetLanguage: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                        nickname: true,
                    },
                },
                _count: {
                    select: {
                        words: true,
                    },
                },
            },
        });

        // Если пользователь авторизован, добавляем информацию о прогрессе
        if (userId) {
            const dictionariesWithProgress = await Promise.all(
                dictionaries.map(async (dictionary) => {
                    // Получаем все слова из словаря с переводами
                    const dictionaryWords = await prisma.word.findMany({
                        where: { dictionaryId: dictionary.id },
                        select: { 
                            word: true, 
                            translation: true,
                            languageId: true 
                        },
                    });

                    if (dictionaryWords.length === 0) {
                        return {
                            ...dictionary,
                            learnedPercentage: 0,
                        };
                    }

                    // Получаем изученные слова пользователя для этого словаря
                    const learnedWords = await prisma.userWord.findMany({
                        where: {
                            userId,
                            learned: true,
                            wordText: {
                                in: dictionaryWords.map(w => w.word),
                            },
                            languageId: {
                                in: dictionaryWords.map(w => w.languageId),
                            },
                        },
                        select: {
                            wordText: true,
                            userTranslation: true,
                            languageId: true,
                        },
                    });

                    // Подсчитываем только те слова, где все переводы из словаря присутствуют в изученных
                    // Порядок слов в переводе не важен, слова разделены запятыми
                    // Это важно, так как в словаре может быть дополнительный перевод,
                    // которого нет в изученных словах пользователя
                    let correctlyLearnedCount = 0;
                    
                    for (const dictWord of dictionaryWords) {
                        const userLearnedWord = learnedWords.find(
                            uw => uw.wordText === dictWord.word && 
                                 uw.languageId === dictWord.languageId
                        );
                        
                        // Проверяем совпадение перевода как наборов слов (порядок не важен)
                        if (userLearnedWord && userLearnedWord.userTranslation) {
                            const dictTranslationWords = dictWord.translation
                                .toLowerCase()
                                .split(',')
                                .map(word => word.trim())
                                .filter(word => word.length > 0);
                            
                            const userTranslationWords = userLearnedWord.userTranslation
                                .toLowerCase()
                                .split(',')
                                .map(word => word.trim())
                                .filter(word => word.length > 0);
                            
                            // Проверяем, что все слова из словаря присутствуют в пользовательском переводе
                            const allWordsMatch = dictTranslationWords.every(dictWord => 
                                userTranslationWords.includes(dictWord)
                            );
                            
                            if (allWordsMatch) {
                                correctlyLearnedCount++;
                            }
                        }
                    }

                    const learnedPercentage = Math.round(
                        (correctlyLearnedCount / dictionaryWords.length) * 100
                    );

                    return {
                        ...dictionary,
                        learnedPercentage,
                    };
                })
            );

            // Применяем фильтр по проценту изучения
            let filteredDictionaries = dictionariesWithProgress;
            
            if (filters?.learnedPercentageMin !== undefined || filters?.learnedPercentageMax !== undefined) {
                filteredDictionaries = dictionariesWithProgress.filter(dict => {
                    const percentage = dict.learnedPercentage || 0;
                    const minCheck = filters.learnedPercentageMin === undefined || percentage >= filters.learnedPercentageMin;
                    const maxCheck = filters.learnedPercentageMax === undefined || percentage <= filters.learnedPercentageMax;
                    return minCheck && maxCheck;
                });
            }

            // Сортировка по learnedPercentage на уровне приложения (после вычисления прогресса)
            if (filters?.sortBy === 'learnedPercentage') {
                const order: 'asc' | 'desc' = filters.sortOrder || 'desc';
                filteredDictionaries.sort((a: any, b: any) => {
                    const aVal = a.learnedPercentage ?? 0;
                    const bVal = b.learnedPercentage ?? 0;
                    return order === 'asc' ? aVal - bVal : bVal - aVal;
                });
            }

            return filteredDictionaries;
        }

        return dictionaries;
    },
};
