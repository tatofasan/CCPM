import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { createProduct, CreateProductInput } from '@/lib/products/crud';
import { ProductVisibility } from '@prisma/client';

/**
 * POST /api/admin/products
 * Creates a new product
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

    // Validate required fields
    const requiredFields = ['name', 'costPrice', 'suggestedPrice', 'supplierId'];
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate price values
    if (body.costPrice < 0 || body.suggestedPrice < 0) {
      return NextResponse.json(
        { error: 'Prices cannot be negative' },
        { status: 400 }
      );
    }

    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { error: 'Stock cannot be negative' },
        { status: 400 }
      );
    }

    // Validate visibility type
    if (
      body.visibilityType &&
      !Object.values(ProductVisibility).includes(body.visibilityType)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid visibility type',
          allowed: Object.values(ProductVisibility),
        },
        { status: 400 }
      );
    }

    // Build create input
    const input: CreateProductInput = {
      name: body.name,
      description: body.description,
      costPrice: parseFloat(body.costPrice),
      suggestedPrice: parseFloat(body.suggestedPrice),
      stock: body.stock !== undefined ? parseInt(body.stock, 10) : undefined,
      lowStockThreshold:
        body.lowStockThreshold !== undefined
          ? parseInt(body.lowStockThreshold, 10)
          : undefined,
      weight: body.weight !== undefined ? parseFloat(body.weight) : undefined,
      dimensions: body.dimensions,
      supplierId: body.supplierId,
      visibilityType: body.visibilityType || ProductVisibility.ALL,
      visibilityTargetIds: body.visibilityTargetIds,
      imagesUrls: body.imagesUrls || [],
      sku: body.sku, // Optional: will be auto-generated if not provided
    };

    // Create product
    const product = await createProduct(input);

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('visibilityTargetIds')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}