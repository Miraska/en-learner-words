import { Router } from 'express';
import authRoutes from './authRoutes';
import dictionaryRoutes from './dictionaryRoutes';
import wordRoutes from './wordRoutes';
import hintRoutes from './hintRoutes';
import sessionRoutes from './sessionRoutes';
import adminRoutes from './adminRoutes';
import reportRoutes from './reportRoutes';
import { languageController } from '../controllers/languageController';
import { authMiddleware } from '../middleware/authMiddleware';
import { multiplayerController } from '../controllers/multiplayerController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dictionaries', dictionaryRoutes);
router.use('/words', wordRoutes);
router.use('/hints', hintRoutes);
router.use('/sessions', sessionRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.get('/languages', languageController.getAll);
router.get('/language-pairs', languageController.listPairs);
router.post('/language-pairs', authMiddleware, languageController.createPair);
router.get('/language-pairs/:id/usage', languageController.getPairUsage);
router.delete('/language-pairs/:id', authMiddleware, languageController.deletePair);

// Multiplayer endpoints
router.post('/multiplayer/sessions', authMiddleware, multiplayerController.create);
router.get('/multiplayer/sessions/:roomId', authMiddleware, multiplayerController.get);

export default router;
