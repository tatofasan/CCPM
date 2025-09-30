import { prisma } from '@/lib/prisma';

/**
 * Generates a unique SKU for a product
 * Format: ECOMDROP##-# (e.g., ECOMDROP01-1, ECOMDROP01-2)
 *
 * The sequential number is global across all products
 */
export async function generateSKU(): Promise<string> {
  // Get the count of existing products to determine the next sequential number
  const productCount = await prisma.product.count();
  const nextSequentialNumber = productCount + 1;

  // Format: ECOMDROP + two-digit number + dash + sequential
  // Using two-digit day number (01-99) for the first part
  const dayNumber = String(nextSequentialNumber).padStart(2, '0').slice(-2);
  const sku = `ECOMDROP${dayNumber}-${nextSequentialNumber}`;

  // Verify uniqueness (in case of race conditions)
  const existing = await prisma.product.findUnique({
    where: { sku },
  });

  if (existing) {
    // If SKU already exists, try with incremented number
    const incrementedNumber = nextSequentialNumber + 1;
    const dayNumberIncremented = String(incrementedNumber).padStart(2, '0').slice(-2);
    return `ECOMDROP${dayNumberIncremented}-${incrementedNumber}`;
  }

  return sku;
}

/**
 * Validates if a SKU follows the expected format
 */
export function isValidSKUFormat(sku: string): boolean {
  const skuRegex = /^ECOMDROP\d{2}-\d+$/;
  return skuRegex.test(sku);
}

/**
 * Checks if a SKU is unique in the database
 */
export async function isSKUUnique(sku: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { sku },
  });
  return !existing;
}