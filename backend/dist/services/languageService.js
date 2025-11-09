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
exports.languageService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.languageService = {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.language.findMany({ orderBy: { name: 'asc' } });
        });
    },
    listPairs() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.languagePair.findMany({ orderBy: [{ sourceLangId: 'asc' }, { targetLangId: 'asc' }] });
        });
    },
    createPair(sourceLangId, targetLangId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sourceLangId === targetLangId) {
                throw new Error('sourceLangId and targetLangId must be different');
            }
            // Ensure languages exist
            const [src, tgt] = yield Promise.all([
                prisma.language.findUnique({ where: { id: sourceLangId } }),
                prisma.language.findUnique({ where: { id: targetLangId } }),
            ]);
            if (!src || !tgt)
                throw new Error('Language not found');
            const pair = yield prisma.languagePair.upsert({
                where: { sourceLangId_targetLangId: { sourceLangId, targetLangId } },
                update: {},
                create: { sourceLangId, targetLangId },
            });
            return pair;
        });
    },
    countPairUsage(pairId) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield prisma.userWord.count({ where: { languagePairId: pairId } });
            return count;
        });
    },
    deletePair(pairId_1) {
        return __awaiter(this, arguments, void 0, function* (pairId, force = false, currentUserId) {
            const inUse = yield prisma.userWord.count({ where: { languagePairId: pairId } });
            if (inUse > 0 && !force) {
                const err = new Error('Language pair is in use');
                err.code = 'PAIR_IN_USE';
                err.count = inUse;
                throw err;
            }
            if (inUse > 0 && force) {
                // Remove user's words in that pair if user specified, otherwise all
                if (typeof currentUserId === 'number') {
                    yield prisma.userWord.deleteMany({ where: { languagePairId: pairId, userId: currentUserId } });
                }
                else {
                    yield prisma.userWord.deleteMany({ where: { languagePairId: pairId } });
                }
            }
            return prisma.languagePair.delete({ where: { id: pairId } });
        });
    },
};
