import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getProductById } from '@/lib/products/crud';
import { canDropshipperViewProduct } from '@/lib/products/visibility';

/**
 * GET /api/products/:id
 * Gets a single product by ID
 * Applies visibility filtering for dropshippers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const productId = params.id;

    // Fetch product
    const product = await getProductById(productId);

    // Check visibility for dropshippers
    if (user.role === 'DROPSHIPPER') {
      const dropshipperId = user.dropshipperId;
      if (!dropshipperId) {
        return NextResponse.json(
          { error: 'Dropshipper profile not found' },
          { status: 400 }
        );
      }

      // Check if dropshipper can view this product
      const canView = canDropshipperViewProduct(product, dropshipperId);
      if (!canView) {
        return NextResponse.json(
          { error: 'Product not found or not accessible' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);

    // Handle not found error
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}