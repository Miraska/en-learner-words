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
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.wordService = {
    createWord(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id: data.dictionaryId },
            });
            if (!dictionary || dictionary.createdById !== userId) {
                throw new Error('Not authorized or dictionary not found');
            }
            const existing = yield prisma.word.findFirst({
                where: { word: data.word, dictionaryId: data.dictionaryId },
            });
            if (existing) {
                const error = new Error('Word already exists in this dictionary');
                // @ts-expect-error augment error for controller mapping
                error.code = 'WORD_DUPLICATE';
                throw error;
            }
            return prisma.word.create({ data });
        });
    },
    createWordsBulk(words, dictionaryId, languageId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id: dictionaryId },
            });
            if (!dictionary || dictionary.createdById !== userId) {
                throw new Error('Not authorized or dictionary not found');
            }
            const results = {
                created: [],
                skipped: [],
            };
            // Process words in batches to avoid overwhelming the database
            const batchSize = 50;
            for (let i = 0; i < words.length; i += batchSize) {
                const batch = words.slice(i, i + batchSize);
                for (const wordData of batch) {
                    try {
                        // Check if word already exists
                        const existing = yield prisma.word.findFirst({
                            where: {
                                word: wordData.word,
                                dictionaryId: dictionaryId
                            },
                        });
                        if (existing) {
                            results.skipped.push(Object.assign(Object.assign({}, wordData), { reason: 'Word already exists in this dictionary' }));
                            continue;
                        }
                        // Create the word
                        const newWord = yield prisma.word.create({
                            data: {
                                word: wordData.word,
                                translation: wordData.translation,
                                dictionaryId,
                                languageId,
                            },
                        });
                        results.created.push(newWord);
                    }
                    catch (error) {
                        results.skipped.push(Object.assign(Object.assign({}, wordData), { reason: error.message }));
                    }
                }
            }
            return results;
        });
    },
    getWords(dictionaryId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
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
        });
    },
    updateWord(id, data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const word = yield prisma.word.findUnique({
                where: { id },
                include: { dictionary: true },
            });
            if (!word || word.dictionary.createdById !== userId) {
                throw new Error('Not authorized or word not found');
            }
            if (data.word && data.word !== word.word) {
                const duplicate = yield prisma.word.findFirst({
                    where: {
                        word: data.word,
                        dictionaryId: word.dictionaryId,
                        NOT: { id },
                    },
                });
                if (duplicate) {
                    const error = new Error('Word already exists in this dictionary');
                    // @ts-expect-error augment error for controller mapping
                    error.code = 'WORD_DUPLICATE';
                    throw error;
                }
            }
            return prisma.word.update({ where: { id }, data });
        });
    },
    deleteWord(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const word = yield prisma.word.findUnique({
                where: { id },
                include: { dictionary: true },
            });
            if (!word || word.dictionary.createdById !== userId) {
                throw new Error('Not authorized or word not found');
            }
            return prisma.word.delete({ where: { id } });
        });
    },
    setLearned(wordId, userId, learned, userTranslation) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the word exists and is accessible (public or user's dictionary)
            const word = yield prisma.word.findUnique({
                where: { id: wordId },
                include: { dictionary: true },
            });
            if (!word)
                throw new Error('Word not found');
            if (!word.dictionary.isPublic &&
                word.dictionary.createdById !== userId) {
                throw new Error('Not authorized');
            }
            // Check if user already has this word learned (language-aware).
            // Fallback to legacy rows where languageId is null.
            let existingEntry = yield prisma.userWord.findFirst({
                where: { userId, wordText: word.word, languageId: word.languageId },
            });
            if (!existingEntry) {
                existingEntry = yield prisma.userWord.findFirst({
                    where: { userId, wordText: word.word, languageId: null },
                });
            }
            if (existingEntry) {
                if (!learned) {
                    // Unmark as learned for this word-language pair
                    return yield prisma.userWord.update({
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
                let languagePairId = existingEntry.languagePairId || undefined;
                if (!languagePairId && word.dictionaryId) {
                    const dict = yield prisma.dictionary.findUnique({ where: { id: word.dictionaryId } });
                    if (dict) {
                        const pair = yield prisma.languagePair.upsert({
                            where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                            update: {},
                            create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                        });
                        languagePairId = pair.id;
                    }
                }
                // Update the existing entry with combined translation
                return yield prisma.userWord.update({
                    where: { id: existingEntry.id },
                    data: Object.assign({ learned: true, userTranslation: combinedTranslation }, (languagePairId ? { languagePairId } : {})),
                });
            }
            else {
                if (!learned) {
                    // Nothing to unlearn if no entry exists
                    return null;
                }
                // First time learning this word
                let languagePairId = undefined;
                if (word.dictionaryId) {
                    const dict = yield prisma.dictionary.findUnique({ where: { id: word.dictionaryId } });
                    if (dict) {
                        const pair = yield prisma.languagePair.upsert({
                            where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                            update: {},
                            create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                        });
                        languagePairId = pair.id;
                    }
                }
                return yield prisma.userWord.create({
                    data: Object.assign({ userId, wordText: word.word, learned: true, languageId: word.languageId, userTranslation: userTranslation || undefined }, (languagePairId ? { languagePairId } : {})),
                });
            }
        });
    },
    getLearnedWords(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const entries = yield prisma.userWord.findMany({
                where: { userId, learned: true },
                orderBy: { updatedAt: 'desc' },
                take: 1000,
            });
            // Group by normalized word text and language; combine only user translations.
            const groups = new Map();
            for (const e of entries) {
                const key = `${e.wordText.trim().toLowerCase()}::${(_a = e.languageId) !== null && _a !== void 0 ? _a : 'null'}`;
                if (!groups.has(key)) {
                    groups.set(key, {
                        originalText: e.wordText,
                        languageId: (_b = e.languageId) !== null && _b !== void 0 ? _b : null,
                        entries: [],
                    });
                }
                groups.get(key).entries.push(e);
            }
            return Array.from(groups.values()).map((g) => {
                const parts = new Set();
                for (const e of g.entries) {
                    const t = e.userTranslation || '';
                    if (!t)
                        continue;
                    for (const p of t.split(',')) {
                        const trimmed = p.trim();
                        if (trimmed)
                            parts.add(trimmed);
                    }
                }
                return {
                    word: g.originalText,
                    translation: Array.from(parts).join(', '),
                    languageId: g.languageId,
                };
            });
        });
    },
    setLearnedByText(userId_1, wordText_1, learned_1, userTranslation_1) {
        return __awaiter(this, arguments, void 0, function* (userId, wordText, learned, userTranslation, languageId = null, overwrite = false, dictionaryId, sourceLangId, targetLangId) {
            // Infer target language from dictionary if provided
            if ((languageId === null || typeof languageId !== 'number') && typeof dictionaryId === 'number') {
                const dict = yield prisma.dictionary.findUnique({ where: { id: dictionaryId } });
                if (dict)
                    languageId = dict.targetLangId;
            }
            // Build explicit pair if provided
            let explicitPair;
            if (typeof sourceLangId === 'number' && typeof targetLangId === 'number') {
                explicitPair = { sourceLangId, targetLangId };
                // Use source language as the grouping key for learned list filtering
                if (languageId == null)
                    languageId = sourceLangId;
            }
            const existing = yield prisma.userWord.findFirst({
                where: { userId, wordText, languageId },
            });
            if (!existing) {
                if (!learned) {
                    // Nothing to unlearn
                    return null;
                }
                // Require an explicit pair or dictionary to attach a language pair; otherwise block creation
                let languagePairId = undefined;
                if (explicitPair) {
                    const pair = yield prisma.languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId } },
                        update: {},
                        create: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId },
                    });
                    languagePairId = pair.id;
                }
                else if (typeof dictionaryId === 'number') {
                    const dict = yield prisma.dictionary.findUnique({ where: { id: dictionaryId } });
                    if (dict) {
                        const pair = yield prisma.languagePair.upsert({
                            where: { sourceLangId_targetLangId: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId } },
                            update: {},
                            create: { sourceLangId: dict.sourceLangId, targetLangId: dict.targetLangId },
                        });
                        languagePairId = pair.id;
                    }
                }
                else {
                    throw new Error('Language pair is required');
                }
                return prisma.userWord.create({
                    data: Object.assign({ userId,
                        wordText, learned: true, languageId, userTranslation: userTranslation || undefined }, (languagePairId ? { languagePairId } : {})),
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
                        const parts = new Set();
                        for (const p of existingTranslation.split(',')) {
                            const t = p.trim();
                            if (t)
                                parts.add(t);
                        }
                        for (const p of newTranslation.split(',')) {
                            const t = p.trim();
                            if (t)
                                parts.add(t);
                        }
                        result = Array.from(parts).join(', ');
                    }
                    return result;
                })();
            // Ensure language pair on update too
            let languagePairId = existing.languagePairId || undefined;
            if (!languagePairId) {
                if (explicitPair) {
                    const pair = yield prisma.languagePair.upsert({
                        where: { sourceLangId_targetLangId: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId } },
                        update: {},
                        create: { sourceLangId: explicitPair.sourceLangId, targetLangId: explicitPair.targetLangId },
                    });
                    languagePairId = pair.id;
                }
                else if (typeof dictionaryId === 'number') {
                    const dict = yield prisma.dictionary.findUnique({ where: { id: dictionaryId } });
                    if (dict) {
                        const pair = yield prisma.languagePair.upsert({
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
                data: Object.assign({ learned: true, userTranslation: combined || undefined }, (languagePairId ? { languagePairId } : {})),
            });
        });
    },
    getWordsByLanguagePair(sourceLangId, targetLangId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get or create language pair
            const languagePair = yield prisma.languagePair.upsert({
                where: { sourceLangId_targetLangId: { sourceLangId, targetLangId } },
                update: {},
                create: { sourceLangId, targetLangId },
            });
            // If no user, return empty array (no personal words for unauthenticated users)
            if (!userId) {
                return [];
            }
            // Get user words for this language pair
            const userWords = yield prisma.userWord.findMany({
                where: {
                    userId,
                    languagePairId: languagePair.id
                },
                orderBy: { updatedAt: 'desc' },
            });
            // Group by word text and combine translations
            const groups = new Map();
            for (const userWord of userWords) {
                const key = userWord.wordText.trim().toLowerCase();
                if (!groups.has(key)) {
                    groups.set(key, {
                        word: userWord.wordText,
                        translations: new Set(),
                        learned: userWord.learned
                    });
                }
                const group = groups.get(key);
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
        });
    },
};
