"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dictionaryController_1 = require("../controllers/dictionaryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public route with optional auth (for progress tracking)
router.get('/public', authMiddleware_1.optionalAuthMiddleware, dictionaryController_1.dictionaryController.getPublic);
router.post('/:id/like', authMiddleware_1.authMiddleware, dictionaryController_1.dictionaryController.likeDictionary);
// Public route with optional auth (for viewing public dictionaries)
router.get('/:id', authMiddleware_1.optionalAuthMiddleware, dictionaryController_1.dictionaryController.getOne);
router.use(authMiddleware_1.authMiddleware);
router.post('/', dictionaryController_1.dictionaryController.create);
router.get('/', dictionaryController_1.dictionaryController.getAll);
router.get('/likes/me', dictionaryController_1.dictionaryController.getUserLikes);
router.put('/:id', dictionaryController_1.dictionaryController.update);
router.delete('/:id', dictionaryController_1.dictionaryController.delete);
exports.default = router;
