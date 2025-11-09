import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { profanity } from '../utils/profanity';
import { jwtUtils } from '../utils/jwtUtils';
import { PasswordValidator } from '../utils/passwordValidation';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const { email, password, confirmPassword, nickname } = req.body;
            if (!email || !password || !confirmPassword || !nickname) {
                return res.status(200).json({
                    ok: false,
                    error: 'Email, password, confirmPassword and nickname are required',
                });
            }
            if (password !== confirmPassword) {
                return res.status(200).json({ ok: false, error: 'Passwords do not match' });
            }

            // Валидация пароля
            const passwordValidation = PasswordValidator.validatePassword(password);
            if (!passwordValidation.isValid) {
                return res.status(200).json({ 
                    ok: false,
                    error: 'Password does not meet requirements',
                    details: passwordValidation.errors,
                    requirements: PasswordValidator.getPasswordRequirements()
                });
            }
            if (profanity.hasProfanity(nickname)) {
                return res.status(200).json({ ok: false, error: 'Profanity is not allowed in nickname' });
            }
            if (profanity.hasProfanity(email)) {
                return res.status(200).json({ ok: false, error: 'Profanity is not allowed in email' });
            }
            const user = await userService.registerUser(email, password, nickname);
            const { id, subscriptionTier, createdAt, updatedAt } = user;
            res.status(201).json({
                ok: true,
                user: { id, email, nickname: user.nickname, subscriptionTier, createdAt, updatedAt },
            });
        } catch (error) {
            // Normalize registration errors to 200 with ok:false to avoid console network errors
            res.status(200).json({ ok: false, error: (error as Error).message });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: 'Email and password are required' });
            }
            const user = await userService.loginUser(email, password);
            const token = jwtUtils.generateToken(user.id, user.email);
            res.json({ ok: true, token, user: { id: user.id, email: user.email, nickname: user.nickname, createdAt: user.createdAt } });
        } catch (error) {
            // Return 200 with error payload to avoid 401 console error on login
            res.status(200).json({ ok: false, error: (error as Error).message || 'Invalid email or password' });
        }
    },
};
