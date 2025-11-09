// Danger: delete all Word rows (dictionary words) and related user states
// This will:
// 1) Delete UserWord and UserHardWord entries to avoid FK issues
// 2) Delete WordSet relations then Words
// Run: npm run delete:all-words

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all user word states...');
  await prisma.userWord.deleteMany({});
  await prisma.userHardWord.deleteMany({});

  console.log('Clearing all word sets (relations only)...');
  // If WordSet has relations, you may need to delete join rows first. Here we just delete sets then words.
  await prisma.wordSet.deleteMany({});

  console.log('Deleting all dictionary words...');
  await prisma.word.deleteMany({});

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


