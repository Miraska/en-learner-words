"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const reportController_1 = require("../controllers/reportController");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const router = (0, express_1.Router)();
// Замудренная ссылка для админки - очень сложный путь
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8', adminMiddleware_1.adminMiddleware, adminController_1.adminController.getStats);
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/users/:userId', adminMiddleware_1.adminMiddleware, adminController_1.adminController.getDetailedUserStats);
// Report management routes
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports', adminMiddleware_1.adminMiddleware, reportController_1.reportController.getAllReports);
router.put('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/:id', adminMiddleware_1.adminMiddleware, reportController_1.reportController.updateReport);
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/reports/stats', adminMiddleware_1.adminMiddleware, reportController_1.reportController.getReportStats);
// Dictionaries management
router.get('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries', adminMiddleware_1.adminMiddleware, adminController_1.adminController.getDictionaries);
router.delete('/x7k9m2p8q1w4e6r3t5y7u9i0o1p2a3s4d5f6g7h8j9k0l1z2x3c4v5b6n7m8/dictionaries/:id', adminMiddleware_1.adminMiddleware, adminController_1.adminController.deleteDictionary);
exports.default = router;
