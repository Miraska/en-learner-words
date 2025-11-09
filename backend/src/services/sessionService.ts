import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sessionService = {
    async createSession(data: {
        dictionaryId: number;
        userId: number;
        recalled: number;
        notRecalled: number;
        unknown: number;
        mode?: string;
        isMultiplayer?: boolean;
    }) {
        const dictionary = await prisma.dictionary.findUnique({ where: { id: data.dictionaryId } });
        if (!dictionary) throw new Error('Dictionary not found');
        // Any authenticated user may complete a session on any existing dictionary
        return prisma.session.create({ data: {
            dictionaryId: data.dictionaryId,
            userId: data.userId,
            recalled: data.recalled,
            notRecalled: data.notRecalled,
            unknown: data.unknown,
            mode: data.mode ?? 'unknown',
            isMultiplayer: data.isMultiplayer ?? false,
        }});
    },

    async getUserSessions(userId: number) {
        return prisma.session.findMany({ where: { userId } });
    },
};
