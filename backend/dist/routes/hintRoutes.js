"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hintController_1 = require("../controllers/hintController");
const authMiddleware_1 = require("../middleware/authMiddleware");
// import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
// TEMPORARY: disable global rate limit for hints; keep for easy revert
// router.use(rateLimitMiddleware(3)); // 3 hints per day for free users
router.post('/', hintController_1.hintController.getHint);
exports.default = router;
