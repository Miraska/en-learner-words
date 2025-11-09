import supertest from 'supertest';
import express from 'express';
import hintRoutes from '../src/routes/hintRoutes';

// Mock auth middleware to inject a user id
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: 1 };
        next();
    },
}));

// Mock rate limit middleware to noop
jest.mock('../src/middleware/rateLimitMiddleware', () => ({
    rateLimitMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock hint service to avoid DB/LLM calls
jest.mock('../src/services/hintService', () => ({
    hintService: {
        getHint: jest.fn().mockResolvedValue('A helpful hint'),
    },
}));

// Build a minimal app for testing this route
const app = express();
app.use(express.json());
app.use('/hints', hintRoutes);
const api = supertest(app) as any;

describe('POST /hints', () => {
    it('returns generated hint for a valid request', async () => {
        const response = await api
            .post('/hints')
            .set('Authorization', 'Bearer test')
            .send({ wordId: 123 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('hint', 'A helpful hint');
    });
});
