import express from 'express';
import supertest from 'supertest';
import sessionRoutes from '../src/routes/sessionRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: 1 };
        next();
    },
}));

jest.mock('../src/services/sessionService', () => ({
    sessionService: {
        createSession: jest.fn(),
        getUserSessions: jest.fn(),
    },
}));

const { sessionService } = require('../src/services/sessionService');

const app = express();
app.use(express.json());
app.use('/sessions', sessionRoutes);
const api = supertest(app) as any;

describe('Session routes', () => {
    it('POST /sessions validates fields', async () => {
        const res = await api.post('/sessions').send({});
        expect(res.status).toBe(400);
    });

    it('POST /sessions creates session', async () => {
        sessionService.createSession.mockResolvedValue({
            id: 1,
            dictionaryId: 2,
        });
        const res = await api
            .post('/sessions')
            .send({ dictionaryId: 2, recalled: 1, notRecalled: 0, unknown: 0 });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 1, dictionaryId: 2 });
    });

    it('GET /sessions/:userId enforces auth user', async () => {
        const res = await api.get('/sessions/2');
        expect(res.status).toBe(403);
    });

    it('GET /sessions/:userId returns list for own id', async () => {
        sessionService.getUserSessions.mockResolvedValue([{ id: 3 }]);
        const res = await api.get('/sessions/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 3 }]);
    });
});
