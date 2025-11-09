import express from 'express';
import supertest from 'supertest';

// Mock auth middleware
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: 1 };
        next();
    },
    optionalAuthMiddleware: (req: any, _res: any, next: any) => {
        next();
    },
}));

// Mock dictionary service
const mockDictionaryService = {
    createDictionary: jest.fn(),
    getDictionaries: jest.fn(),
    getPublicDictionariesWithProgress: jest.fn(),
    updateDictionary: jest.fn(),
    deleteDictionary: jest.fn(),
    likeDictionaryByUser: jest.fn(),
    getUserLikes: jest.fn(),
};

jest.mock('../src/services/dictionaryService', () => ({
    dictionaryService: mockDictionaryService,
}));

// Import after mocking
const dictionaryController = require('../src/controllers/dictionaryController').dictionaryController;

const app = express();
app.use(express.json());

// Create routes manually
app.post('/dictionaries', dictionaryController.create);
app.get('/dictionaries', dictionaryController.getAll);
app.get('/dictionaries/public', dictionaryController.getPublic);
app.post('/dictionaries/:id/like', dictionaryController.likeDictionary);
app.put('/dictionaries/:id', dictionaryController.update);
app.delete('/dictionaries/:id', dictionaryController.delete);
app.get('/dictionaries/likes/me', dictionaryController.getUserLikes);

const api = supertest(app) as any;

describe('Dictionary routes', () => {
    it('POST /dictionaries validates required fields', async () => {
        const res = await api.post('/dictionaries').send({});
        expect(res.status).toBe(400);
    });
});
