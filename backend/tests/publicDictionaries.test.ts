import express from 'express';
import supertest from 'supertest';
import dictionaryRoutes from '../src/routes/dictionaryRoutes';

// Mock auth middleware for like tests
jest.mock('../src/middleware/authMiddleware', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.user = { id: 1 };
        next();
    },
    optionalAuthMiddleware: (req: any, _res: any, next: any) => {
        // Optional auth - no user required
        next();
    },
}));

// Mock dictionary service for like tests
jest.mock('../src/services/dictionaryService', () => ({
    dictionaryService: {
        getPublicDictionariesWithProgress: jest.fn(),
        likeDictionaryByUser: jest.fn(),
    },
}));

const { dictionaryService } = require('../src/services/dictionaryService');

const app = express();
app.use(express.json());
app.use('/dictionaries', dictionaryRoutes);
const api = supertest(app) as any;

describe('Public Dictionaries API', () => {
    describe('GET /dictionaries/public', () => {
        it('should return public dictionaries', async () => {
            // Mock the service to return test data
            dictionaryService.getPublicDictionariesWithProgress.mockResolvedValue([
                {
                    id: 1,
                    name: 'Test Dictionary',
                    likes: 5,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                }
            ]);

            const response = await api
                .get('/dictionaries/public')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Проверяем структуру словаря
            const dictionary = response.body[0];
            expect(dictionary).toHaveProperty('id');
            expect(dictionary).toHaveProperty('name');
            expect(dictionary).toHaveProperty('likes');
            expect(dictionary).toHaveProperty('isPublic');
            expect(dictionary.isPublic).toBe(true);
            expect(dictionary).toHaveProperty('sourceLanguage');
            expect(dictionary).toHaveProperty('targetLanguage');
            expect(dictionary).toHaveProperty('createdBy');
            expect(dictionary).toHaveProperty('_count');
        });

        it('should filter by source language', async () => {
            dictionaryService.getPublicDictionariesWithProgress.mockResolvedValue([
                {
                    id: 1,
                    name: 'Test Dictionary',
                    likes: 5,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                }
            ]);

            const response = await api
                .get('/dictionaries/public?sourceLangId=1')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((dictionary: any) => {
                    expect(dictionary.sourceLanguage.id).toBe(1);
                });
            }
        });

        it('should filter by target language', async () => {
            dictionaryService.getPublicDictionariesWithProgress.mockResolvedValue([
                {
                    id: 1,
                    name: 'Test Dictionary',
                    likes: 5,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                }
            ]);

            const response = await api
                .get('/dictionaries/public?targetLangId=2')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((dictionary: any) => {
                    expect(dictionary.targetLanguage.id).toBe(2);
                });
            }
        });

        it('should sort by likes in descending order', async () => {
            dictionaryService.getPublicDictionariesWithProgress.mockResolvedValue([
                {
                    id: 1,
                    name: 'Test Dictionary 1',
                    likes: 10,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                },
                {
                    id: 2,
                    name: 'Test Dictionary 2',
                    likes: 5,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                }
            ]);

            const response = await api
                .get('/dictionaries/public?sortBy=likes&sortOrder=desc')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(1);

            // Проверяем, что лайки отсортированы по убыванию
            for (let i = 0; i < response.body.length - 1; i++) {
                expect(response.body[i].likes).toBeGreaterThanOrEqual(
                    response.body[i + 1].likes
                );
            }
        });

        it('should search by name', async () => {
            dictionaryService.getPublicDictionariesWithProgress.mockResolvedValue([
                {
                    id: 1,
                    name: 'Английские слова',
                    likes: 5,
                    isPublic: true,
                    sourceLanguage: { id: 1, name: 'English' },
                    targetLanguage: { id: 2, name: 'Russian' },
                    createdBy: { id: 1, email: 'test@example.com' },
                    _count: { words: 10 }
                }
            ]);

            const response = await api
                .get('/dictionaries/public')
                .query({ search: 'английские' })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((dictionary: any) => {
                expect(dictionary.name.toLowerCase()).toContain('английские');
            });
        });
    });

    describe('POST /dictionaries/:id/like', () => {
        it('should increment likes for a dictionary', async () => {
            // Mock the like service
            dictionaryService.likeDictionaryByUser.mockResolvedValue({
                id: 1,
                likes: 16
            });

            // Лайкаем словарь
            const likeResponse = await api
                .post('/dictionaries/1/like')
                .expect(200);

            expect(likeResponse.body.likes).toBe(16);
        });

        it('should return 400 for non-existent dictionary', async () => {
            // Mock error for non-existent dictionary
            dictionaryService.likeDictionaryByUser.mockRejectedValue(new Error('Dictionary not found'));

            await api.post('/dictionaries/99999/like').expect(400);
        });
    });
});
