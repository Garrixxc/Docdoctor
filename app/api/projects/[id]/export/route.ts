import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { prisma } from '@/lib/db';
import { uploadToS3 } from '@/lib/storage/s3-client';
import { nanoid } from 'nanoid';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: projectId } = await params;
    try {
        const user = await requireAuth();
        const body = await request.json();
        const { runId, format = 'CSV' } = body;

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

        // Get records from the run (all records, not just approved)
        const records = await prisma.extractionRecord.findMany({
            where: {
                runId: runId || undefined,
                run: { projectId },
            },
            include: {
                fields: true, // Include all fields
                document: true,
            },
        });

        if (records.length === 0) {
            return NextResponse.json(
                { error: 'No records found for this run' },
                { status: 400 }
            );
        }

        // Generate CSV
        const headers = Array.from(
            new Set(records.flatMap((r) => r.fields.map((f) => f.fieldName)))
        );

        const csvLines = [
            ['document_name', ...headers].join(','),
            ...records.map((record) => {
                const row: any[] = [record.document.name];
                for (const header of headers) {
                    const field = record.fields.find((f) => f.fieldName === header);
                    const value = field?.extractedValue || '';
                    row.push(JSON.stringify(value).replace(/^"|"$/g, ''));
                }
                return row.join(',');
            }),
        ];

        const csvContent = csvLines.join('\n');

        // Upload to S3
        const key = `workspaces/${project.workspaceId}/exports/${nanoid()}.csv`;
        const fileUrl = await uploadToS3({
            key,
            body: Buffer.from(csvContent, 'utf-8'),
            contentType: 'text/csv',
        });

        // Create export record
        const exportRecord = await prisma.export.create({
            data: {
                projectId,
                runId: runId || null,
                exportedBy: user.id,
                format: 'CSV',
                status: 'COMPLETED',
                fileUrl,
                recordCount: records.length,
            },
        });

        return NextResponse.json({ export: exportRecord, downloadUrl: fileUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
