/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'pl', name: 'Polish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'el', name: 'Greek' },
    { code: 'he', name: 'Hebrew' },
    { code: 'ro', name: 'Romanian' },
    { code: 'cs', name: 'Czech' },
];

async function main() {
    // Создаем языки
    for (const lang of languages) {
        await prisma.language.upsert({
            where: { code: lang.code },
            update: { name: lang.name },
            create: lang,
        });
    }
    console.log(`Seeded ${languages.length} languages`);

    // Пропускаем создание тестовых словарей — сидим только языки

    // Assign random nicknames for users without one (опционально, сохраним логику)
    const users = await prisma.user.findMany({ where: { nickname: null } });
    const used = new Set((await prisma.user.findMany({ select: { nickname: true } }))
        .map(u => u.nickname)
        .filter(Boolean));
    function randomNick() {
        const animals = ['fox','owl','tiger','eagle','wolf','bear','lynx','otter','panda','whale','koala','lion','zebra','shark'];
        const colors = ['red','blue','green','silver','gold','crimson','violet','amber','azure','indigo','ruby','emerald'];
        const a = animals[Math.floor(Math.random()*animals.length)];
        const c = colors[Math.floor(Math.random()*colors.length)];
        const n = Math.floor(Math.random()*9000 + 1000);
        return `${c}_${a}_${n}`;
    }
    for (const u of users) {
        let nick = randomNick();
        while (used.has(nick)) nick = randomNick();
        used.add(nick);
        await prisma.user.update({ where: { id: u.id }, data: { nickname: nick } });
    }
    if (users.length > 0) console.log(`Assigned nicknames to ${users.length} existing users`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
