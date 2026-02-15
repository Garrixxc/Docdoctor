import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDbColumns() {
    console.log('--- CHECKING DATABASE COLUMNS ---');
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'extraction_fields'
        `;
        console.log('Columns in extraction_fields:', JSON.stringify(columns, null, 2));
    } catch (err: any) {
        console.error('Error querying columns:', err);
    }
}

checkDbColumns()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
