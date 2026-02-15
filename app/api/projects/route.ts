import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { requireWorkspaceAccess } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json(
                { error: 'workspaceId is required' },
                { status: 400 }
            );
        }

        await requireWorkspaceAccess(user.id, workspaceId);

        const projects = await prisma.project.findMany({
            where: {
                workspaceId,
                status: 'ACTIVE',
            },
            include: {
                template: true,
                _count: {
                    select: {
                        documents: true,
                        runs: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ projects });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const {
            workspaceId,
            templateId,
            name,
            requirements,
            extractionSettings,
            apiKeyMode,
            apiKey,
        } = body;

        if (!workspaceId || !templateId || !name) {
            return NextResponse.json(
                { error: 'workspaceId, templateId, and name are required' },
                { status: 400 }
            );
        }

        await requireWorkspaceAccess(user.id, workspaceId);

        // Generate slug
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${nanoid(6)}`;

        // Handle API key encryption if provided
        let encryptedApiKey: string | undefined;
        if (apiKey && apiKeyMode === 'PROJECT') {
            const { encrypt } = await import('@/lib/utils/encryption');
            encryptedApiKey = encrypt(apiKey);
        }

        const project = await prisma.project.create({
            data: {
                workspaceId,
                templateId,
                name,
                slug,
                requirements: requirements || {},
                extractionSettings: extractionSettings || {},
                apiKeyMode: apiKeyMode || 'PLATFORM',
                encryptedApiKey,
            },
            include: {
                template: true,
            },
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
