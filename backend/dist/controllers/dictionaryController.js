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
exports.dictionaryController = void 0;
const dictionaryService_1 = require("../services/dictionaryService");
exports.dictionaryController = {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const userId = req.user.id;
                const dictionary = yield dictionaryService_1.dictionaryService.createDictionary({
                    name,
                    description,
                    isPublic,
                    createdById: userId,
                    sourceLangId: Number(sourceLangId), // Предполагается, что клиент отправляет ID
                    targetLangId: Number(targetLangId), // Предполагается, что клиент отправляет ID
                });
                res.status(201).json(dictionary);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const dictionaries = yield dictionaryService_1.dictionaryService.getDictionaries(userId);
                res.json(dictionaries);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getPublic(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sourceLangId, targetLangId, sortBy, sortOrder, search, learnedPercentageMin, learnedPercentageMax, limit, offset } = req.query;
                const filters = {};
                if (sourceLangId)
                    filters.sourceLangId = Number(sourceLangId);
                if (targetLangId)
                    filters.targetLangId = Number(targetLangId);
                if (sortBy)
                    filters.sortBy = sortBy;
                if (sortOrder)
                    filters.sortOrder = sortOrder;
                if (search)
                    filters.search = search;
                if (learnedPercentageMin)
                    filters.learnedPercentageMin = Number(learnedPercentageMin);
                if (learnedPercentageMax)
                    filters.learnedPercentageMax = Number(learnedPercentageMax);
                // Получаем userId если пользователь авторизован
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const pageLimit = Math.max(1, Math.min(Number(limit) || 9, 50));
                const pageOffset = Math.max(0, Number(offset) || 0);
                const dictionaries = yield dictionaryService_1.dictionaryService.getPublicDictionariesWithProgress(filters, userId, { limit: pageLimit, offset: pageOffset });
                res.json(dictionaries);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getOne(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const dictionary = yield dictionaryService_1.dictionaryService.getByIdWithMeta(Number(id), userId);
                if (!dictionary)
                    return res.status(404).json({ error: 'Dictionary not found' });
                res.json(dictionary);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { name, description, isPublic, sourceLangId, targetLangId } = req.body;
                const userId = req.user.id;
                if (typeof description === 'string' && description.length > 50) {
                    return res.status(400).json({ error: 'Description must be 50 characters or fewer' });
                }
                const dictionary = yield dictionaryService_1.dictionaryService.updateDictionary(Number(id), {
                    name,
                    description,
                    isPublic,
                    sourceLangId: sourceLangId == null ? undefined : Number(sourceLangId),
                    targetLangId: targetLangId == null ? undefined : Number(targetLangId),
                }, userId);
                res.json(dictionary);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const userId = req.user.id;
                yield dictionaryService_1.dictionaryService.deleteDictionary(Number(id), userId);
                res.status(204).send();
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    likeDictionary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const userId = req.user.id;
                const result = yield dictionaryService_1.dictionaryService.likeDictionaryByUser(Number(id), userId);
                res.json(result);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getUserLikes(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const dictionaries = yield dictionaryService_1.dictionaryService.getUserLikes(userId);
                res.json(dictionaries);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
};
