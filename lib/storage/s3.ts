import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';
const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresIn: number;
}

/**
 * Generates a pre-signed URL for uploading a file to S3
 *
 * @param fileName - The original file name
 * @param fileType - The MIME type of the file
 * @param folder - The folder path in the bucket (e.g., 'products', 'receipts')
 * @param expiresIn - Time in seconds until the URL expires (default: 3600)
 * @returns Pre-signed URL and the S3 key
 */
export async function generateUploadUrl(
  fileName: string,
  fileType: string,
  folder: string = 'products',
  expiresIn: number = DEFAULT_EXPIRATION
): Promise<PresignedUrlResponse> {
  // Generate unique key with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}-${sanitizedFileName}`;

  // Create command for uploading
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    // Add metadata for tracking
    Metadata: {
      'upload-date': new Date().toISOString(),
      'original-name': fileName,
    },
  });

  // Generate pre-signed URL
  const url = await getSignedUrl(s3Client, command, { expiresIn });

  // Construct the public URL (will be accessible after upload)
  const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    url, // Pre-signed URL for upload
    key: publicUrl, // Public URL to save in database
    expiresIn,
  };
}

/**
 * Generates multiple pre-signed URLs for batch uploads
 */
export async function generateMultipleUploadUrls(
  files: Array<{ fileName: string; fileType: string }>,
  folder: string = 'products',
  expiresIn: number = DEFAULT_EXPIRATION
): Promise<PresignedUrlResponse[]> {
  const promises = files.map((file) =>
    generateUploadUrl(file.fileName, file.fileType, folder, expiresIn)
  );
  return Promise.all(promises);
}

/**
 * Deletes a file from S3
 *
 * @param key - The S3 key (full URL or just the key)
 */
export async function deleteFile(key: string): Promise<void> {
  // Extract key from full URL if necessary
  let s3Key = key;
  if (key.startsWith('http')) {
    const url = new URL(key);
    s3Key = url.pathname.substring(1); // Remove leading slash
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}

/**
 * Deletes multiple files from S3
 */
export async function deleteMultipleFiles(keys: string[]): Promise<void> {
  const promises = keys.map((key) => deleteFile(key));
  await Promise.all(promises);
}

/**
 * Validates if a file type is allowed for product images
 */
export function isValidImageType(fileType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  return allowedTypes.includes(fileType.toLowerCase());
}

/**
 * Validates file size (in bytes)
 */
export function isValidFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Extracts the S3 key from a public URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch {
    return null;
  }
}