import { Router } from 'express';
import { hintController } from '../controllers/hintController';
import { authMiddleware } from '../middleware/authMiddleware';
// import { rateLimitMiddleware } from '../middleware/rateLimitMiddleware';

const router = Router();

router.use(authMiddleware);
// TEMPORARY: disable global rate limit for hints; keep for easy revert
// router.use(rateLimitMiddleware(3)); // 3 hints per day for free users
router.post('/', hintController.getHint);

export default router;
