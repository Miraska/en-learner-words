import { Router } from 'express';
import { dictionaryController } from '../controllers/dictionaryController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route with optional auth (for progress tracking)
router.get('/public', optionalAuthMiddleware, dictionaryController.getPublic);
router.post('/:id/like', authMiddleware, dictionaryController.likeDictionary);

// Public route with optional auth (for viewing public dictionaries)
router.get('/:id', optionalAuthMiddleware, dictionaryController.getOne);

router.use(authMiddleware);
router.post('/', dictionaryController.create);
router.get('/', dictionaryController.getAll);
router.get('/likes/me', dictionaryController.getUserLikes);
router.put('/:id', dictionaryController.update);
router.delete('/:id', dictionaryController.delete);

export default router;
