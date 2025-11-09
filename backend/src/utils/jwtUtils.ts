import jwt from 'jsonwebtoken';

export const jwtUtils = {
  generateToken(userId: number, email: string) {
    // Set token expiration to 30 days as requested
    return jwt.sign({ id: userId, email }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  },

  verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string };
  },
};