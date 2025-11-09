import { PrismaClient } from '@prisma/client';
import { bcryptUtils } from '../utils/bcryptUtils';

const prisma = new PrismaClient();

export const userService = {
  async registerUser(email: string, password: string, nickname: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }
    if (nickname && nickname.trim()) {
      const existingNick = await prisma.user.findFirst({ where: { nickname } });
      if (existingNick) {
        throw new Error('Nickname already taken');
      }
    } else {
      throw new Error('Nickname is required');
    }
    const hashedPassword = await bcryptUtils.hashPassword(password);
    return prisma.user.create({
      data: { email, password: hashedPassword, nickname },
    });
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const isValid = await bcryptUtils.comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    return user;
  },
};