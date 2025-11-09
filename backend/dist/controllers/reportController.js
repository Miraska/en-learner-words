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
exports.reportController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.reportController = {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { type, comment } = req.body;
                if (!type || !comment) {
                    return res.status(400).json({ error: 'Type and comment are required' });
                }
                const validTypes = ['bug', 'dictionary', 'feature', 'other'];
                if (!validTypes.includes(type)) {
                    return res.status(400).json({ error: 'Invalid report type' });
                }
                const report = yield prisma.report.create({
                    data: {
                        userId: user.id,
                        type,
                        comment,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                nickname: true
                            }
                        }
                    }
                });
                res.status(201).json(report);
            }
            catch (error) {
                console.error('Create report error:', error);
                res.status(500).json({ error: 'Failed to create report' });
            }
        });
    },
    getUserReports(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { status, type, page = 1, limit = 10 } = req.query;
                const where = { userId: user.id };
                if (status) {
                    where.status = status;
                }
                if (type) {
                    where.type = type;
                }
                const skip = (Number(page) - 1) * Number(limit);
                const take = Number(limit);
                const [reports, total] = yield Promise.all([
                    prisma.report.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.report.count({ where })
                ]);
                res.json({
                    reports,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                });
            }
            catch (error) {
                console.error('Get user reports error:', error);
                res.status(500).json({ error: 'Failed to fetch reports' });
            }
        });
    },
    getAllReports(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, type, page = 1, limit = 20 } = req.query;
                const where = {};
                if (status) {
                    where.status = status;
                }
                if (type) {
                    where.type = type;
                }
                const skip = (Number(page) - 1) * Number(limit);
                const take = Number(limit);
                const [reports, total] = yield Promise.all([
                    prisma.report.findMany({
                        where,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    nickname: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take,
                    }),
                    prisma.report.count({ where })
                ]);
                res.json({
                    reports,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                });
            }
            catch (error) {
                console.error('Get all reports error:', error);
                res.status(500).json({ error: 'Failed to fetch reports' });
            }
        });
    },
    updateReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status, adminNotes } = req.body;
                const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
                if (status && !validStatuses.includes(status)) {
                    return res.status(400).json({ error: 'Invalid status' });
                }
                const report = yield prisma.report.update({
                    where: { id: parseInt(id) },
                    data: Object.assign(Object.assign({}, (status && { status })), (adminNotes !== undefined && { adminNotes })),
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                nickname: true
                            }
                        }
                    }
                });
                res.json(report);
            }
            catch (error) {
                console.error('Update report error:', error);
                res.status(500).json({ error: 'Failed to update report' });
            }
        });
    },
    getReportStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalReports, pendingReports, inProgressReports, resolvedReports, closedReports] = yield Promise.all([
                    prisma.report.count(),
                    prisma.report.count({ where: { status: 'pending' } }),
                    prisma.report.count({ where: { status: 'in_progress' } }),
                    prisma.report.count({ where: { status: 'resolved' } }),
                    prisma.report.count({ where: { status: 'closed' } })
                ]);
                const reportsByType = yield prisma.report.groupBy({
                    by: ['type'],
                    _count: {
                        type: true
                    }
                });
                const recentReports = yield prisma.report.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                nickname: true
                            }
                        }
                    }
                });
                res.json({
                    overview: {
                        totalReports,
                        pendingReports,
                        inProgressReports,
                        resolvedReports,
                        closedReports
                    },
                    reportsByType,
                    recentReports
                });
            }
            catch (error) {
                console.error('Get report stats error:', error);
                res.status(500).json({ error: 'Failed to fetch report statistics' });
            }
        });
    }
};
