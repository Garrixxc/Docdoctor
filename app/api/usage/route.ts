import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma as db } from '@/lib/db';
import { getUsageInfo, FREE_TIER_PAGE_LIMIT } from '@/lib/utils/usage-tracker';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: {
            memberships: {
                include: { workspace: true },
                take: 1,
            },
        },
    });

    if (!user || user.memberships.length === 0) {
        return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const workspace = user.memberships[0].workspace;
    const usage = await getUsageInfo(workspace.id);

    return NextResponse.json({
        usage: {
            ...usage,
            pagesLimit: usage.pagesLimit === -1 ? 'unlimited' : usage.pagesLimit,
            remainingPages: usage.remainingPages === -1 ? 'unlimited' : usage.remainingPages,
        },
        workspace: {
            id: workspace.id,
            name: workspace.name,
            tier: workspace.tier,
        },
        limits: {
            freeTierPages: FREE_TIER_PAGE_LIMIT,
        },
    });
}
