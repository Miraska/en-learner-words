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
exports.hintService = void 0;
const client_1 = require("@prisma/client");
const llmUtils_1 = require("../utils/llmUtils");
const prisma = new client_1.PrismaClient();
exports.hintService = {
    getHint(wordId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const word = yield prisma.word.findUnique({ where: { id: wordId } });
            if (!word) {
                throw new Error('Word not found');
            }
            // TEMPORARY: disable per-day limit; keep code for easy revert
            // const today = new Date().setHours(0, 0, 0, 0);
            // const hintCount = await prisma.hintUsage.count({
            //     where: {
            //         userId,
            //         usedAt: { gte: new Date(today) },
            //     },
            // });
            // const user = await prisma.user.findUnique({ where: { id: userId } });
            // if (user?.subscriptionTier !== 'premium' && hintCount >= 3) {
            //     throw new Error('Hint limit reached for today');
            // }
            yield prisma.hintUsage.create({
                data: { userId, wordText: word.word },
            });
            const hint = yield (0, llmUtils_1.generateHintForWord)(word.word, word.translation);
            return hint;
        });
    },
};
