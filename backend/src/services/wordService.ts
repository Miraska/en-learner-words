import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const wordService = {
    async createWord(
        data: {
            word: string;
            translation: string;
            dictionaryId: number;
            languageId: number;
        },
        userId: number
    ) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id: data.dictionaryId },
        });
        if (!dictionary || dictionary.createdById !== userId) {
            throw new Error('Not authorized or dictionary not found');
        }
        const existing = await prisma.word.findFirst({
            where: { word: data.word, dictionaryId: data.dictionaryId },
        });
        if (existing) {
            const error = new Error('Word already exists in this dictionary');
            // @ts-expect-error augment error for controller mapping
            error.code = 'WORD_DUPLICATE';
            throw error;
        }
        return prisma.word.create({ data });
    },

    async createWordsBulk(
        words: Array<{ word: string; translation: string }>,
        dictionaryId: number,
        languageId: number,
        userId: number
    ) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id: dictionaryId },
        });
        if (!dictionary || dictionary.createdById !== userId) {
            throw new Error('Not authorized or dictionary not found');
        }

        const results = {
            created: [] as any[],
            skipped: [] as Array<{ word: string; translation: string; reason: string }>,
        };

        // Process words in batches to avoid overwhelming the database
        const batchSize = 50;
        for (let i = 0; i < words.length; i += batchSize) {
            const batch = words.slice(i, i + batchSize);
            
            for (const wordData of batch) {
                try {
                    // Check if word already exists
                    const existing = await prisma.word.findFirst({
                        where: { 
                            word: wordData.word, 
                            dictionaryId: dictionaryId 
                        },
                    });
                    
                    if (existing) {
                        results.skipped.push({
                            ...wordData,
                            reason: 'Word already exists in this dictionary'
                        });
                        continue;
                    }

                    // Create the word
                    const newWord = await prisma.word.create({
                        data: {
                            word: wordData.word,
                            translation: wordData.translation,
                            dictionaryId,
                            languageId,
                        },
                    });
                    results.created.push(newWord);
                } catch (error) {
                    results.skipped.push({
                        ...wordData,
                        reason: (error as Error).message
                    });
                }
            }
        }

        return results;
    },

    async getWords(dictionaryId: number, userId?: number) {
        const dictionary = await prisma.dictionary.findUnique({
            where: { id: dictionaryId },
        });
        if (!dictionary) {
            throw new Error('Dictionary not found');
        }
        // Allow access if dictionary is public or user is the owner
        if (dictionary.isPublic || (userId && dictionary.createdById === userId)) {
            return prisma.word.findMany({ where: { dictionaryId }, orderBy: { word: 'asc' } });
        }
        throw new Error('Not authorized');
    },

    async updateWord(
        id: number,
        data: { word?: string; translation?: string; languageId?: number },
        userId: number
    ) {
        const word = await prisma.word.findUnique({
            where: { id },
            include: { dictionary: true },
        });
        if (!word || word.dictionary.createdById !== userId) {
            throw new Error('Not authorized or word not found');
        }
        if (data.word && data.word !== word.word) {
            const duplicate = await prisma.word.findFirst({
                where: {
                    word: data.word,
                    dictionaryId: word.dictionaryId,
                    NOT: { id },
                },
            });
            if (duplicate) {
                const error = new Error(
                    'Word already exists in this dictionary'
                );
                // @ts-expect-error augment error for controller mapping
                error.code = 'WORD_DUPLICATE';
                throw error;
            }
        }
        return prisma.word.update({ where: { id }, data });
    },

    async deleteWord(id: number, userId: number) {
        const word = await prisma.word.findUnique({
            where: { id },
            include: { dictionary: true },
        });
        if (!word || word.dictionary.createdById !== userId) {
            throw new Error('Not authorized or word not found');
        }
        return prisma.word.delete({ where: { id } });
    },

    async setLearned(
        wordId: number,
        userId: number,
        learned: boolean,
        userTranslation?: string
    ) {
        // Ensure the word exists and is accessible (public or user's dictionary)
        const word = await prisma.word.findUnique({
            where: { id: wordId },
            include: { dictionary: true },
        });
        if (!word) throw new Error('Word not found');
        if (
            !word.dictionary.isPublic &&
            word.dictionary.createdById !== userId
        ) {
            throw new Error('Not authorized');
        }

        // Check if user already has this word learned (language-aware).
        // Fallback to legacy rows where languageId is null.
        let existingEntry = await prisma.userWord.findFirst({
            where: { userId, wordText: word.word, languageId: word.languageId },
        });
        if (!existingEntry) {
            existingEntry = await prisma.userWord.findFirst({
                where: { userId, wordText: word.word, languageId: null },
            });
        }

        if (existingEntry) {
            if (!learned) {
                // Unmark as learned for this word-language pair
                return await prisma.userWord.update({
                    where: { id: existingEntry.id },
                    data: { learned: false },
                });
            }
            // User already has this word learned, merge only user-supplied translations
            const existingTranslation = existingEntry.userTranslation || '';
            const newTranslation = userTranslation || '';

            // Combine translations if they're different
            let combinedTranslation = existingTranslation;
            if (existingTranslation !== newTranslation) {
                const existingParts = existingTranslation
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                const newParts = newTranslation
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                const allParts = [...new Set([...existingParts, ...newParts])];
                combinedTranslation = allParts.join(', ');
            }

            // Ensure language pair is set when possible
            let languagePairId: number | undefined = (existingEntry as any).languagePairId || undefined;
            if (!languagePairId && word.dictionaryId) {
                const dict = await prisma.dictionary.findUnique({ where: { id: word.dictionaryId } });
                if (dict) {
                    const pair = await (prisma as any).languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                        update: {},
                        create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                    });
                    languagePairId = pair.id;
                }
            }
            // Update the existing entry with combined translation
            return await prisma.userWord.update({
                where: { id: existingEntry.id },
                data: {
                    learned: true,
                    userTranslation: combinedTranslation,
                    ...(languagePairId ? { languagePairId } : {}),
                },
            });
        } else {
            if (!learned) {
                // Nothing to unlearn if no entry exists
                return null as any;
            }
            // First time learning this word
            let languagePairId: number | undefined = undefined;
            if (word.dictionaryId) {
                const dict = await prisma.dictionary.findUnique({ where: { id: word.dictionaryId } });
                if (dict) {
                    const pair = await (prisma as any).languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                        update: {},
                        create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                    });
                    languagePairId = pair.id;
                }
            }
            return await prisma.userWord.create({
                data: {
                    userId,
                    wordText: word.word,
                    learned: true,
                    languageId: word.languageId,
                    userTranslation: userTranslation || undefined,
                    ...(languagePairId ? { languagePairId } : {}),
                },
            });
        }
    },

    async getLearnedWords(userId: number) {
        const entries = await prisma.userWord.findMany({
            where: { userId, learned: true },
            orderBy: { updatedAt: 'desc' },
            take: 1000,
        });

        // Group by normalized word text and language; combine only user translations.
        const groups = new Map<
            string,
            { originalText: string; languageId: number | null; entries: typeof entries }
        >();
        for (const e of entries) {
            const key = `${e.wordText.trim().toLowerCase()}::${e.languageId ?? 'null'}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    originalText: e.wordText,
                    languageId: e.languageId ?? null,
                    entries: [] as any,
                });
            }
            groups.get(key)!.entries.push(e);
        }

        return Array.from(groups.values()).map((g) => {
            const parts = new Set<string>();
            for (const e of g.entries) {
                const t = e.userTranslation || '';
                if (!t) continue;
                for (const p of t.split(',')) {
                    const trimmed = p.trim();
                    if (trimmed) parts.add(trimmed);
                }
            }
            return {
                word: g.originalText,
                translation: Array.from(parts).join(', '),
                languageId: g.languageId,
            } as const;
        });
    },

    async setLearnedByText(
        userId: number,
        wordText: string,
        learned: boolean,
        userTranslation?: string,
        languageId: number | null = null,
        overwrite: boolean = false,
        dictionaryId?: number | null,
        sourceLangId?: number | null,
        targetLangId?: number | null
    ) {
        // Infer target language from dictionary if provided
        if ((languageId === null || typeof languageId !== 'number') && typeof dictionaryId === 'number') {
            const dict = await prisma.dictionary.findUnique({ where: { id: dictionaryId } });
            if (dict) languageId = dict.targetLangId;
        }

        // Build explicit pair if provided
        let explicitPair: { sourceLangId: number; targetLangId: number } | undefined;
        if (typeof sourceLangId === 'number' && typeof targetLangId === 'number') {
            explicitPair = { sourceLangId, targetLangId };
            // Use source language as the grouping key for learned list filtering
            if (languageId == null) languageId = sourceLangId;
        }

        const existing = await prisma.userWord.findFirst({
            where: { userId, wordText, languageId },
        });
        if (!existing) {
            if (!learned) {
                // Nothing to unlearn
                return null as any;
            }
            // Require an explicit pair or dictionary to attach a language pair; otherwise block creation
            let languagePairId: number | undefined = undefined;
            if (explicitPair) {
                const pair = await (prisma as any).languagePair.upsert({
                    where: { sourceLangId_targetLangId: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId } },
                    update: {},
                    create: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId },
                });
                languagePairId = pair.id;
            } else if (typeof dictionaryId === 'number') {
                const dict = await prisma.dictionary.findUnique({ where: { id: dictionaryId } });
                if (dict) {
                    const pair = await (prisma as any).languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                        update: {},
                        create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                    });
                    languagePairId = pair.id;
                }
            } else {
                throw new Error('Language pair is required');
            }
            return prisma.userWord.create({
                data: {
                    userId,
                    wordText,
                    learned: true,
                    languageId,
                    userTranslation: userTranslation || undefined,
                    ...(languagePairId ? { languagePairId } : {}),
                },
            });
        }
        if (!learned) {
            return prisma.userWord.update({
                where: { id: existing.id },
                data: { learned: false },
            });
        }
        // Overwrite or merge translations
        const existingTranslation = existing.userTranslation || '';
        const newTranslation = userTranslation || '';
        const combined = overwrite
            ? newTranslation
            : (() => {
                  let result = existingTranslation;
                  if (newTranslation && newTranslation.trim()) {
                      const parts = new Set<string>();
                      for (const p of existingTranslation.split(',')) {
                          const t = p.trim();
                          if (t) parts.add(t);
                      }
                      for (const p of newTranslation.split(',')) {
                          const t = p.trim();
                          if (t) parts.add(t);
                      }
                      result = Array.from(parts).join(', ');
                  }
                  return result;
              })();
        // Ensure language pair on update too
        let languagePairId: number | undefined = (existing as any).languagePairId || undefined;
        if (!languagePairId) {
            if (explicitPair) {
                const pair = await (prisma as any).languagePair.upsert({
                    where: { sourceLangId_targetLangId: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId } },
                    update: {},
                    create: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId },
                });
                languagePairId = pair.id;
            } else if (typeof dictionaryId === 'number') {
                const dict = await prisma.dictionary.findUnique({ where: { id: dictionaryId } });
                if (dict) {
                    const pair = await (prisma as any).languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                        update: {},
                        create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                    });
                    languagePairId = pair.id;
                }
            }
        }
        return prisma.userWord.update({
            where: { id: existing.id },
            data: { learned: true, userTranslation: combined || undefined, ...(languagePairId ? { languagePairId } : {}) },
        });
    },

    async getWordsByLanguagePair(sourceLangId: number, targetLangId: number, userId?: number) {
        // Get or create language pair
        const languagePair = await (prisma as any).languagePair.upsert({
            where: { sourceLangId_targetLangId: { sourceLangId, targetLangId } },
            update: {},
            create: { sourceLangId, targetLangId },
        });

        // If no user, return empty array (no personal words for unauthenticated users)
        if (!userId) {
            return [];
        }

        // Get user words for this language pair
        const userWords = await prisma.userWord.findMany({
            where: { 
                userId,
                languagePairId: languagePair.id
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Group by word text and combine translations
        const groups = new Map<string, { word: string; translations: Set<string>; learned: boolean }>();
        
        for (const userWord of userWords) {
            const key = userWord.wordText.trim().toLowerCase();
            if (!groups.has(key)) {
                groups.set(key, {
                    word: userWord.wordText,
                    translations: new Set(),
                    learned: userWord.learned
                });
            }
            
            const group = groups.get(key)!;
            if (userWord.userTranslation) {
                group.translations.add(userWord.userTranslation);
            }
            // Update learned status if any entry is learned
            if (userWord.learned) {
                group.learned = true;
            }
        }

        return Array.from(groups.values()).map(group => ({
            word: group.word,
            translation: Array.from(group.translations).join('; ') || '',
            learned: group.learned,
            userTranslation: Array.from(group.translations).join('; ') || ''
        }));
    },
};
