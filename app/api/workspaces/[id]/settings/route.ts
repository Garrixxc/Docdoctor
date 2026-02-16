import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/utils/encryption';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params;
    try {
        const user = await requireAuth();

        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: { userId: user.id, workspaceId },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const settings = (workspace.settings as any) || {};

        // NEVER return encrypted API key to client
        return NextResponse.json({
            settings: {
                provider: settings.provider || 'openai',
                keyMode: settings.keyMode || 'platform',
                hasApiKey: !!settings.encryptedApiKey,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: workspaceId } = await params;
    try {
        const user = await requireAuth();

        // Verify OWNER or ADMIN membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: { userId: user.id, workspaceId },
            },
        });

        if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Only workspace owners and admins can update settings' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { provider, keyMode, apiKey } = body;

        // Validate inputs
        if (keyMode && !['platform', 'byo'].includes(keyMode)) {
            return NextResponse.json(
                { error: 'Invalid key mode. Must be "platform" or "byo".' },
                { status: 400 }
            );
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const currentSettings = (workspace.settings as any) || {};
        const updatedSettings: any = { ...currentSettings };

        if (provider !== undefined) updatedSettings.provider = provider;
        if (keyMode !== undefined) updatedSettings.keyMode = keyMode;

        // Handle BYO API key
        if (keyMode === 'byo' && apiKey) {
            // Validate key format (basic check)
            if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
                return NextResponse.json(
                    { error: 'Invalid API key. Key must be at least 10 characters.' },
                    { status: 400 }
                );
            }

            // Encrypt and store
            updatedSettings.encryptedApiKey = encrypt(apiKey.trim());
        }

        // If switching away from BYO, clear the stored key
        if (keyMode === 'platform') {
            delete updatedSettings.encryptedApiKey;
        }

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { settings: updatedSettings },
        });

        return NextResponse.json({
            settings: {
                provider: updatedSettings.provider || 'openai',
                keyMode: updatedSettings.keyMode || 'platform',
                hasApiKey: !!updatedSettings.encryptedApiKey,
            },
            message: 'Workspace settings updated successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
