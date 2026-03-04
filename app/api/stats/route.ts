import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId');

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
        }

        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: { userId_workspaceId: { userId: user.id, workspaceId } },
        });
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const [docCount, runCount, costAgg, usageRecord] = await Promise.all([
            prisma.document.count({
                where: { project: { workspaceId } },
            }),
            prisma.run.count({
                where: { project: { workspaceId } },
            }),
            prisma.run.aggregate({
                where: { project: { workspaceId }, status: 'COMPLETED' },
                _sum: { costEstimate: true },
            }),
            prisma.usageRecord.findFirst({
                where: { workspaceId },
                orderBy: { periodStart: 'desc' },
            }),
        ]);

        return NextResponse.json({
            stats: {
                totalDocs: docCount,
                totalRuns: runCount,
                totalCostUsd: Number((costAgg._sum.costEstimate ?? 0).toFixed(4)),
                totalPagesProcessed: usageRecord?.pagesUsed ?? 0,
            },
        });
    } catch (error: any) {
        const status = error.message === 'Unauthorized' ? 401 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
}
