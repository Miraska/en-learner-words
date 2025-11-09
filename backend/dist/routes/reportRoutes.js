"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const router = (0, express_1.Router)();
// User routes
router.post('/', authMiddleware_1.authMiddleware, reportController_1.reportController.create);
router.get('/my', authMiddleware_1.authMiddleware, reportController_1.reportController.getUserReports);
// Admin routes
router.get('/admin', adminMiddleware_1.adminMiddleware, reportController_1.reportController.getAllReports);
router.put('/admin/:id', adminMiddleware_1.adminMiddleware, reportController_1.reportController.updateReport);
router.get('/admin/stats', adminMiddleware_1.adminMiddleware, reportController_1.reportController.getReportStats);
exports.default = router;
