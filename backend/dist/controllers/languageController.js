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
exports.languageController = void 0;
const languageService_1 = require("../services/languageService");
exports.languageController = {
    getAll(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const languages = yield languageService_1.languageService.getAll();
                res.json(languages);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    listPairs(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pairs = yield languageService_1.languageService.listPairs();
                res.json(pairs);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    createPair(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { sourceLangId, targetLangId } = req.body;
                if (sourceLangId == null || targetLangId == null) {
                    return res.status(400).json({ error: 'sourceLangId and targetLangId are required' });
                }
                const pair = yield languageService_1.languageService.createPair(Number(sourceLangId), Number(targetLangId));
                res.status(201).json(pair);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    deletePair(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const force = String(req.query.force || '').toLowerCase() === 'true';
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const deleted = yield languageService_1.languageService.deletePair(Number(id), force, userId);
                res.status(200).json(deleted);
            }
            catch (error) {
                const code = error === null || error === void 0 ? void 0 : error.code;
                if (code === 'PAIR_IN_USE') {
                    return res.status(409).json({ error: 'Language pair is in use', count: error === null || error === void 0 ? void 0 : error.count });
                }
                res.status(400).json({ error: error.message });
            }
        });
    },
    getPairUsage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const count = yield languageService_1.languageService.countPairUsage(Number(id));
                res.json({ count });
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
};
