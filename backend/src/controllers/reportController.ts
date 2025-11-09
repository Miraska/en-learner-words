import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reportController = {
    async create(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { type, comment } = req.body;

            if (!type || !comment) {
                return res.status(400).json({ error: 'Type and comment are required' });
            }

            const validTypes = ['bug', 'dictionary', 'feature', 'other'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid report type' });
            }

            const report = await prisma.report.create({
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
        } catch (error) {
            console.error('Create report error:', error);
            res.status(500).json({ error: 'Failed to create report' });
        }
    },

    async getUserReports(req: Request, res: Response) {
        try {
            const user = req.user!;
            const { status, type, page = 1, limit = 10 } = req.query;

            const where: any = { userId: user.id };
            
            if (status) {
                where.status = status;
            }
            
            if (type) {
                where.type = type;
            }

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const [reports, total] = await Promise.all([
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
        } catch (error) {
            console.error('Get user reports error:', error);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    },

    async getAllReports(req: Request, res: Response) {
        try {
            const { status, type, page = 1, limit = 20 } = req.query;

            const where: any = {};
            
            if (status) {
                where.status = status;
            }
            
            if (type) {
                where.type = type;
            }

            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const [reports, total] = await Promise.all([
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
        } catch (error) {
            console.error('Get all reports error:', error);
            res.status(500).json({ error: 'Failed to fetch reports' });
        }
    },

    async updateReport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;

            const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const report = await prisma.report.update({
                where: { id: parseInt(id) },
                data: {
                    ...(status && { status }),
                    ...(adminNotes !== undefined && { adminNotes }),
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

            res.json(report);
        } catch (error) {
            console.error('Update report error:', error);
            res.status(500).json({ error: 'Failed to update report' });
        }
    },

    async getReportStats(req: Request, res: Response) {
        try {
            const [totalReports, pendingReports, inProgressReports, resolvedReports, closedReports] = await Promise.all([
                prisma.report.count(),
                prisma.report.count({ where: { status: 'pending' } }),
                prisma.report.count({ where: { status: 'in_progress' } }),
                prisma.report.count({ where: { status: 'resolved' } }),
                prisma.report.count({ where: { status: 'closed' } })
            ]);

            const reportsByType = await prisma.report.groupBy({
                by: ['type'],
                _count: {
                    type: true
                }
            });

            const recentReports = await prisma.report.findMany({
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
        } catch (error) {
            console.error('Get report stats error:', error);
            res.status(500).json({ error: 'Failed to fetch report statistics' });
        }
    }
};
