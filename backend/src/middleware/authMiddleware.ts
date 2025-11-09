import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwtUtils';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // Если токена нет, просто продолжаем без пользователя
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // Если токен невалидный, продолжаем без пользователя
    req.user = undefined;
    next();
  }
};