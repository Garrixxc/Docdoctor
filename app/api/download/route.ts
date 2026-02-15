import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/get-session';
import { generatePresignedDownloadUrl } from '@/lib/storage/s3-client';

export async function POST(request: NextRequest) {
    try {
        await requireAuth();
        const body = await request.json();
        const { fileUrl } = body;

        if (!fileUrl) {
            return NextResponse.json(
                { error: 'fileUrl is required' },
                { status: 400 }
            );
        }

        // Extract S3 key from fileUrl
        const url = new URL(fileUrl);
        const key = url.pathname.substring(1); // Remove leading slash

        // Generate presigned URL
        const presignedUrl = await generatePresignedDownloadUrl(key, 300); // 5 minutes

        return NextResponse.json({ presignedUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
