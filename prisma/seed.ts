import { PrismaClient } from '@prisma/client';
import { COI_TEMPLATE } from '../lib/templates/coi-template';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create COI template
    const template = await prisma.template.upsert({
        where: { slug: COI_TEMPLATE.slug },
        update: {},
        create: {
            slug: COI_TEMPLATE.slug,
            name: COI_TEMPLATE.name,
            version: COI_TEMPLATE.version,
            category: COI_TEMPLATE.category,
            config: {
                fields: COI_TEMPLATE.fields,
                validators: COI_TEMPLATE.validators,
                extractionPrompt: COI_TEMPLATE.extractionPrompt,
            } as any,
            isActive: true,
        },
    });

    console.log('Created template:', template.name);

    // Create demo user
    const user = await prisma.user.upsert({
        where: { email: 'demo@docdoctor.app' },
        update: {},
        create: {
            email: 'demo@docdoctor.app',
            name: 'Demo User',
        },
    });

    console.log('Created user:', user.email);

    // Create demo workspace
    const workspace = await prisma.workspace.upsert({
        where: { slug: 'demo-workspace' },
        update: {},
        create: {
            name: 'Demo Workspace',
            slug: 'demo-workspace',
            memberships: {
                create: {
                    userId: user.id,
                    role: 'OWNER',
                },
            },
        },
    });

    console.log('Created workspace:', workspace.name);

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
