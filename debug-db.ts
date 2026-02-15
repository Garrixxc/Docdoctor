import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RUN CHECK ---');
    const runId = 'cmlodv8af000fva0mqta7c5dr';
    const run = await prisma.run.findUnique({
        where: { id: runId },
        include: {
            _count: {
                select: { records: true }
            }
        }
    });
    console.log('Run:', JSON.stringify(run, null, 2));

    if (run) {
        const records = await prisma.extractionRecord.findMany({
            where: { runId: runId },
            include: {
                fields: true
            }
        });
        console.log('Records count:', records.length);
        if (records.length > 0) {
            console.log('First record fields count:', records[0].fields.length);
        }
    }

    console.log('\n--- PROJECTS CHECK ---');
    const projects = await prisma.project.findMany({
        take: 5,
        include: {
            _count: {
                select: { documents: true, runs: true }
            }
        }
    });
    console.log('Projects:', JSON.stringify(projects, null, 2));

    console.log('\n--- SESSION / USER CHECK ---');
    const userEmail = 'gaurav.salvi411@gmail.com';
    const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
            memberships: {
                include: {
                    workspace: true
                }
            }
        }
    });
    console.log('User in DB:', JSON.stringify(dbUser, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
