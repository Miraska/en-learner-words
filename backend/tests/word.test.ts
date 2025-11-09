import express from 'express';
import supertest from 'supertest';
import wordRoutes from '../src/routes/wordRoutes';

jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: 1 };
        next();
    },
}));

jest.mock('../src/services/wordService', () => ({
    wordService: {
        createWord: jest.fn(),
        getWords: jest.fn(),
        updateWord: jest.fn(),
        deleteWord: jest.fn(),
    },
}));

const { wordService } = require('../src/services/wordService');

const app = express();
app.use(express.json());
app.use('/words', wordRoutes);
const api = supertest(app) as any;

describe('Word routes', () => {
    it('GET /words requires dictionaryId', async () => {
        const res = await api.get('/words');
        expect(res.status).toBe(400);
    });

    it('GET /words returns list', async () => {
        wordService.getWords.mockResolvedValue([{ id: 1, word: 'hi' }]);
        const res = await api.get('/words?dictionaryId=1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, word: 'hi' }]);
    });

    it('POST /words validates fields', async () => {
        const res = await api.post('/words').send({});
        expect(res.status).toBe(400);
    });

    it('POST /words creates word', async () => {
        wordService.createWord.mockResolvedValue({ id: 2, word: 'cat' });
        const res = await api
            .post('/words')
            .send({
                word: 'cat',
                translation: 'кот',
                dictionaryId: 1,
                languageId: 1,
            });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 2, word: 'cat' });
    });

    it('PUT /words/:id updates word', async () => {
        wordService.updateWord.mockResolvedValue({ id: 3, word: 'dog' });
        const res = await api.put('/words/3').send({ word: 'dog' });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: 3, word: 'dog' });
    });

    it('DELETE /words/:id removes word', async () => {
        wordService.deleteWord.mockResolvedValue({ id: 3 });
        const res = await api.delete('/words/3');
        expect(res.status).toBe(204);
    });
});
