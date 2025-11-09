import express from 'express';
import supertest from 'supertest';
import authRoutes from '../src/routes/authRoutes';

jest.mock('../src/services/userService', () => ({
    userService: {
        registerUser: jest.fn(),
        loginUser: jest.fn(),
    },
}));

jest.mock('../src/utils/jwtUtils', () => ({
    jwtUtils: {
        generateToken: jest.fn(() => 'mockToken'),
    },
}));

const { userService } = require('../src/services/userService');
const { jwtUtils } = require('../src/utils/jwtUtils');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
const api = supertest(app) as any;

describe('Auth routes', () => {
    it('POST /auth/register returns 201 and user without password', async () => {
        const now = new Date();
        userService.registerUser.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            password: 'hashed',
            subscriptionTier: 'free',
            createdAt: now,
            updatedAt: now,
        });

        const res = await api
            .post('/auth/register')
            .send({ email: 'test@example.com', password: 'pass123', confirmPassword: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toMatchObject({
            id: 1,
            email: 'test@example.com',
        });
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('POST /auth/register returns 400 for missing fields', async () => {
        const res = await api.post('/auth/register').send({});
        expect(res.status).toBe(400);
    });

    it('POST /auth/register returns 400 for weak password', async () => {
        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'test@example.com', 
                password: '123', 
                confirmPassword: '123',
                nickname: 'testuser'
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Password does not meet requirements');
        expect(res.body).toHaveProperty('details');
        expect(res.body).toHaveProperty('requirements');
    });

    it('POST /auth/register accepts password without uppercase', async () => {
        userService.registerUser.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            password: 'hashed',
            subscriptionTier: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'test@example.com', 
                password: 'password123', 
                confirmPassword: 'password123',
                nickname: 'testuser'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('user');
    });

    it('POST /auth/register accepts password without special characters', async () => {
        userService.registerUser.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            password: 'hashed',
            subscriptionTier: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'test@example.com', 
                password: 'Password123', 
                confirmPassword: 'Password123',
                nickname: 'testuser'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('user');
    });

    it('POST /auth/register returns 400 for common password', async () => {
        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'test@example.com', 
                password: 'password', 
                confirmPassword: 'password',
                nickname: 'testuser'
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Password does not meet requirements');
    });

    it('POST /auth/register accepts strong password', async () => {
        userService.registerUser.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            password: 'hashed',
            subscriptionTier: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'test@example.com', 
                password: 'StrongP@ssw0rd!', 
                confirmPassword: 'StrongP@ssw0rd!',
                nickname: 'testuser'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('user');
    });

    it('POST /auth/register returns 400 for duplicate email', async () => {
        userService.registerUser.mockRejectedValue(new Error('User already exists'));

        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'existing@example.com', 
                password: 'Password123', 
                confirmPassword: 'Password123',
                nickname: 'testuser'
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'User already exists');
    });

    it('POST /auth/register returns 400 for duplicate nickname', async () => {
        userService.registerUser.mockRejectedValue(new Error('Nickname already taken'));

        const res = await api
            .post('/auth/register')
            .send({ 
                email: 'new@example.com', 
                password: 'Password123', 
                confirmPassword: 'Password123',
                nickname: 'existinguser'
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Nickname already taken');
    });

    it('POST /auth/login returns token', async () => {
        userService.loginUser.mockResolvedValue({
            id: 1,
            email: 'test@example.com',
        });
        (jwtUtils.generateToken as jest.Mock).mockReturnValue('token123');

        const res = await api
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'pass123' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ token: 'token123' });
    });

    it('POST /auth/login returns 400 for missing fields', async () => {
        const res = await api.post('/auth/login').send({ email: 'a@b.c' });
        expect(res.status).toBe(400);
    });
});
