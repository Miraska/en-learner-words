import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { reportController } from '../controllers/reportController';
import { adminMiddleware } from '../middleware/adminMiddleware';

const router = Router();

// Замудренная ссылка для админки - очень сложный путь
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8', adminMiddleware, adminController.getStats);
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/users/:userId', adminMiddleware, adminController.getDetailedUserStats);

// Report management routes
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports', adminMiddleware, reportController.getAllReports);
router.put('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/:id', adminMiddleware, reportController.updateReport);
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/stats', adminMiddleware, reportController.getReportStats);

// Dictionaries management
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries', adminMiddleware, adminController.getDictionaries);
router.delete('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries/:id', adminMiddleware, adminController.deleteDictionary);

export default router;
