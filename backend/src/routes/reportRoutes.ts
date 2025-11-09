import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// User routes
router.post('/', authMiddleware, reportController.create);
router.get('/my', authMiddleware, reportController.getUserReports);

// Admin routes
router.get('/admin', adminMiddleware, reportController.getAllReports);
router.put('/admin/:id', adminMiddleware, reportController.updateReport);
router.get('/admin/stats', adminMiddleware, reportController.getReportStats);

export default router;
