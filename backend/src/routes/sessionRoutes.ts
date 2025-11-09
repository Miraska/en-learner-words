import { Router } from 'express';
import { sessionController } from '../controllers/sessionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);
router.get('/me', sessionController.me);

router.post('/', sessionController.create);
router.post('/complete', sessionController.create);
router.get('/:userId', sessionController.getUserSessions);

export default router;