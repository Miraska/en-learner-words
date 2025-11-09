// Cleanup script: remove legacy UserWord rows that don't match the new constraints
// - Deletes UserWord rows with NULL languageId when a language-specific row exists for same userId+wordText
// - Optionally, you can uncomment the second phase to delete ALL NULL languageId rows

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting cleanup of legacy UserWord rows...');

  // 1) Find duplicates: legacy (languageId null) that clash with specific ones
  const legacy = await prisma.userWord.findMany({
    where: { languageId: null },
    select: { id: true, userId: true, wordText: true },
  });

  let removed = 0;
  for (const row of legacy) {
    const existsSpecific = await prisma.userWord.findFirst({
      where: { userId: row.userId, wordText: row.wordText, languageId: { not: null } },
      select: { id: true },
    });
    if (existsSpecific) {
      await prisma.userWord.delete({ where: { id: row.id } });
      removed += 1;
    }
  }
  console.log(`Removed legacy rows that conflict with specific entries: ${removed}`);

  // 2) Optional: remove all remaining NULL languageId rows (uncomment to enable)
  const deletedAllNull = await prisma.userWord.deleteMany({ where: { languageId: null } });
  console.log(`Removed all remaining NULL languageId rows: ${deletedAllNull.count}`);

  console.log('Cleanup done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


