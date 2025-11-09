import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const adminController = {
    async getStats(req: Request, res: Response) {
        try {
            // Общая статистика пользователей
            const totalUsers = await prisma.user.count();
            const newUsersToday = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });
            const newUsersThisWeek = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            const newUsersThisMonth = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            // User activity statistics
            const activeUsersToday = await prisma.user.count({
                where: {
                    stats: {
                        lastActive: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }
            });

            const activeUsersThisWeek = await prisma.user.count({
                where: {
                    stats: {
                        lastActive: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            });

            // Статистика словарей
            const totalDictionaries = await prisma.dictionary.count();
            const publicDictionaries = await prisma.dictionary.count({
                where: { isPublic: true }
            });
            const privateDictionaries = totalDictionaries - publicDictionaries;

            // Статистика слов
            const totalWords = await prisma.word.count();
            const totalUserWords = await prisma.userWord.count();
            const learnedWords = await prisma.userWord.count({
                where: { learned: true }
            });

            // Статистика сессий
            const totalSessions = await prisma.session.count();
            const sessionsToday = await prisma.session.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            // Language statistics
            const languageStats = await prisma.language.findMany({
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
            const averageLearnedWords = await prisma.userStats.aggregate({
                _avg: {
                    learnedCount: true
                }
            });

            const usersWithStreaks = await prisma.userStats.count({
                where: {
                    streak: {
                        gt: 0
                    }
                }
            });

            const longestStreak = await prisma.userStats.aggregate({
                _max: {
                    streak: true
                }
            });

            // Dictionary creation trends
            const dictionariesThisWeek = await prisma.dictionary.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            const dictionariesThisMonth = await prisma.dictionary.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            // Hint usage statistics
            const totalHints = await prisma.hintUsage.count();
            const hintsToday = await prisma.hintUsage.count({
                where: {
                    usedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            // Session performance statistics
            const averageSessionScore = await prisma.session.aggregate({
                _avg: {
                    recalled: true
                }
            });

            const totalRecalledWords = await prisma.session.aggregate({
                _sum: {
                    recalled: true
                }
            });

            const totalNotRecalledWords = await prisma.session.aggregate({
                _sum: {
                    notRecalled: true
                }
            });

            // Top users by activity (base data)
            const topUsersBase = await prisma.user.findMany({
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
                ? await prisma.userWord.groupBy({
                      by: ['userId'],
                      where: { userId: { in: userIds }, learned: true },
                      _count: { _all: true },
                  })
                : [];
            const userIdToLearnedTrue = new Map<number, number>(
                learnedGrouped.map(g => [g.userId as number, g._count._all as number])
            );
            const topUsers = topUsersBase.map(u => ({
                ...u,
                learnedTrueCount: userIdToLearnedTrue.get(u.id) || 0,
            }));

            // Top dictionaries by likes
            const topDictionaries = await prisma.dictionary.findMany({
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

                const [newUsers, newSessions, newHints] = await Promise.all([
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
            const modeBuckets: Record<string, string[]> = {
                letters: ['letters'],
                input: ['input'],
                pair: ['pair', 'flashcard'], // flashcard sessions are part of pair
            };
            const modeTotals: Record<string, number> = {};
            const modeSeries: Record<string, { date: string; sessions: number }[]> = {};
            for (const bucket of Object.keys(modeBuckets)) {
                const modesInBucket = modeBuckets[bucket];
                modeTotals[bucket] = await prisma.session.count({ where: { mode: { in: modesInBucket } as any } });
                const series: { date: string; sessions: number }[] = [];
                for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const sod = new Date(d.setHours(0, 0, 0, 0));
                    const eod = new Date(d.setHours(23, 59, 59, 999));
                    const count = await prisma.session.count({
                        where: {
                            mode: { in: modesInBucket } as any,
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
        } catch (error) {
            console.error('Admin stats error:', error);
            res.status(500).json({ error: 'Failed to fetch admin statistics' });
        }
    },

    async getDetailedUserStats(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            
            const user = await prisma.user.findUnique({
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
        } catch (error) {
            console.error('Detailed user stats error:', error);
            res.status(500).json({ error: 'Failed to fetch detailed user statistics' });
        }
    }
    ,

    async getDictionaries(req: Request, res: Response) {
        try {
            const limit = Math.min(parseInt(String(req.query.limit ?? '100')), 500);
            const offset = parseInt(String(req.query.offset ?? '0'));

            const [items, total] = await Promise.all([
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
        } catch (error) {
            console.error('Admin getDictionaries error:', error);
            res.status(500).json({ error: 'Failed to fetch dictionaries' });
        }
    }
    ,

    async deleteDictionary(req: Request, res: Response) {
        try {
            const id = parseInt(String(req.params.id));
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid id' });
            }

            // Admin delete with cascading dependent cleanup
            await prisma.$transaction([
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
        } catch (error) {
            console.error('Admin deleteDictionary error:', error);
            return res.status(400).json({ error: 'Failed to delete dictionary' });
        }
    }
};
