import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function startCronJobs() {
    // Runs every day at 00:00 (server time)
    cron.schedule('0 0 * * *', async () => {
        try {
            const retentionDays = Number(
                process.env.HINT_USAGE_RETENTION_DAYS || 30
            );
            const cutoff = new Date(
                Date.now() - retentionDays * 24 * 60 * 60 * 1000
            );
            const result = await prisma.hintUsage.deleteMany({
                where: { usedAt: { lt: cutoff } },
            });
            // silent
        } catch (error) {
            // silent
        }
    });
}
