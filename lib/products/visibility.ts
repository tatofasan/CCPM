import { Product, ProductVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Filters products based on visibility rules for a specific dropshipper
 *
 * Visibility rules:
 * - ALL: Product is visible to all dropshippers
 * - GROUPS: Product is visible to specific dropshipper groups (stored in visibilityTargetIds)
 * - SPECIFIC: Product is visible to specific dropshippers (stored in visibilityTargetIds)
 *
 * @param dropshipperId - The ID of the dropshipper viewing the products
 * @returns Prisma where clause for filtering products
 */
export function getVisibilityFilter(dropshipperId: string) {
  return {
    OR: [
      // Products visible to all
      { visibilityType: ProductVisibility.ALL },
      // Products visible to specific groups or dropshippers
      {
        AND: [
          {
            visibilityType: {
              in: [ProductVisibility.GROUPS, ProductVisibility.SPECIFIC],
            },
          },
          {
            visibilityTargetIds: {
              path: '$',
              array_contains: dropshipperId,
            },
          },
        ],
      },
    ],
  };
}

/**
 * Filters an array of products based on visibility for a dropshipper
 * Use this for in-memory filtering after fetching products
 */
export function filterProductsByVisibility(
  products: Product[],
  dropshipperId: string
): Product[] {
  return products.filter((product) => {
    // All products are visible to everyone
    if (product.visibilityType === ProductVisibility.ALL) {
      return true;
    }

    // Check if dropshipper is in the target IDs
    if (
      product.visibilityType === ProductVisibility.GROUPS ||
      product.visibilityType === ProductVisibility.SPECIFIC
    ) {
      const targetIds = product.visibilityTargetIds as string[] | null;
      return targetIds?.includes(dropshipperId) ?? false;
    }

    return false;
  });
}

/**
 * Checks if a specific dropshipper can view a product
 */
export function canDropshipperViewProduct(
  product: Product,
  dropshipperId: string
): boolean {
  if (product.visibilityType === ProductVisibility.ALL) {
    return true;
  }

  if (
    product.visibilityType === ProductVisibility.GROUPS ||
    product.visibilityType === ProductVisibility.SPECIFIC
  ) {
    const targetIds = product.visibilityTargetIds as string[] | null;
    return targetIds?.includes(dropshipperId) ?? false;
  }

  return false;
}

/**
 * Updates the visibility settings for a product
 */
export async function updateProductVisibility(
  productId: string,
  visibilityType: ProductVisibility,
  targetIds?: string[]
) {
  // Validate that targetIds is provided for GROUPS and SPECIFIC
  if (
    (visibilityType === ProductVisibility.GROUPS ||
      visibilityType === ProductVisibility.SPECIFIC) &&
    (!targetIds || targetIds.length === 0)
  ) {
    throw new Error(
      `Target IDs are required for visibility type ${visibilityType}`
    );
  }

  // For ALL visibility, clear targetIds
  const visibilityTargetIds =
    visibilityType === ProductVisibility.ALL ? null : (targetIds || null);

  return prisma.product.update({
    where: { id: productId },
    data: {
      visibilityType,
      visibilityTargetIds: visibilityTargetIds as any,
    },
  });
}