import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();

        // Verify access
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

        const documents = await prisma.document.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ documents });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { name, fileUrl, fileType, fileSize, metadata } = body;

        if (!name || !fileUrl || !fileType) {
            return NextResponse.json(
                { error: 'name, fileUrl, and fileType are required' },
                { status: 400 }
            );
        }

        // Verify access
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

        const document = await prisma.document.create({
            data: {
                projectId,
                name,
                fileUrl,
                fileType,
                fileSize: fileSize || 0,
                uploadedBy: user.id,
                status: 'UPLOADED',
                metadata: metadata || {},
            },
        });

        return NextResponse.json({ document }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
