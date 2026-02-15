import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                template: true,
                workspace: {
                    include: {
                        memberships: {
                            where: { userId: user.id },
                        },
                    },
                },
                _count: {
                    select: {
                        documents: true,
                        runs: true,
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ project });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();
        const body = await request.json();

        // Verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: {
                    include: {
                        memberships: {
                            where: { userId: user.id },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update allowed fields
        const { requirements, extractionSettings, apiKeyMode, apiKey } = body;

        const updateData: any = {};
        if (requirements) updateData.requirements = requirements;
        if (extractionSettings) updateData.extractionSettings = extractionSettings;
        if (apiKeyMode) updateData.apiKeyMode = apiKeyMode;

        if (apiKey && apiKeyMode === 'PROJECT') {
            const { encrypt } = await import('@/lib/utils/encryption');
            updateData.encryptedApiKey = encrypt(apiKey);
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: { template: true },
        });

        return NextResponse.json({ project: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();

        // Verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                workspace: {
                    include: {
                        memberships: {
                            where: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: { status: 'ARCHIVED' },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
