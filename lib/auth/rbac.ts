import { MembershipRole } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function getUserWorkspaceMembership(
    userId: string,
    workspaceId: string
) {
    return await prisma.membership.findUnique({
        where: {
            userId_workspaceId: {
                userId,
                workspaceId,
            },
        },
    });
}

export async function hasWorkspaceAccess(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const membership = await getUserWorkspaceMembership(userId, workspaceId);
    return !!membership;
}

export async function hasRole(
    userId: string,
    workspaceId: string,
    roles: MembershipRole[]
): Promise<boolean> {
    const membership = await getUserWorkspaceMembership(userId, workspaceId);
    if (!membership) return false;
    return roles.includes(membership.role);
}

export async function canEditProject(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return hasRole(userId, workspaceId, [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
    ]);
}

export async function canReviewRecords(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return hasRole(userId, workspaceId, [
        MembershipRole.OWNER,
        MembershipRole.ADMIN,
        MembershipRole.MEMBER,
        MembershipRole.REVIEWER,
    ]);
}

export async function canInviteMembers(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return hasRole(userId, workspaceId, [MembershipRole.OWNER, MembershipRole.ADMIN]);
}

export async function requireWorkspaceAccess(
    userId: string,
    workspaceId: string
) {
    const hasAccess = await hasWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
        throw new Error('Forbidden: No access to workspace');
    }
}
