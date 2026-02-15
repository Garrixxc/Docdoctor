import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { generatePresignedUploadUrl } from '@/lib/storage/s3-client';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { filename, fileType, projectId } = body;

        if (!filename || !fileType || !projectId) {
            return NextResponse.json(
                { error: 'filename, fileType, and projectId are required' },
                { status: 400 }
            );
        }

        // Get project and verify access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { workspace: { include: { memberships: true } } },
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const hasAccess = project.workspace.memberships.some(
            (m) => m.userId === user.id
        );

        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Generate presigned URL
        const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl({
            filename,
            fileType,
            workspaceId: project.workspaceId,
            projectId: project.id,
        });

        return NextResponse.json({
            uploadUrl,
            fileUrl,
            key,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
