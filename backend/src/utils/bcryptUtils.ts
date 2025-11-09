import bcrypt from 'bcrypt';

export const bcryptUtils = {
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  },

  async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  },
};