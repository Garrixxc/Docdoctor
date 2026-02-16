import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { canReviewRecords } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
    const { fieldId } = await params;
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { value, action } = body; // action: 'EDIT', 'APPROVE', 'REJECT'

        // Get field and verify access
        const field = await prisma.extractionField.findUnique({
            where: { id: fieldId },
            include: {
                record: {
                    include: {
                        run: {
                            include: {
                                project: {
                                    include: { workspace: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!field) {
            return NextResponse.json({ error: 'Field not found' }, { status: 404 });
        }

        const workspaceId = field.record.run.project.workspaceId;
        const canReview = await canReviewRecords(user.id, workspaceId);

        if (!canReview) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let updatedField;

        if (action === 'EDIT' || value !== undefined) {
            // Store old value for audit
            const oldValue = field.extractedValue;

            updatedField = await prisma.extractionField.update({
                where: { id: fieldId },
                data: {
                    extractedValue: value,
                    updatedAt: new Date(),
                },
            });

            // Create review event
            await prisma.reviewEvent.create({
                data: {
                    fieldId,
                    userId: user.id,
                    action: 'EDIT',
                    oldValue: oldValue as Prisma.InputJsonValue,
                    newValue: value as Prisma.InputJsonValue,
                },
            });
        } else if (action === 'APPROVE') {
            updatedField = await prisma.extractionField.update({
                where: { id: fieldId },
                data: {
                    isApproved: true,
                    approvedBy: user.id,
                    approvedAt: new Date(),
                },
            });

            await prisma.reviewEvent.create({
                data: {
                    fieldId,
                    userId: user.id,
                    action: 'APPROVE',
                },
            });
        } else if (action === 'REJECT') {
            updatedField = await prisma.extractionField.update({
                where: { id: fieldId },
                data: {
                    isApproved: false,
                },
            });

            await prisma.reviewEvent.create({
                data: {
                    fieldId,
                    userId: user.id,
                    action: 'REJECT',
                },
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action or missing value' },
                { status: 400 }
            );
        }

        return NextResponse.json({ field: updatedField });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
