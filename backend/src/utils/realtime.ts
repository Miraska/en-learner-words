import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import type http from 'http';

type PlayerState = {
    userId: number;
    email: string;
    progressIndex: number;
    correctCount: number;
    finished: boolean;
    ready: boolean;
};

type RoomState = {
    roomId: string;
    dictionaryId: number;
    mode: 'letters' | 'pair' | 'input';
    createdBy: number;
    startedAt?: number;
    wordOrder: number[]; // indexes into the filtered/shuffled list decided by host
    players: Record<string, PlayerState>; // key by socket.id
    completed?: boolean;
};

const rooms: Record<string, RoomState> = {};

export function initRealtime(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        socket.on('mp:join', (payload: {
            roomId: string;
            userId: number;
            email: string;
            dictionaryId: number;
            mode: 'letters' | 'pair' | 'input';
            wordOrder?: number[];
        }) => {
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

        socket.on('mp:start', ({ roomId, wordOrder }: { roomId: string; wordOrder: number[] }) => {
            const room = rooms[roomId];
            if (!room) return;
            room.startedAt = Date.now();
            room.wordOrder = Array.isArray(wordOrder) ? wordOrder.slice() : [];
            io.to(roomId).emit('mp:started', { roomId, startedAt: room.startedAt, wordOrder: room.wordOrder });
        });

        socket.on('mp:progress', async (payload: { roomId: string; progressIndex: number; correctCount: number; finished?: boolean }) => {
            const { roomId, progressIndex, correctCount, finished } = payload;
            const room = rooms[roomId];
            if (!room) return;
            const player = room.players[socket.id];
            if (!player) return;
            player.progressIndex = progressIndex;
            player.correctCount = correctCount;
            if (finished != null) player.finished = !!finished;
            io.to(roomId).emit('mp:state', sanitizeRoom(room));
            
            // Winner detection - only after all players finish
            const allPlayers = Object.values(room.players);
            const allFinished = allPlayers.length > 0 && allPlayers.every(p => p.finished);
            if (allFinished && !room.completed) {
                // Find winner by highest correct count, then by fastest time
                const winner = allPlayers.reduce((best, current) => {
                    if (current.correctCount > best.correctCount) return current;
                    if (current.correctCount === best.correctCount) {
                        // If same correct count, winner is the one who finished first
                        // We can't track exact finish time, so we'll use the order they finished
                        return best; // Keep the first one found
                    }
                    return best;
                });
                
                // Find the socket ID for the winner
                const winnerSocketId = Object.entries(room.players).find(([_, p]) => p.userId === winner.userId)?.[0];
                if (winnerSocketId) {
                    io.to(roomId).emit('mp:winner', { roomId, socketId: winnerSocketId, userId: winner.userId });
                }

                // Persist sessions for all finished players (once)
                const prisma = new (require('@prisma/client').PrismaClient)();
                const dictionaryId = room.dictionaryId;
                const finishedPlayers = Object.values(room.players).filter(p => p.finished);
                for (const p of finishedPlayers) {
                    try {
                        await prisma.session.create({
                            data: {
                                userId: p.userId,
                                dictionaryId,
                                recalled: p.correctCount,
                                notRecalled: Math.max(0, (room.wordOrder?.length || 0) - p.correctCount),
                                unknown: 0,
                                mode: room.mode,
                                isMultiplayer: true,
                            }
                        });
                    } catch {}
                }
                room.completed = true;
            }
        });

        socket.on('mp:ready', ({ roomId, ready }: { roomId: string; ready: boolean }) => {
            const room = rooms[roomId];
            if (!room) return;
            const player = room.players[socket.id];
            if (!player) return;
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

        socket.on('mp:pageReloaded', ({ roomId, userId, email }: { roomId: string; userId: number; email: string }) => {
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

function sanitizeRoom(room: RoomState) {
    return {
        roomId: room.roomId,
        dictionaryId: room.dictionaryId,
        mode: room.mode,
        startedAt: room.startedAt ?? null,
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

export type SanitizedRoom = ReturnType<typeof sanitizeRoom>;

