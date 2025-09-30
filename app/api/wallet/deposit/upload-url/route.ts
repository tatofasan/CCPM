import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import {
  generateReceiptUploadUrl,
  validateReceiptUpload,
} from '@/lib/wallet/receipt-upload';
import { z } from 'zod';

/**
 * POST /api/wallet/deposit/upload-url
 * Generate a pre-signed URL for uploading a deposit receipt
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Get dropshipper profile
    const dropshipperProfile = await prisma.dropshipperProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!dropshipperProfile) {
      return NextResponse.json(
        { error: 'Dropshipper profile not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const schema = z.object({
      fileName: z.string().min(1, 'File name is required'),
      fileType: z.string().min(1, 'File type is required'),
      fileSize: z.number().positive('File size must be greater than 0'),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize } = validation.data;

    // Validate receipt upload
    try {
      validateReceiptUpload(fileName, fileType, fileSize);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Invalid file',
        },
        { status: 400 }
      );
    }

    // Generate upload URL
    const uploadUrl = await generateReceiptUploadUrl(
      fileName,
      fileType,
      dropshipperProfile.id
    );

    return NextResponse.json({
      uploadUrl: uploadUrl.url,
      receiptUrl: uploadUrl.key,
      expiresIn: uploadUrl.expiresIn,
    });
  } catch (error) {
    console.error('Generate receipt upload URL error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}