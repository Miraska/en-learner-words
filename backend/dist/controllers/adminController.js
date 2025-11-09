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
exports.adminController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.adminController = {
    getStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Общая статистика пользователей
                const totalUsers = yield prisma.user.count();
                const newUsersToday = yield prisma.user.count({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                });
                const newUsersThisWeek = yield prisma.user.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                });
                const newUsersThisMonth = yield prisma.user.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                });
                // User activity statistics
                const activeUsersToday = yield prisma.user.count({
                    where: {
                        stats: {
                            lastActive: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0))
                            }
                        }
                    }
                });
                const activeUsersThisWeek = yield prisma.user.count({
                    where: {
                        stats: {
                            lastActive: {
                                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                            }
                        }
                    }
                });
                // Статистика словарей
                const totalDictionaries = yield prisma.dictionary.count();
                const publicDictionaries = yield prisma.dictionary.count({
                    where: { isPublic: true }
                });
                const privateDictionaries = totalDictionaries - publicDictionaries;
                // Статистика слов
                const totalWords = yield prisma.word.count();
                const totalUserWords = yield prisma.userWord.count();
                const learnedWords = yield prisma.userWord.count({
                    where: { learned: true }
                });
                // Статистика сессий
                const totalSessions = yield prisma.session.count();
                const sessionsToday = yield prisma.session.count({
                    where: {
                        createdAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                });
                // Language statistics
                const languageStats = yield prisma.language.findMany({
                    include: {
                        _count: {
                            select: {
                                words: true,
                                userLearnedWords: true
                            }
                        }
                    }
                });
                // Learning progress statistics
                const averageLearnedWords = yield prisma.userStats.aggregate({
                    _avg: {
                        learnedCount: true
                    }
                });
                const usersWithStreaks = yield prisma.userStats.count({
                    where: {
                        streak: {
                            gt: 0
                        }
                    }
                });
                const longestStreak = yield prisma.userStats.aggregate({
                    _max: {
                        streak: true
                    }
                });
                // Dictionary creation trends
                const dictionariesThisWeek = yield prisma.dictionary.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                });
                const dictionariesThisMonth = yield prisma.dictionary.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                });
                // Hint usage statistics
                const totalHints = yield prisma.hintUsage.count();
                const hintsToday = yield prisma.hintUsage.count({
                    where: {
                        usedAt: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                });
                // Session performance statistics
                const averageSessionScore = yield prisma.session.aggregate({
                    _avg: {
                        recalled: true
                    }
                });
                const totalRecalledWords = yield prisma.session.aggregate({
                    _sum: {
                        recalled: true
                    }
                });
                const totalNotRecalledWords = yield prisma.session.aggregate({
                    _sum: {
                        notRecalled: true
                    }
                });
                // Top users by activity (base data)
                const topUsersBase = yield prisma.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        nickname: true,
                        createdAt: true,
                        stats: true,
                        _count: {
                            select: {
                                learnedWords: true,
                                sessions: true,
                                dictionaries: true
                            }
                        }
                    },
                    orderBy: {
                        stats: {
                            learnedCount: 'desc'
                        }
                    },
                    take: 10
                });
                // Compute learned words where learned=true per user (for accuracy)
                const userIds = topUsersBase.map(u => u.id);
                const learnedGrouped = userIds.length
                    ? yield prisma.userWord.groupBy({
                        by: ['userId'],
                        where: { userId: { in: userIds }, learned: true },
                        _count: { _all: true },
                    })
                    : [];
                const userIdToLearnedTrue = new Map(learnedGrouped.map(g => [g.userId, g._count._all]));
                const topUsers = topUsersBase.map(u => (Object.assign(Object.assign({}, u), { learnedTrueCount: userIdToLearnedTrue.get(u.id) || 0 })));
                // Top dictionaries by likes
                const topDictionaries = yield prisma.dictionary.findMany({
                    where: { isPublic: true },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        likes: true,
                        createdAt: true,
                        createdBy: {
                            select: {
                                nickname: true
                            }
                        },
                        _count: {
                            select: {
                                words: true,
                                sessions: true
                            }
                        }
                    },
                    orderBy: {
                        likes: 'desc'
                    },
                    take: 10
                });
                // Daily statistics (last 30 days)
                const dailyStats = [];
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
                    const [newUsers, newSessions, newHints] = yield Promise.all([
                        prisma.user.count({
                            where: {
                                createdAt: {
                                    gte: startOfDay,
                                    lte: endOfDay
                                }
                            }
                        }),
                        prisma.session.count({
                            where: {
                                createdAt: {
                                    gte: startOfDay,
                                    lte: endOfDay
                                }
                            }
                        }),
                        prisma.hintUsage.count({
                            where: {
                                usedAt: {
                                    gte: startOfDay,
                                    lte: endOfDay
                                }
                            }
                        })
                    ]);
                    dailyStats.push({
                        date: startOfDay.toISOString().split('T')[0],
                        newUsers,
                        newSessions,
                        newHints
                    });
                }
                // Per-mode statistics with bucket mapping
                const modeBuckets = {
                    letters: ['letters'],
                    input: ['input'],
                    pair: ['pair', 'flashcard'], // flashcard sessions are part of pair
                };
                const modeTotals = {};
                const modeSeries = {};
                for (const bucket of Object.keys(modeBuckets)) {
                    const modesInBucket = modeBuckets[bucket];
                    modeTotals[bucket] = yield prisma.session.count({ where: { mode: { in: modesInBucket } } });
                    const series = [];
                    for (let i = 29; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const sod = new Date(d.setHours(0, 0, 0, 0));
                        const eod = new Date(d.setHours(23, 59, 59, 999));
                        const count = yield prisma.session.count({
                            where: {
                                mode: { in: modesInBucket },
                                createdAt: { gte: sod, lte: eod },
                            },
                        });
                        series.push({ date: sod.toISOString().split('T')[0], sessions: count });
                    }
                    modeSeries[bucket] = series;
                }
                res.json({
                    overview: {
                        totalUsers,
                        newUsersToday,
                        newUsersThisWeek,
                        newUsersThisMonth,
                        activeUsersToday,
                        activeUsersThisWeek,
                        totalDictionaries,
                        publicDictionaries,
                        privateDictionaries,
                        dictionariesThisWeek,
                        dictionariesThisMonth,
                        totalWords,
                        totalUserWords,
                        learnedWords,
                        totalSessions,
                        sessionsToday,
                        totalHints,
                        hintsToday
                    },
                    learningStats: {
                        averageLearnedWords: averageLearnedWords._avg.learnedCount || 0,
                        usersWithStreaks,
                        longestStreak: longestStreak._max.streak || 0,
                        averageSessionScore: averageSessionScore._avg.recalled || 0,
                        totalRecalledWords: totalRecalledWords._sum.recalled || 0,
                        totalNotRecalledWords: totalNotRecalledWords._sum.notRecalled || 0
                    },
                    languageStats,
                    topUsers,
                    topDictionaries,
                    dailyStats,
                    modeStats: {
                        totals: modeTotals,
                        series: modeSeries,
                    }
                });
            }
            catch (error) {
                console.error('Admin stats error:', error);
                res.status(500).json({ error: 'Failed to fetch admin statistics' });
            }
        });
    },
    getDetailedUserStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const user = yield prisma.user.findUnique({
                    where: { id: parseInt(userId) },
                    include: {
                        stats: true,
                        learnedWords: {
                            include: {
                                language: true
                            }
                        },
                        sessions: {
                            include: {
                                dictionary: {
                                    select: {
                                        name: true,
                                        sourceLanguage: true,
                                        targetLanguage: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 20
                        },
                        dictionaries: {
                            include: {
                                _count: {
                                    select: {
                                        words: true,
                                        sessions: true
                                    }
                                }
                            }
                        },
                        hintUsages: {
                            orderBy: {
                                usedAt: 'desc'
                            },
                            take: 50
                        }
                    }
                });
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json(user);
            }
            catch (error) {
                console.error('Detailed user stats error:', error);
                res.status(500).json({ error: 'Failed to fetch detailed user statistics' });
            }
        });
    },
    getDictionaries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const limit = Math.min(parseInt(String((_a = req.query.limit) !== null && _a !== void 0 ? _a : '100')), 500);
                const offset = parseInt(String((_b = req.query.offset) !== null && _b !== void 0 ? _b : '0'));
                const [items, total] = yield Promise.all([
                    prisma.dictionary.findMany({
                        take: isNaN(limit) ? 100 : limit,
                        skip: isNaN(offset) ? 0 : offset,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            createdBy: { select: { id: true, email: true, nickname: true } },
                            _count: { select: { words: true, sessions: true } },
                            sourceLanguage: { select: { id: true, code: true, name: true } },
                            targetLanguage: { select: { id: true, code: true, name: true } },
                        }
                    }),
                    prisma.dictionary.count(),
                ]);
                res.json({ items, total });
            }
            catch (error) {
                console.error('Admin getDictionaries error:', error);
                res.status(500).json({ error: 'Failed to fetch dictionaries' });
            }
        });
    },
    deleteDictionary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(String(req.params.id));
                if (isNaN(id)) {
                    return res.status(400).json({ error: 'Invalid id' });
                }
                // Admin delete with cascading dependent cleanup
                yield prisma.$transaction([
                    // Delete sessions associated with the dictionary
                    prisma.session.deleteMany({ where: { dictionaryId: id } }),
                    // Delete likes for this dictionary
                    prisma.dictionaryLike.deleteMany({ where: { dictionaryId: id } }),
                    // Delete words belonging to the dictionary (do before word sets to avoid set references)
                    prisma.word.deleteMany({ where: { dictionaryId: id } }),
                    // Delete word sets for this dictionary
                    prisma.wordSet.deleteMany({ where: { dictionaryId: id } }),
                    // Finally delete the dictionary
                    prisma.dictionary.delete({ where: { id } }),
                ]);
                return res.status(204).send();
            }
            catch (error) {
                console.error('Admin deleteDictionary error:', error);
                return res.status(400).json({ error: 'Failed to delete dictionary' });
            }
        });
    }
};
