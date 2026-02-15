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
                steps: {
                    orderBy: { startedAt: 'asc' },
                },
                _count: {
                    select: { records: true },
                },
            },
        });

        if (!run || run.project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ run });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
