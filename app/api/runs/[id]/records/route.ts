import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: runId } = await params;
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // Filter: PENDING_REVIEW, APPROVED, REJECTED

        // Verify access
        const run = await prisma.run.findUnique({
            where: { id: runId },
            include: {
                project: {
                    include: {
                        workspace: {
                            include: {
                                memberships: { where: { userId: user.id } },
                            },
                        },
                    },
                },
            },
        });

        if (!run || run.project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const where: any = { runId };
        if (status) {
            where.overallStatus = status;
        }

        const records = await prisma.extractionRecord.findMany({
            where,
            include: {
                document: true,
                fields: {
                    orderBy: { fieldName: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ records });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
