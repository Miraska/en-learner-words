import { Request, Response } from 'express';
import { hintService } from '../services/hintService';

export const hintController = {
  async getHint(req: Request, res: Response) {
    try {
      const { wordId } = req.body;
      const userId = req.user!.id;
      const hint = await hintService.getHint(Number(wordId), userId);
      res.json({ hint });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
};