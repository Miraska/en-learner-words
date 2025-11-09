"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const userService_1 = require("../services/userService");
const profanity_1 = require("../utils/profanity");
const jwtUtils_1 = require("../utils/jwtUtils");
const passwordValidation_1 = require("../utils/passwordValidation");
exports.authController = {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const passwordValidation = passwordValidation_1.PasswordValidator.validatePassword(password);
                if (!passwordValidation.isValid) {
                    return res.status(200).json({
                        ok: false,
                        error: 'Password does not meet requirements',
                        details: passwordValidation.errors,
                        requirements: passwordValidation_1.PasswordValidator.getPasswordRequirements()
                    });
                }
                if (profanity_1.profanity.hasProfanity(nickname)) {
                    return res.status(200).json({ ok: false, error: 'Profanity is not allowed in nickname' });
                }
                if (profanity_1.profanity.hasProfanity(email)) {
                    return res.status(200).json({ ok: false, error: 'Profanity is not allowed in email' });
                }
                const user = yield userService_1.userService.registerUser(email, password, nickname);
                const { id, subscriptionTier, createdAt, updatedAt } = user;
                res.status(201).json({
                    ok: true,
                    user: { id, email, nickname: user.nickname, subscriptionTier, createdAt, updatedAt },
                });
            }
            catch (error) {
                // Normalize registration errors to 200 with ok:false to avoid console network errors
                res.status(200).json({ ok: false, error: error.message });
            }
        });
    },
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res
                        .status(400)
                        .json({ error: 'Email and password are required' });
                }
                const user = yield userService_1.userService.loginUser(email, password);
                const token = jwtUtils_1.jwtUtils.generateToken(user.id, user.email);
                res.json({ ok: true, token, user: { id: user.id, email: user.email, nickname: user.nickname, createdAt: user.createdAt } });
            }
            catch (error) {
                // Return 200 with error payload to avoid 401 console error on login
                res.status(200).json({ ok: false, error: error.message || 'Invalid email or password' });
            }
        });
    },
};
