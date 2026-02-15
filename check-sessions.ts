import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
    console.log('--- CHECKING SESSIONS ---');
    const sessions = await prisma.session.findMany({
        take: 5,
        include: {
            user: true
        },
        orderBy: { expires: 'desc' }
    });
    console.log('Recent sessions:', JSON.stringify(sessions, null, 2));

    const userEmail = 'gaurav.salvi411@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (user) {
        const userSessions = await prisma.session.findMany({
            where: { userId: user.id }
        });
        console.log(`Sessions for ${userEmail}:`, userSessions.length);
    }
}

checkSessions()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
