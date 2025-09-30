import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  generateUploadUrl,
  generateMultipleUploadUrls,
  isValidImageType,
  isValidFileSize,
} from '@/lib/storage/s3';

interface UploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * POST /api/admin/products/upload-url
 * Generates pre-signed S3 URLs for image upload
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const authResult = await requireRole(request, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse request body
    const body = await request.json();

    // Handle single file upload
    if (body.fileName && body.fileType) {
      const { fileName, fileType, fileSize } = body as UploadUrlRequest;

      // Validate file type
      if (!isValidImageType(fileType)) {
        return NextResponse.json(
          {
            error: 'Invalid file type',
            allowed: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          },
          { status: 400 }
        );
      }

      // Validate file size (10MB max)
      if (fileSize && !isValidFileSize(fileSize, 10)) {
        return NextResponse.json(
          { error: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }

      // Generate pre-signed URL
      const result = await generateUploadUrl(fileName, fileType, 'products');

      return NextResponse.json({
        success: true,
        data: {
          uploadUrl: result.url,
          publicUrl: result.key,
          expiresIn: result.expiresIn,
        },
      });
    }

    // Handle multiple files upload
    if (body.files && Array.isArray(body.files)) {
      const files = body.files as UploadUrlRequest[];

      // Validate all files
      for (const file of files) {
        if (!isValidImageType(file.fileType)) {
          return NextResponse.json(
            {
              error: `Invalid file type for ${file.fileName}`,
              allowed: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
            },
            { status: 400 }
          );
        }

        if (file.fileSize && !isValidFileSize(file.fileSize, 10)) {
          return NextResponse.json(
            { error: `File ${file.fileName} exceeds 10MB limit` },
            { status: 400 }
          );
        }
      }

      // Generate pre-signed URLs for all files
      const results = await generateMultipleUploadUrls(
        files.map((f) => ({ fileName: f.fileName, fileType: f.fileType })),
        'products'
      );

      return NextResponse.json({
        success: true,
        data: results.map((result) => ({
          uploadUrl: result.url,
          publicUrl: result.key,
          expiresIn: result.expiresIn,
        })),
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide fileName and fileType, or files array' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}