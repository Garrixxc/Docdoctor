import { prisma as db } from '@/lib/db';

const FREE_TIER_PAGE_LIMIT = 50;
const FREE_TIER_MAX_DOCS_PER_PROJECT = 25;

export interface UsageInfo {
    pagesUsed: number;
    pagesLimit: number;
    runsUsed: number;
    costAccrued: number;
    percentUsed: number;
    isAtLimit: boolean;
    tier: 'FREE' | 'PRO';
    remainingPages: number;
}

function getCurrentPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get or create the current month's usage record for a workspace.
 */
async function getOrCreateUsageRecord(workspaceId: string) {
    const periodStart = getCurrentPeriodStart();

    const record = await db.usageRecord.upsert({
        where: {
            workspaceId_periodStart: {
                workspaceId,
                periodStart,
            },
        },
        create: {
            workspaceId,
            periodStart,
            pagesUsed: 0,
            runsUsed: 0,
            costAccrued: 0,
        },
        update: {},
    });

    return record;
}

/**
 * Get current usage info for a workspace, including limits and tier.
 */
export async function getUsageInfo(workspaceId: string): Promise<UsageInfo> {
    const workspace = await db.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { tier: true, settings: true },
    });

    const record = await getOrCreateUsageRecord(workspaceId);
    const tier = workspace.tier;
    const isPro = tier === 'PRO';

    // PRO workspaces (BYO key) have no page limit
    const pagesLimit = isPro ? Infinity : FREE_TIER_PAGE_LIMIT;
    const remainingPages = isPro ? Infinity : Math.max(0, FREE_TIER_PAGE_LIMIT - record.pagesUsed);
    const percentUsed = isPro ? 0 : Math.min(100, Math.round((record.pagesUsed / FREE_TIER_PAGE_LIMIT) * 100));

    return {
        pagesUsed: record.pagesUsed,
        pagesLimit: isPro ? -1 : FREE_TIER_PAGE_LIMIT, // -1 = unlimited
        runsUsed: record.runsUsed,
        costAccrued: record.costAccrued,
        percentUsed,
        isAtLimit: !isPro && record.pagesUsed >= FREE_TIER_PAGE_LIMIT,
        tier,
        remainingPages: isPro ? -1 : remainingPages,
    };
}

/**
 * Check if a workspace can process more pages. Returns error message or null.
 */
export async function checkUsageLimit(workspaceId: string, pagesToProcess: number = 1): Promise<string | null> {
    const usage = await getUsageInfo(workspaceId);

    if (usage.tier === 'PRO') return null; // No limits

    if (usage.isAtLimit) {
        return `Free tier limit reached (${FREE_TIER_PAGE_LIMIT} pages/month). Add your own API key to unlock unlimited processing.`;
    }

    if (usage.pagesUsed + pagesToProcess > FREE_TIER_PAGE_LIMIT) {
        return `Processing ${pagesToProcess} pages would exceed your free tier limit. You have ${usage.remainingPages} pages remaining this month.`;
    }

    return null;
}

/**
 * Check max documents per project for free tier.
 */
export async function checkDocumentLimit(workspaceId: string, currentDocCount: number): Promise<string | null> {
    const workspace = await db.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { tier: true },
    });

    if (workspace.tier === 'PRO') return null;

    if (currentDocCount >= FREE_TIER_MAX_DOCS_PER_PROJECT) {
        return `Free tier is limited to ${FREE_TIER_MAX_DOCS_PER_PROJECT} documents per project. Add your own API key to unlock unlimited uploads.`;
    }

    return null;
}

/**
 * Increment usage after processing pages.
 */
export async function incrementUsage(
    workspaceId: string,
    pages: number,
    cost: number = 0
): Promise<void> {
    const periodStart = getCurrentPeriodStart();

    await db.usageRecord.upsert({
        where: {
            workspaceId_periodStart: {
                workspaceId,
                periodStart,
            },
        },
        create: {
            workspaceId,
            periodStart,
            pagesUsed: pages,
            runsUsed: 1,
            costAccrued: cost,
        },
        update: {
            pagesUsed: { increment: pages },
            runsUsed: { increment: 1 },
            costAccrued: { increment: cost },
        },
    });
}

export { FREE_TIER_PAGE_LIMIT, FREE_TIER_MAX_DOCS_PER_PROJECT };
