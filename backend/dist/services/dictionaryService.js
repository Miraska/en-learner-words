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
exports.dictionaryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.dictionaryService = {
    createDictionary(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    },
    getByIdWithMeta(id, requestingUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id },
                include: {
                    sourceLanguage: true,
                    targetLanguage: true,
                    createdBy: { select: { id: true, email: true, nickname: true } },
                    _count: { select: { words: true } },
                },
            });
            if (!dictionary)
                return null;
            if (!requestingUserId)
                return dictionary;
            const dictionaryWords = yield prisma.word.findMany({
                where: { dictionaryId: id },
                select: { word: true, translation: true, languageId: true },
            });
            if (dictionaryWords.length === 0) {
                return Object.assign(Object.assign({}, dictionary), { learnedStats: { learned: 0, unlearned: 0, percentage: 0 } });
            }
            const learnedWords = yield prisma.userWord.findMany({
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
                    if (allWordsMatch)
                        correctlyLearnedCount++;
                }
            }
            const percentage = Math.round((correctlyLearnedCount / dictionaryWords.length) * 100);
            return Object.assign(Object.assign({}, dictionary), { learnedStats: {
                    learned: correctlyLearnedCount,
                    unlearned: dictionaryWords.length - correctlyLearnedCount,
                    percentage,
                } });
        });
    },
    getDictionaries(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.dictionary.findMany({
                where: { OR: [{ createdById: userId }, { isPublic: true }] },
                include: {
                    _count: { select: { words: true } },
                },
            });
        });
    },
    getPublicDictionaries(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = { isPublic: true };
            // Language filtering logic:
            // - If both source and target provided: filter by both
            // - If only one provided: match dictionaries where either source OR target equals the selected language
            if ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) && (filters === null || filters === void 0 ? void 0 : filters.targetLangId)) {
                where.sourceLangId = filters.sourceLangId;
                where.targetLangId = filters.targetLangId;
            }
            else if ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) || (filters === null || filters === void 0 ? void 0 : filters.targetLangId)) {
                const langId = ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) || (filters === null || filters === void 0 ? void 0 : filters.targetLangId));
                where.OR = [{ sourceLangId: langId }, { targetLangId: langId }];
            }
            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                where.name = {
                    contains: filters.search,
                    mode: 'insensitive',
                };
            }
            const orderBy = {};
            // Нельзя сортировать на уровне БД по вычисляемому полю learnedPercentage
            if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) && filters.sortBy !== 'learnedPercentage') {
                orderBy[filters.sortBy] = filters.sortOrder || 'desc';
            }
            else {
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
        });
    },
    updateDictionary(id, data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id },
            });
            if (!dictionary || dictionary.createdById !== userId) {
                throw new Error('Not authorized or dictionary not found');
            }
            return prisma.dictionary.update({ where: { id }, data });
        });
    },
    deleteDictionary(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id },
            });
            if (!dictionary || dictionary.createdById !== userId) {
                throw new Error('Not authorized or dictionary not found');
            }
            return prisma.dictionary.delete({ where: { id } });
        });
    },
    likeDictionary(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id },
            });
            if (!dictionary) {
                throw new Error('Dictionary not found');
            }
            return prisma.dictionary.update({
                where: { id },
                data: { likes: { increment: 1 } },
            });
        });
    },
    likeDictionaryByUser(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dictionary = yield prisma.dictionary.findUnique({
                where: { id },
            });
            if (!dictionary) {
                throw new Error('Dictionary not found');
            }
            const existing = yield prisma.dictionaryLike.findUnique({
                where: { userId_dictionaryId: { userId, dictionaryId: id } },
            });
            if (existing) {
                yield prisma.dictionaryLike.delete({
                    where: { userId_dictionaryId: { userId, dictionaryId: id } },
                });
                const updated = yield prisma.dictionary.update({
                    where: { id },
                    data: { likes: { decrement: 1 } },
                });
                return { dictionary: updated, liked: false };
            }
            yield prisma.dictionaryLike.create({
                data: { userId, dictionaryId: id },
            });
            const updated = yield prisma.dictionary.update({
                where: { id },
                data: { likes: { increment: 1 } },
            });
            return { dictionary: updated, liked: true };
        });
    },
    getUserLikes(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const likes = yield prisma.dictionaryLike.findMany({
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
            const dictionaries = likes.map((l) => l.dictionary);
            if (dictionaries.length === 0)
                return [];
            // Compute learnedPercentage per dictionary for this user (same as public logic)
            const withProgress = yield Promise.all(dictionaries.map((dictionary) => __awaiter(this, void 0, void 0, function* () {
                const dictionaryWords = yield prisma.word.findMany({
                    where: { dictionaryId: dictionary.id },
                    select: { word: true, translation: true, languageId: true },
                });
                if (dictionaryWords.length === 0) {
                    return Object.assign(Object.assign({}, dictionary), { learnedPercentage: 0 });
                }
                const learnedWords = yield prisma.userWord.findMany({
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
                        if (allWordsMatch)
                            correctlyLearnedCount++;
                    }
                }
                const learnedPercentage = Math.round((correctlyLearnedCount / dictionaryWords.length) * 100);
                return Object.assign(Object.assign({}, dictionary), { learnedPercentage });
            })));
            return withProgress;
        });
    },
    isLikedByUser(dictionaryId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield prisma.dictionaryLike.findUnique({
                where: { userId_dictionaryId: { userId, dictionaryId } },
            });
            return !!existing;
        });
    },
    getPublicDictionariesWithProgress(filters, userId, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const where = { isPublic: true };
            // Language filtering logic consistent with non-progress variant
            if ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) && (filters === null || filters === void 0 ? void 0 : filters.targetLangId)) {
                where.sourceLangId = filters.sourceLangId;
                where.targetLangId = filters.targetLangId;
            }
            else if ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) || (filters === null || filters === void 0 ? void 0 : filters.targetLangId)) {
                const langId = ((filters === null || filters === void 0 ? void 0 : filters.sourceLangId) || (filters === null || filters === void 0 ? void 0 : filters.targetLangId));
                where.OR = [{ sourceLangId: langId }, { targetLangId: langId }];
            }
            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                where.name = {
                    contains: filters.search,
                    mode: 'insensitive',
                };
            }
            const orderBy = {};
            // Избегаем сортировки на уровне БД по вычисляемому полю learnedPercentage
            if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) && filters.sortBy !== 'learnedPercentage') {
                orderBy[filters.sortBy] = filters.sortOrder || 'desc';
            }
            else {
                orderBy.likes = 'desc'; // По умолчанию сортируем по лайкам
            }
            const dictionaries = yield prisma.dictionary.findMany({
                where,
                orderBy,
                take: (_a = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _a !== void 0 ? _a : 100,
                skip: (_b = pagination === null || pagination === void 0 ? void 0 : pagination.offset) !== null && _b !== void 0 ? _b : 0,
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
                const dictionariesWithProgress = yield Promise.all(dictionaries.map((dictionary) => __awaiter(this, void 0, void 0, function* () {
                    // Получаем все слова из словаря с переводами
                    const dictionaryWords = yield prisma.word.findMany({
                        where: { dictionaryId: dictionary.id },
                        select: {
                            word: true,
                            translation: true,
                            languageId: true
                        },
                    });
                    if (dictionaryWords.length === 0) {
                        return Object.assign(Object.assign({}, dictionary), { learnedPercentage: 0 });
                    }
                    // Получаем изученные слова пользователя для этого словаря
                    const learnedWords = yield prisma.userWord.findMany({
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
                        const userLearnedWord = learnedWords.find(uw => uw.wordText === dictWord.word &&
                            uw.languageId === dictWord.languageId);
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
                            const allWordsMatch = dictTranslationWords.every(dictWord => userTranslationWords.includes(dictWord));
                            if (allWordsMatch) {
                                correctlyLearnedCount++;
                            }
                        }
                    }
                    const learnedPercentage = Math.round((correctlyLearnedCount / dictionaryWords.length) * 100);
                    return Object.assign(Object.assign({}, dictionary), { learnedPercentage });
                })));
                // Применяем фильтр по проценту изучения
                let filteredDictionaries = dictionariesWithProgress;
                if ((filters === null || filters === void 0 ? void 0 : filters.learnedPercentageMin) !== undefined || (filters === null || filters === void 0 ? void 0 : filters.learnedPercentageMax) !== undefined) {
                    filteredDictionaries = dictionariesWithProgress.filter(dict => {
                        const percentage = dict.learnedPercentage || 0;
                        const minCheck = filters.learnedPercentageMin === undefined || percentage >= filters.learnedPercentageMin;
                        const maxCheck = filters.learnedPercentageMax === undefined || percentage <= filters.learnedPercentageMax;
                        return minCheck && maxCheck;
                    });
                }
                // Сортировка по learnedPercentage на уровне приложения (после вычисления прогресса)
                if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) === 'learnedPercentage') {
                    const order = filters.sortOrder || 'desc';
                    filteredDictionaries.sort((a, b) => {
                        var _a, _b;
                        const aVal = (_a = a.learnedPercentage) !== null && _a !== void 0 ? _a : 0;
                        const bVal = (_b = b.learnedPercentage) !== null && _b !== void 0 ? _b : 0;
                        return order === 'asc' ? aVal - bVal : bVal - aVal;
                    });
                }
                return filteredDictionaries;
            }
            return dictionaries;
        });
    },
};
