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
exports.sessionController = void 0;
const sessionService_1 = require("../services/sessionService");
exports.sessionController = {
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const prisma = new (require('@prisma/client').PrismaClient)();
                const dbUser = yield prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, nickname: true, createdAt: true } });
                if (!dbUser)
                    return res.status(404).json({ error: 'User not found' });
                res.json(dbUser);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { dictionaryId, recalled, notRecalled, unknown, mode, isMultiplayer } = req.body;
                if (dictionaryId == null ||
                    recalled == null ||
                    notRecalled == null ||
                    unknown == null) {
                    return res
                        .status(400)
                        .json({
                        error: 'dictionaryId, recalled, notRecalled, unknown are required',
                    });
                }
                const userId = req.user.id;
                const session = yield sessionService_1.sessionService.createSession({
                    dictionaryId: Number(dictionaryId),
                    userId,
                    recalled: Number(recalled),
                    notRecalled: Number(notRecalled),
                    unknown: Number(unknown),
                    mode: typeof mode === 'string' ? mode : undefined,
                    isMultiplayer: typeof isMultiplayer === 'boolean' ? isMultiplayer : false,
                });
                res.status(201).json(session);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
    getUserSessions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const authUserId = req.user.id;
                const { userId } = req.params;
                const requestedUserId = Number(userId);
                if (!userId || Number.isNaN(requestedUserId)) {
                    return res
                        .status(400)
                        .json({ error: 'Valid userId param is required' });
                }
                if (requestedUserId !== authUserId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                const sessions = yield sessionService_1.sessionService.getUserSessions(requestedUserId);
                res.json(sessions);
            }
            catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    },
};
