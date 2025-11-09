import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const languageService = {
    async getAll() {
        return prisma.language.findMany({ orderBy: { name: 'asc' } });
    },
    async listPairs() {
        return (prisma as any).languagePair.findMany({ orderBy: [{ sourceLangId: 'asc' }, { targetLangId: 'asc' }] });
    },
    async createPair(sourceLangId: number, targetLangId: number) {
        if (sourceLangId === targetLangId) {
            throw new Error('sourceLangId and targetLangId must be different');
        }
        // Ensure languages exist
        const [src, tgt] = await Promise.all([
            prisma.language.findUnique({ where: { id: sourceLangId } }),
            prisma.language.findUnique({ where: { id: targetLangId } }),
        ]);
        if (!src || !tgt) throw new Error('Language not found');
        const pair = await (prisma as any).languagePair.upsert({
            where: { sourceLangId_targetLangId: { sourceLangId, targetLangId } },
            update: {},
            create: { sourceLangId, targetLangId },
        });
        return pair;
    },
    async countPairUsage(pairId: number) {
        const count = await prisma.userWord.count({ where: { languagePairId: pairId } as any });
        return count;
    },
    async deletePair(pairId: number, force: boolean = false, currentUserId?: number) {
        const inUse = await prisma.userWord.count({ where: { languagePairId: pairId } as any });
        if (inUse > 0 && !force) {
            const err: any = new Error('Language pair is in use');
            err.code = 'PAIR_IN_USE';
            err.count = inUse;
            throw err;
        }
        if (inUse > 0 && force) {
            // Remove user's words in that pair if user specified, otherwise all
            if (typeof currentUserId === 'number') {
                await prisma.userWord.deleteMany({ where: { languagePairId: pairId, userId: currentUserId } as any });
            } else {
                await prisma.userWord.deleteMany({ where: { languagePairId: pairId } as any });
            }
        }
        return (prisma as any).languagePair.delete({ where: { id: pairId } });
    },
};
