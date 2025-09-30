import { Prisma } from '@prisma/client';

export interface ProductSearchParams {
  query?: string;
  supplierId?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'stock' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Builds a Prisma where clause for product search
 */
export function buildProductSearchFilter(
  params: ProductSearchParams
): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [];

  // Text search (name, SKU, description)
  if (params.query) {
    filters.push({
      OR: [
        {
          name: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: params.query,
            mode: 'insensitive',
          },
        },
      ],
    });
  }

  // Filter by supplier
  if (params.supplierId) {
    filters.push({
      supplierId: params.supplierId,
    });
  }

  // Filter by stock status
  // Note: Prisma doesn't support comparing two columns in where clause
  // So for low_stock and in_stock, these will need to be filtered in memory
  // or we only filter by out_of_stock here
  if (params.stockStatus) {
    switch (params.stockStatus) {
      case 'out_of_stock':
        filters.push({ stock: 0 });
        break;
      case 'low_stock':
        // This needs to be filtered in memory after fetching
        // Filter: stock > 0 AND stock < lowStockThreshold
        filters.push({ stock: { gt: 0 } });
        break;
      case 'in_stock':
        // This needs to be filtered in memory after fetching
        // Filter: stock >= lowStockThreshold
        filters.push({ stock: { gt: 0 } });
        break;
    }
  }

  // Filter by price range
  if (params.minPrice !== undefined) {
    filters.push({
      suggestedPrice: {
        gte: params.minPrice,
      },
    });
  }

  if (params.maxPrice !== undefined) {
    filters.push({
      suggestedPrice: {
        lte: params.maxPrice,
      },
    });
  }

  // Combine all filters with AND
  return filters.length > 0 ? { AND: filters } : {};
}

/**
 * Builds a Prisma orderBy clause for product sorting
 */
export function buildProductSortOrder(
  sortBy: ProductSearchParams['sortBy'] = 'created_at',
  sortOrder: ProductSearchParams['sortOrder'] = 'desc'
): Prisma.ProductOrderByWithRelationInput {
  switch (sortBy) {
    case 'name':
      return { name: sortOrder };
    case 'price':
      return { suggestedPrice: sortOrder };
    case 'stock':
      return { stock: sortOrder };
    case 'created_at':
    default:
      return { createdAt: sortOrder };
  }
}

/**
 * Helper to parse and validate search parameters from query strings
 */
export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ProductSearchParams {
  const {
    query,
    supplierId,
    stockStatus,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = searchParams;

  return {
    query: typeof query === 'string' ? query : undefined,
    supplierId: typeof supplierId === 'string' ? supplierId : undefined,
    stockStatus:
      stockStatus === 'in_stock' ||
      stockStatus === 'low_stock' ||
      stockStatus === 'out_of_stock'
        ? stockStatus
        : undefined,
    minPrice:
      typeof minPrice === 'string' && !isNaN(parseFloat(minPrice))
        ? parseFloat(minPrice)
        : undefined,
    maxPrice:
      typeof maxPrice === 'string' && !isNaN(parseFloat(maxPrice))
        ? parseFloat(maxPrice)
        : undefined,
    sortBy:
      sortBy === 'name' ||
      sortBy === 'price' ||
      sortBy === 'stock' ||
      sortBy === 'created_at'
        ? sortBy
        : 'created_at',
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc',
  };
}