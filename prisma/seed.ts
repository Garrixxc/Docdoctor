import { PrismaClient } from '@prisma/client';
import { COI_TEMPLATE, COI_DETECTION_KEYWORDS } from '../lib/templates/coi-template';
import { TRADE_INVOICE_TEMPLATE, TRADE_INVOICE_DETECTION_KEYWORDS } from '../lib/templates/trade-invoice-template';
import { RESUME_TEMPLATE, RESUME_DETECTION_KEYWORDS } from '../lib/templates/resume-template';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // =========== Templates ===========

    // COI Template
    const coiTemplate = await prisma.template.upsert({
        where: { slug: COI_TEMPLATE.slug },
        update: {
            name: COI_TEMPLATE.name,
            version: COI_TEMPLATE.version,
            category: COI_TEMPLATE.category,
            config: {
                fields: COI_TEMPLATE.fields,
                validators: COI_TEMPLATE.validators,
                extractionPrompt: COI_TEMPLATE.extractionPrompt,
                detectionKeywords: COI_DETECTION_KEYWORDS,
                description: COI_TEMPLATE.description,
                icon: COI_TEMPLATE.icon,
                exampleUseCase: COI_TEMPLATE.exampleUseCase,
            } as any,
        },
        create: {
            slug: COI_TEMPLATE.slug,
            name: COI_TEMPLATE.name,
            version: COI_TEMPLATE.version,
            category: COI_TEMPLATE.category,
            config: {
                fields: COI_TEMPLATE.fields,
                validators: COI_TEMPLATE.validators,
                extractionPrompt: COI_TEMPLATE.extractionPrompt,
                detectionKeywords: COI_DETECTION_KEYWORDS,
                description: COI_TEMPLATE.description,
                icon: COI_TEMPLATE.icon,
                exampleUseCase: COI_TEMPLATE.exampleUseCase,
            } as any,
            isActive: true,
        },
    });
    console.log('✅ Seeded template:', coiTemplate.name);

    // Trade Invoice Template
    const tradeTemplate = await prisma.template.upsert({
        where: { slug: TRADE_INVOICE_TEMPLATE.slug },
        update: {
            name: TRADE_INVOICE_TEMPLATE.name,
            version: TRADE_INVOICE_TEMPLATE.version,
            category: TRADE_INVOICE_TEMPLATE.category,
            config: {
                fields: TRADE_INVOICE_TEMPLATE.fields,
                validators: TRADE_INVOICE_TEMPLATE.validators,
                extractionPrompt: TRADE_INVOICE_TEMPLATE.extractionPrompt,
                detectionKeywords: TRADE_INVOICE_DETECTION_KEYWORDS,
                description: 'Extract structured data from commercial invoices. Validates shipper/consignee info, line items, and totals.',
                icon: 'Receipt',
                exampleUseCase: 'Digitize trade invoices for customs processing and accounts payable.',
            } as any,
        },
        create: {
            slug: TRADE_INVOICE_TEMPLATE.slug,
            name: TRADE_INVOICE_TEMPLATE.name,
            version: TRADE_INVOICE_TEMPLATE.version,
            category: TRADE_INVOICE_TEMPLATE.category,
            config: {
                fields: TRADE_INVOICE_TEMPLATE.fields,
                validators: TRADE_INVOICE_TEMPLATE.validators,
                extractionPrompt: TRADE_INVOICE_TEMPLATE.extractionPrompt,
                detectionKeywords: TRADE_INVOICE_DETECTION_KEYWORDS,
                description: 'Extract structured data from commercial invoices. Validates shipper/consignee info, line items, and totals.',
                icon: 'Receipt',
                exampleUseCase: 'Digitize trade invoices for customs processing and accounts payable.',
            } as any,
            isActive: true,
        },
    });
    console.log('✅ Seeded template:', tradeTemplate.name);

    // Resume Template
    const resumeTemplate = await prisma.template.upsert({
        where: { slug: RESUME_TEMPLATE.slug },
        update: {
            name: RESUME_TEMPLATE.name,
            version: RESUME_TEMPLATE.version,
            category: RESUME_TEMPLATE.category,
            config: {
                fields: RESUME_TEMPLATE.fields,
                validators: RESUME_TEMPLATE.validators,
                extractionPrompt: RESUME_TEMPLATE.extractionPrompt,
                detectionKeywords: RESUME_DETECTION_KEYWORDS,
                description: 'Extract candidate data from resumes into a structured dataset. Validates email format and required fields.',
                icon: 'User',
                exampleUseCase: 'Parse resumes at scale to build a searchable candidate database.',
            } as any,
        },
        create: {
            slug: RESUME_TEMPLATE.slug,
            name: RESUME_TEMPLATE.name,
            version: RESUME_TEMPLATE.version,
            category: RESUME_TEMPLATE.category,
            config: {
                fields: RESUME_TEMPLATE.fields,
                validators: RESUME_TEMPLATE.validators,
                extractionPrompt: RESUME_TEMPLATE.extractionPrompt,
                detectionKeywords: RESUME_DETECTION_KEYWORDS,
                description: 'Extract candidate data from resumes into a structured dataset. Validates email format and required fields.',
                icon: 'User',
                exampleUseCase: 'Parse resumes at scale to build a searchable candidate database.',
            } as any,
            isActive: true,
        },
    });
    console.log('✅ Seeded template:', resumeTemplate.name);

    // =========== Demo User & Workspace ===========

    const user = await prisma.user.upsert({
        where: { email: 'demo@docdoctor.app' },
        update: {},
        create: {
            email: 'demo@docdoctor.app',
            name: 'Demo User',
        },
    });
    console.log('✅ Created user:', user.email);

    const workspace = await prisma.workspace.upsert({
        where: { slug: 'demo-workspace' },
        update: {},
        create: {
            name: 'Demo Workspace',
            slug: 'demo-workspace',
            settings: {
                provider: 'openai',
                keyMode: 'platform',
            },
            memberships: {
                create: {
                    userId: user.id,
                    role: 'OWNER',
                },
            },
        },
    });
    console.log('✅ Created workspace:', workspace.name);

    console.log('\n🎉 Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
