import { PrismaClient } from '@prisma/client';
import { COI_TEMPLATE, COI_DETECTION_KEYWORDS } from '../lib/templates/coi-template';
import { TRADE_INVOICE_TEMPLATE, TRADE_INVOICE_DETECTION_KEYWORDS } from '../lib/templates/trade-invoice-template';
import { RESUME_TEMPLATE, RESUME_DETECTION_KEYWORDS } from '../lib/templates/resume-template';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting robust seed...');

    const templates = [
        {
            template: COI_TEMPLATE,
            keywords: COI_DETECTION_KEYWORDS,
            description: 'Advanced COI validation with industrial requirement matching.',
            icon: 'Shield'
        },
        {
            template: TRADE_INVOICE_TEMPLATE,
            keywords: TRADE_INVOICE_DETECTION_KEYWORDS,
            description: 'Extract structured data from commercial invoices. Validates shipper/consignee info, line items, and totals.',
            icon: 'Receipt'
        },
        {
            template: RESUME_TEMPLATE,
            keywords: RESUME_DETECTION_KEYWORDS,
            description: 'Extract candidate data from resumes into a structured dataset. Validates email format and required fields.',
            icon: 'User'
        }
    ];

    for (const t of templates) {
        console.log(`Upserting template: ${t.template.name} (${t.template.slug})`);
        await prisma.template.upsert({
            where: { slug: t.template.slug },
            update: {
                name: t.template.name,
                category: t.template.category,
                isActive: true,
                config: {
                    fields: t.template.fields,
                    validators: t.template.validators,
                    extractionPrompt: t.template.extractionPrompt,
                    detectionKeywords: t.keywords,
                    description: t.description,
                    icon: t.icon,
                } as any
            },
            create: {
                slug: t.template.slug,
                name: t.template.name,
                category: t.template.category,
                isActive: true,
                config: {
                    fields: t.template.fields,
                    validators: t.template.validators,
                    extractionPrompt: t.template.extractionPrompt,
                    detectionKeywords: t.keywords,
                    description: t.description,
                    icon: t.icon,
                } as any
            }
        });
    }

    console.log('Seeding demo user and workspace...');
    const email = 'gaurav.salvi411@gmail.com';
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Gaurav Salvi',
        },
    });

    const workspace = await prisma.workspace.upsert({
        where: { slug: 'gaurav-workspace' },
        update: {},
        create: {
            name: 'Gaurav Workspace',
            slug: 'gaurav-workspace',
            tier: 'FREE',
            memberships: {
                create: {
                    userId: user.id,
                    role: 'OWNER',
                },
            },
        },
    });

    console.log('Seed completed successfully!');
}

main()
    .catch(e => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
