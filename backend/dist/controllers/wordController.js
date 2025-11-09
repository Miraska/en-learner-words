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
exports.wordController = void 0;
const wordService_1 = require("../services/wordService");
exports.wordController = {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { word, translation, dictionaryId, languageId } = req.body;
                if (!word || !translation || !dictionaryId || !languageId) {
                    return res.status(400).json({
                        error: 'word, translation, dictionaryId, languageId are required',
                    });
                }
                const userId = req.user.id;
                const newWord = yield wordService_1.wordService.createWord({
                    word,
                    translation,
                    dictionaryId,
                    languageId: Number(languageId),
                }, userId);
                res.status(201).json(newWord);
            }
            catch (error) {
                if (error.code === 'WORD_DUPLICATE') {
                    return res
                        .status(409)
                        .json({ error: 'Word already exists in this dictionary' });
                }
                res.status(400).json({ error: error.message });
            }
        });
    },
    createBulk(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { words, dictionaryId, languageId } = req.body;
                if (!words || !Array.isArray(words) || !dictionaryId || !languageId) {
                    return res.status(400).json({
                        error: 'words array, dictionaryId, languageId are required',
                    });
                }
                const userId = req.user.id;
                const results = yield wordService_1.wordService.createWordsBulk(words, dictionaryId, languageId, userId);
                res.status(201).json(results);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { dictionaryId } = req.query;
                if (!dictionaryId) {
                    return res
                        .status(400)
                        .json({ error: 'dictionaryId is required' });
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const words = yield wordService_1.wordService.getWords(Number(dictionaryId), userId);
                res.json(words);
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
                const { word, translation, languageId } = req.body;
                const userId = req.user.id;
                const updatedWord = yield wordService_1.wordService.updateWord(Number(id), { word, translation, languageId }, userId);
                res.json(updatedWord);
            }
            catch (error) {
                if (error.code === 'WORD_DUPLICATE') {
                    return res
                        .status(409)
                        .json({ error: 'Word already exists in this dictionary' });
                }
                res.status(400).json({ error: error.message });
            }
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const userId = req.user.id;
                yield wordService_1.wordService.deleteWord(Number(id), userId);
                res.status(204).send();
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    setLearned(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { learned, userTranslation } = req.body;
                const userId = req.user.id;
                const entry = yield wordService_1.wordService.setLearned(Number(id), userId, Boolean(learned), userTranslation);
                res.json(entry);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getLearned(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const words = yield wordService_1.wordService.getLearnedWords(userId);
                res.json(words);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getByLanguagePair(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { sourceLangId, targetLangId } = req.query;
                if (!sourceLangId || !targetLangId) {
                    return res
                        .status(400)
                        .json({ error: 'sourceLangId and targetLangId are required' });
                }
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const words = yield wordService_1.wordService.getWordsByLanguagePair(Number(sourceLangId), Number(targetLangId), userId);
                res.json(words);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    setLearnedByText(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { word } = req.params;
                const { learned, userTranslation, languageId, overwrite, dictionaryId, sourceLangId, targetLangId } = req.body;
                const userId = req.user.id;
                const entry = yield wordService_1.wordService.setLearnedByText(userId, String(word), Boolean(learned), userTranslation, typeof languageId === 'number' ? Number(languageId) : null, Boolean(overwrite), typeof dictionaryId === 'number' ? Number(dictionaryId) : null, typeof sourceLangId === 'number' ? Number(sourceLangId) : null, typeof targetLangId === 'number' ? Number(targetLangId) : null);
                res.json(entry);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
};
