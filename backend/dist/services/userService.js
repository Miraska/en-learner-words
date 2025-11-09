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
exports.userService = void 0;
const client_1 = require("@prisma/client");
const bcryptUtils_1 = require("../utils/bcryptUtils");
const prisma = new client_1.PrismaClient();
exports.userService = {
    registerUser(email, password, nickname) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new Error('User already exists');
            }
            if (nickname && nickname.trim()) {
                const existingNick = yield prisma.user.findFirst({ where: { nickname } });
                if (existingNick) {
                    throw new Error('Nickname already taken');
                }
            }
            else {
                throw new Error('Nickname is required');
            }
            const hashedPassword = yield bcryptUtils_1.bcryptUtils.hashPassword(password);
            return prisma.user.create({
                data: { email, password: hashedPassword, nickname },
            });
        });
    },
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma.user.findUnique({ where: { email } });
            if (!user) {
                throw new Error('Invalid credentials');
            }
            const isValid = yield bcryptUtils_1.bcryptUtils.comparePassword(password, user.password);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }
            return user;
        });
    },
};
