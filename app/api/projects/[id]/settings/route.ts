import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/utils/encryption';

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
                        memberships: { where: { userId: user.id } },
                    },
                },
            },
        });

        if (!project || project.workspace.memberships.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            extractionSettings: project.extractionSettings || {},
            apiKeyMode: project.apiKeyMode,
            hasProjectKey: !!project.encryptedApiKey,
            templateName: project.template.name,
            templateSlug: project.template.slug,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();

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

        const body = await request.json();
        const { extractionSettings, apiKeyMode, apiKey, requirements } = body;

        const updateData: any = {};

        // Update extraction settings
        if (extractionSettings !== undefined) {
            const currentSettings = (project.extractionSettings as any) || {};
            updateData.extractionSettings = { ...currentSettings, ...extractionSettings };
        }

        // Update requirements
        if (requirements !== undefined) {
            const currentReqs = (project.requirements as any) || {};
            updateData.requirements = { ...currentReqs, ...requirements };
        }

        // Handle API key mode
        if (apiKeyMode !== undefined) {
            if (!['PLATFORM', 'WORKSPACE', 'PROJECT'].includes(apiKeyMode)) {
                return NextResponse.json(
                    { error: 'Invalid API key mode. Must be PLATFORM, WORKSPACE, or PROJECT.' },
                    { status: 400 }
                );
            }
            updateData.apiKeyMode = apiKeyMode;

            // If switching to PROJECT mode with a key
            if (apiKeyMode === 'PROJECT' && apiKey) {
                if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
                    return NextResponse.json(
                        { error: 'Invalid API key. Key must be at least 10 characters.' },
                        { status: 400 }
                    );
                }
                updateData.encryptedApiKey = encrypt(apiKey.trim());
            }

            // If switching away from PROJECT, clear project key
            if (apiKeyMode !== 'PROJECT') {
                updateData.encryptedApiKey = null;
            }
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
        });

        return NextResponse.json({
            extractionSettings: updated.extractionSettings || {},
            apiKeyMode: updated.apiKeyMode,
            hasProjectKey: !!updated.encryptedApiKey,
            message: 'Project settings updated successfully',
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
