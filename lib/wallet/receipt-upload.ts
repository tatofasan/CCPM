import { generateUploadUrl } from '@/lib/storage/s3';

/**
 * Validates if a file type is allowed for deposit receipts
 * Allows images and PDF documents
 */
export function isValidReceiptType(fileType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  return allowedTypes.includes(fileType.toLowerCase());
}

/**
 * Validates receipt file size
 * Max size: 5MB for receipts
 */
export function isValidReceiptSize(fileSize: number): boolean {
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  return fileSize <= maxSizeBytes;
}

/**
 * Generates a pre-signed URL for uploading a deposit receipt
 * Receipts are stored in the 'receipts/deposits' folder
 *
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @param dropshipperId - Dropshipper ID for organizing receipts
 * @returns Pre-signed URL and the public URL to save in database
 */
export async function generateReceiptUploadUrl(
  fileName: string,
  fileType: string,
  dropshipperId: string
) {
  // Validate file type
  if (!isValidReceiptType(fileType)) {
    throw new Error(
      'Invalid file type. Allowed types: JPEG, PNG, WEBP, PDF'
    );
  }

  // Generate upload URL with dropshipper-specific folder
  const folder = `receipts/deposits/${dropshipperId}`;
  const result = await generateUploadUrl(fileName, fileType, folder, 3600); // 1 hour expiration

  return result;
}

/**
 * Extracts receipt metadata from file info
 * Useful for validation and tracking
 */
export interface ReceiptMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

/**
 * Validates receipt upload request
 * Checks file type and size before generating upload URL
 */
export function validateReceiptUpload(
  fileName: string,
  fileType: string,
  fileSize: number
): void {
  if (!fileName || fileName.trim().length === 0) {
    throw new Error('File name is required');
  }

  if (!fileType || fileType.trim().length === 0) {
    throw new Error('File type is required');
  }

  if (!isValidReceiptType(fileType)) {
    throw new Error(
      'Invalid file type. Allowed types: JPEG, PNG, WEBP, PDF'
    );
  }

  if (fileSize <= 0) {
    throw new Error('File size must be greater than 0');
  }

  if (!isValidReceiptSize(fileSize)) {
    throw new Error('File size exceeds maximum allowed size of 5MB');
  }
}