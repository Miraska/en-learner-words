import { PrismaClient } from '@prisma/client';
import { generateHintForWord } from '../utils/llmUtils';

const prisma = new PrismaClient();

export const hintService = {
    async getHint(wordId: number, userId: number) {
        const word = await prisma.word.findUnique({ where: { id: wordId } });
        if (!word) {
            throw new Error('Word not found');
        }
        // TEMPORARY: disable per-day limit; keep code for easy revert
        // const today = new Date().setHours(0, 0, 0, 0);
        // const hintCount = await prisma.hintUsage.count({
        //     where: {
        //         userId,
        //         usedAt: { gte: new Date(today) },
        //     },
        // });
        // const user = await prisma.user.findUnique({ where: { id: userId } });
        // if (user?.subscriptionTier !== 'premium' && hintCount >= 3) {
        //     throw new Error('Hint limit reached for today');
        // }
        await prisma.hintUsage.create({
            data: { userId, wordText: word.word },
        });
        const hint = await generateHintForWord(word.word, word.translation);
        return hint;
    },
};
