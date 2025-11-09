"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wordController_1 = require("../controllers/wordController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public route with optional auth (for viewing words in public dictionaries)
router.get('/', authMiddleware_1.optionalAuthMiddleware, wordController_1.wordController.getAll);
router.get('/by-language-pair', authMiddleware_1.optionalAuthMiddleware, wordController_1.wordController.getByLanguagePair);
router.use(authMiddleware_1.authMiddleware);
router.post('/', wordController_1.wordController.create);
router.post('/bulk', wordController_1.wordController.createBulk);
router.put('/:id', wordController_1.wordController.update);
router.delete('/:id', wordController_1.wordController.delete);
router.post('/:id/learned', wordController_1.wordController.setLearned);
// Update learned status by word text (independent of dictionary)
router.post('/by-text/:word/learned', wordController_1.wordController.setLearnedByText);
router.get('/learned/me', wordController_1.wordController.getLearned);
exports.default = router;
