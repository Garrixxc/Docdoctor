import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';
import { enqueueDocumentProcessing } from '@/lib/queues/queues';

export async function GET(
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
                        memberships: { where: { userId: user.id } },
                    },
                },
            },
        });

        if (!project || project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const runs = await prisma.run.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                triggerer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        records: true,
                    },
                },
            },
        });

        return NextResponse.json({ runs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
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
                template: true,
                workspace: {
                    include: {
                        memberships: { where: { userId: user.id } },
                    },
                },
            },
        });

        if (!project || project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get document IDs from request body (optional)
        const body = await request.json().catch(() => ({}));
        const { documentIds } = body;

        // Create run with snapshots
        const run = await prisma.run.create({
            data: {
                projectId,
                triggeredBy: user.id,
                status: 'PENDING',
                settingsSnapshot: project.extractionSettings || {},
                templateSnapshot: {
                    name: project.template.name,
                    slug: project.template.slug,
                    version: project.template.version,
                    ...(project.template.config as object),
                },
                progress: documentIds ? { selectedDocumentIds: documentIds } : {},
            },
        });

        // Enqueue processing job
        await enqueueDocumentProcessing(run.id);

        return NextResponse.json({ run }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
