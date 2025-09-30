import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  updateProduct,
  deleteProduct,
  UpdateProductInput,
} from '@/lib/products/crud';
import { ProductVisibility } from '@prisma/client';

/**
 * PATCH /api/admin/products/:id
 * Updates an existing product
 * Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const authResult = await requireRole(request, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const productId = params.id;

    // Parse request body
    const body = await request.json();

    // Validate price values if provided
    if (body.costPrice !== undefined && body.costPrice < 0) {
      return NextResponse.json(
        { error: 'Cost price cannot be negative' },
        { status: 400 }
      );
    }

    if (body.suggestedPrice !== undefined && body.suggestedPrice < 0) {
      return NextResponse.json(
        { error: 'Suggested price cannot be negative' },
        { status: 400 }
      );
    }

    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { error: 'Stock cannot be negative' },
        { status: 400 }
      );
    }

    // Validate visibility type if provided
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

    // Build update input
    const input: UpdateProductInput = {};

    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.costPrice !== undefined)
      input.costPrice = parseFloat(body.costPrice);
    if (body.suggestedPrice !== undefined)
      input.suggestedPrice = parseFloat(body.suggestedPrice);
    if (body.stock !== undefined) input.stock = parseInt(body.stock, 10);
    if (body.lowStockThreshold !== undefined)
      input.lowStockThreshold = parseInt(body.lowStockThreshold, 10);
    if (body.weight !== undefined) input.weight = parseFloat(body.weight);
    if (body.dimensions !== undefined) input.dimensions = body.dimensions;
    if (body.supplierId !== undefined) input.supplierId = body.supplierId;
    if (body.visibilityType !== undefined)
      input.visibilityType = body.visibilityType;
    if (body.visibilityTargetIds !== undefined)
      input.visibilityTargetIds = body.visibilityTargetIds;
    if (body.imagesUrls !== undefined) input.imagesUrls = body.imagesUrls;

    // Update product
    const product = await updateProduct(productId, input);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('visibilityTargetIds')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to update product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/:id
 * Deletes a product
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const authResult = await requireRole(request, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const productId = params.id;

    // Delete product
    await deleteProduct(productId);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('Cannot delete product')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to delete product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}