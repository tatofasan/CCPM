import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { listProducts } from '@/lib/products/crud';
import { getVisibilityFilter } from '@/lib/products/visibility';
import {
  buildProductSearchFilter,
  buildProductSortOrder,
  parseSearchParams,
} from '@/lib/products/search';
import { Prisma } from '@prisma/client';

/**
 * GET /api/products
 * Lists products with visibility filtering based on the authenticated user
 * Supports search, filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      100
    ); // Max 100

    // Parse search parameters
    const searchFilters = parseSearchParams(Object.fromEntries(searchParams));

    // Build search filter
    const searchWhere = buildProductSearchFilter(searchFilters);

    // Build visibility filter
    // If user is ADMIN, they can see all products
    // If user is DROPSHIPPER, filter by visibility
    let visibilityWhere: Prisma.ProductWhereInput = {};
    if (user.role === 'DROPSHIPPER') {
      // Get dropshipper profile to use the ID
      const dropshipperId = user.dropshipperId;
      if (!dropshipperId) {
        return NextResponse.json(
          { error: 'Dropshipper profile not found' },
          { status: 400 }
        );
      }
      visibilityWhere = getVisibilityFilter(dropshipperId);
    }

    // Combine filters
    const where: Prisma.ProductWhereInput = {
      AND: [searchWhere, visibilityWhere],
    };

    // Build sort order
    const orderBy = buildProductSortOrder(
      searchFilters.sortBy,
      searchFilters.sortOrder
    );

    // Fetch products with pagination
    const result = await listProducts({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy,
      includeSupplier: true,
    });

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}