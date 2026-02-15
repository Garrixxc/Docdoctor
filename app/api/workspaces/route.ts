import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth();

        const workspaces = await prisma.workspace.findMany({
            where: {
                memberships: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                memberships: {
                    where: {
                        userId: user.id,
                    },
                },
                _count: {
                    select: {
                        projects: true,
                        memberships: true,
                    },
                },
            },
        });

        return NextResponse.json({ workspaces });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await request.json();

        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Workspace name is required' },
                { status: 400 }
            );
        }

        // Generate slug
        const baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${nanoid(6)}`;

        const workspace = await prisma.workspace.create({
            data: {
                name,
                slug,
                memberships: {
                    create: {
                        userId: user.id,
                        role: 'OWNER',
                    },
                },
            },
        });

        return NextResponse.json({ workspace }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
