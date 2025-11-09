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
exports.initRealtime = initRealtime;
const socket_io_1 = require("socket.io");
const rooms = {};
function initRealtime(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            credentials: true,
        },
    });
    io.on('connection', (socket) => {
        socket.on('mp:join', (payload) => {
            const { roomId, userId, email, dictionaryId, mode } = payload;
            let room = rooms[roomId];
            if (!room) {
                room = rooms[roomId] = {
                    roomId,
                    dictionaryId,
                    mode,
                    createdBy: userId,
                    wordOrder: payload.wordOrder || [],
                    players: {},
                };
            }
            socket.join(roomId);
            room.players[socket.id] = {
                userId,
                email,
                progressIndex: 0,
                correctCount: 0,
                finished: false,
                ready: false,
            };
            io.to(roomId).emit('mp:state', sanitizeRoom(room));
        });
        socket.on('mp:start', ({ roomId, wordOrder }) => {
            const room = rooms[roomId];
            if (!room)
                return;
            room.startedAt = Date.now();
            room.wordOrder = Array.isArray(wordOrder) ? wordOrder.slice() : [];
            io.to(roomId).emit('mp:started', { roomId, startedAt: room.startedAt, wordOrder: room.wordOrder });
        });
        socket.on('mp:progress', (payload) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { roomId, progressIndex, correctCount, finished } = payload;
            const room = rooms[roomId];
            if (!room)
                return;
            const player = room.players[socket.id];
            if (!player)
                return;
            player.progressIndex = progressIndex;
            player.correctCount = correctCount;
            if (finished != null)
                player.finished = !!finished;
            io.to(roomId).emit('mp:state', sanitizeRoom(room));
            // Winner detection - only after all players finish
            const allPlayers = Object.values(room.players);
            const allFinished = allPlayers.length > 0 && allPlayers.every(p => p.finished);
            if (allFinished && !room.completed) {
                // Find winner by highest correct count, then by fastest time
                const winner = allPlayers.reduce((best, current) => {
                    if (current.correctCount > best.correctCount)
                        return current;
                    if (current.correctCount === best.correctCount) {
                        // If same correct count, winner is the one who finished first
                        // We can't track exact finish time, so we'll use the order they finished
                        return best; // Keep the first one found
                    }
                    return best;
                });
                // Find the socket ID for the winner
                const winnerSocketId = (_a = Object.entries(room.players).find(([_, p]) => p.userId === winner.userId)) === null || _a === void 0 ? void 0 : _a[0];
                if (winnerSocketId) {
                    io.to(roomId).emit('mp:winner', { roomId, socketId: winnerSocketId, userId: winner.userId });
                }
                // Persist sessions for all finished players (once)
                const prisma = new (require('@prisma/client').PrismaClient)();
                const dictionaryId = room.dictionaryId;
                const finishedPlayers = Object.values(room.players).filter(p => p.finished);
                for (const p of finishedPlayers) {
                    try {
                        yield prisma.session.create({
                            data: {
                                userId: p.userId,
                                dictionaryId,
                                recalled: p.correctCount,
                                notRecalled: Math.max(0, (((_b = room.wordOrder) === null || _b === void 0 ? void 0 : _b.length) || 0) - p.correctCount),
                                unknown: 0,
                                mode: room.mode,
                                isMultiplayer: true,
                            }
                        });
                    }
                    catch (_c) { }
                }
                room.completed = true;
            }
        }));
        socket.on('mp:ready', ({ roomId, ready }) => {
            const room = rooms[roomId];
            if (!room)
                return;
            const player = room.players[socket.id];
            if (!player)
                return;
            const wasReady = player.ready;
            player.ready = !!ready;
            const sanitized = sanitizeRoom(room);
            io.to(roomId).emit('mp:state', sanitized);
            const playerCount = Object.keys(room.players).length;
            const allReady = playerCount >= 2 && Object.values(room.players).every((p) => p.ready);
            if (allReady && !room.startedAt) {
                room.startedAt = Date.now();
                io.to(roomId).emit('mp:started', { roomId, startedAt: room.startedAt, wordOrder: room.wordOrder });
            }
        });
        socket.on('mp:pageReloaded', ({ roomId, userId, email }) => {
            const room = rooms[roomId];
            if (!room) {
                return;
            }
            // Сбрасываем состояние ready и прогресс для всех игроков
            Object.values(room.players).forEach(player => {
                player.ready = false;
                player.progressIndex = 0;
                player.correctCount = 0;
                player.finished = false;
            });
            // Сбрасываем состояние игры
            room.startedAt = undefined;
            // Отправляем обновленное состояние всем игрокам
            const sanitized = sanitizeRoom(room);
            io.to(roomId).emit('mp:state', sanitized);
            // Уведомляем всех игроков в комнате о перезагрузке страницы
            io.to(roomId).emit('mp:pageReloaded', { userId, email });
        });
        socket.on('disconnect', () => {
            for (const [roomId, room] of Object.entries(rooms)) {
                if (room.players[socket.id]) {
                    delete room.players[socket.id];
                    io.to(roomId).emit('mp:state', sanitizeRoom(room));
                    if (Object.keys(room.players).length === 0) {
                        delete rooms[roomId];
                    }
                }
            }
        });
    });
}
function sanitizeRoom(room) {
    var _a;
    return {
        roomId: room.roomId,
        dictionaryId: room.dictionaryId,
        mode: room.mode,
        startedAt: (_a = room.startedAt) !== null && _a !== void 0 ? _a : null,
        wordOrder: room.wordOrder,
        players: Object.entries(room.players).map(([socketId, p]) => ({
            socketId,
            userId: p.userId,
            email: p.email,
            progressIndex: p.progressIndex,
            correctCount: p.correctCount,
            finished: p.finished,
            ready: p.ready,
        })),
    };
}
