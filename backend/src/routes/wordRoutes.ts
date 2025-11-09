import { Router } from 'express';
import { wordController } from '../controllers/wordController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route with optional auth (for viewing words in public dictionaries)
router.get('/', optionalAuthMiddleware, wordController.getAll);
router.get('/by-language-pair', optionalAuthMiddleware, wordController.getByLanguagePair);

router.use(authMiddleware);
router.post('/', wordController.create);
router.post('/bulk', wordController.createBulk);
router.put('/:id', wordController.update);
router.delete('/:id', wordController.delete);
router.post('/:id/learned', wordController.setLearned);
// Update learned status by word text (independent of dictionary)
router.post('/by-text/:word/learned', wordController.setLearnedByText);
router.get('/learned/me', wordController.getLearned);

export default router;
