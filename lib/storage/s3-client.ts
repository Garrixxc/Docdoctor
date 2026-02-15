import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export interface PresignedPostUrl {
    url: string;
    fields: Record<string, string>;
    fileUrl: string;
}

/**
 * Generate presigned URL for direct upload to S3
 */
export async function generatePresignedUploadUrl(params: {
    filename: string;
    fileType: string;
    workspaceId: string;
    projectId: string;
}): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const { filename, fileType, workspaceId, projectId } = params;

    // Generate unique key
    const fileId = nanoid();
    const extension = filename.split('.').pop();
    const key = `workspaces/${workspaceId}/projects/${projectId}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
        uploadUrl,
        fileUrl,
        key,
    };
}

/**
 * Generate presigned URL for downloading from S3
 */
export async function generatePresignedDownloadUrl(
    key: string,
    expiresIn = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Upload file directly to S3 (for server-side uploads)
 */
export async function uploadToS3(params: {
    key: string;
    body: Buffer;
    contentType: string;
}): Promise<string> {
    const { key, body, contentType } = params;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export { s3Client };
