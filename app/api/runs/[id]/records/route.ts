import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: runId } = await params;
    console.log(`[API] GET /api/runs/${runId}/records - Start`);
    try {
        let user;
        try {
            user = await requireAuth();
            console.log(`[API] Auth success for user: ${user.email} (ID: ${user.id})`);
        } catch (authError) {
            console.warn(`[API] Auth failed: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`);
            throw authError;
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        console.log(`[API] Query status filter: ${status || 'none'}`);

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

        console.log(`[API] Found ${records.length} records for run ${runId}`);
        return NextResponse.json({ records });
    } catch (error: any) {
        console.error(`[API] Error in GET /api/runs/${runId}/records:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
