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
exports.sessionService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.sessionService = {
    createSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const dictionary = yield prisma.dictionary.findUnique({ where: { id: data.dictionaryId } });
            if (!dictionary)
                throw new Error('Dictionary not found');
            // Any authenticated user may complete a session on any existing dictionary
            return prisma.session.create({ data: {
                    dictionaryId: data.dictionaryId,
                    userId: data.userId,
                    recalled: data.recalled,
                    notRecalled: data.notRecalled,
                    unknown: data.unknown,
                    mode: (_a = data.mode) !== null && _a !== void 0 ? _a : 'unknown',
                    isMultiplayer: (_b = data.isMultiplayer) !== null && _b !== void 0 ? _b : false,
                } });
        });
    },
    getUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.session.findMany({ where: { userId } });
        });
    },
};
