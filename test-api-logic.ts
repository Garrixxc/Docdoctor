import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiLogic() {
    const runId = 'cmlodv8af000fva0mqta7c5dr';
    const userId = 'cmloc1rml0000va8y3nwmyscc'; // Gaurav's ID from debug-db.ts

    console.log('--- TESTING API LOGIC ---');

    try {
        const run = await prisma.run.findUnique({
            where: { id: runId },
            include: {
                project: {
                    include: {
                        workspace: {
                            include: {
                                memberships: { where: { userId: userId } },
                            },
                        },
                    },
                },
            },
        });

        if (!run) {
            console.log('Error: Run not found');
            return;
        }

        if (run.project.workspace.memberships.length === 0) {
            console.log('Error: Forbidden (no membership)');
            return;
        }

        console.log('Access verified for user:', userId);

        const records = await prisma.extractionRecord.findMany({
            where: { runId },
            include: {
                document: true,
                fields: {
                    orderBy: { fieldName: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log('Records found:', records.length);
        if (records.length > 0) {
            console.log('Sample record summary:');
            console.log('- Record ID:', records[0].id);
            console.log('- Record Status:', records[0].recordStatus);
            console.log('- Fields count:', records[0].fields.length);
            console.log('- First field name:', records[0].fields[0]?.fieldName);
            console.log('- First field status:', records[0].fields[0]?.fieldStatus);
        }

    } catch (error: any) {
        console.error('API Logic Exception:', error);
    }
}

testApiLogic()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
