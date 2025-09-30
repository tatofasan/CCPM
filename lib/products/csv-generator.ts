import Papa from 'papaparse';
import { prisma } from '@/lib/prisma';
import { ProductVisibility } from '@prisma/client';

/**
 * CSV column headers for product import/export
 */
export const CSV_HEADERS = [
  'SKU',
  'Name',
  'Description',
  'Cost Price',
  'Suggested Price',
  'Stock',
  'Low Stock Threshold',
  'Weight (kg)',
  'Dimensions (LxWxH cm)',
  'Supplier Code',
  'Visibility Type',
  'Visibility Target IDs',
  'Image URLs',
] as const;

/**
 * Example data for CSV template
 */
const EXAMPLE_ROWS = [
  {
    SKU: 'ECOMDROP01-1',
    Name: 'Wireless Headphones',
    Description: 'Premium quality wireless headphones with noise cancellation',
    'Cost Price': '50.00',
    'Suggested Price': '120.00',
    Stock: '100',
    'Low Stock Threshold': '10',
    'Weight (kg)': '0.5',
    'Dimensions (LxWxH cm)': '20x15x8',
    'Supplier Code': 'SUP001',
    'Visibility Type': 'ALL',
    'Visibility Target IDs': '',
    'Image URLs': 'https://example.com/img1.jpg',
  },
  {
    SKU: 'ECOMDROP01-2',
    Name: 'USB Cable',
    Description: 'USB-C to USB-A cable 2 meters',
    'Cost Price': '5.00',
    'Suggested Price': '15.00',
    Stock: '500',
    'Low Stock Threshold': '50',
    'Weight (kg)': '0.1',
    'Dimensions (LxWxH cm)': '15x5x2',
    'Supplier Code': 'SUP001',
    'Visibility Type': 'SPECIFIC',
    'Visibility Target IDs': 'dropshipper1,dropshipper2',
    'Image URLs': 'https://example.com/img2.jpg,https://example.com/img2-alt.jpg',
  },
  {
    SKU: '',
    Name: 'Smartphone Case',
    Description: 'Protective case for smartphones',
    'Cost Price': '8.50',
    'Suggested Price': '25.00',
    Stock: '200',
    'Low Stock Threshold': '20',
    'Weight (kg)': '0.15',
    'Dimensions (LxWxH cm)': '18x10x2',
    'Supplier Code': 'SUP002',
    'Visibility Type': 'GROUPS',
    'Visibility Target IDs': 'group_premium,group_vip',
    'Image URLs': '',
  },
];

/**
 * Generates a CSV template with headers and example rows
 * @returns CSV string
 */
export function generateTemplate(): string {
  const csv = Papa.unparse({
    fields: [...CSV_HEADERS],
    data: EXAMPLE_ROWS,
  });

  return csv;
}

/**
 * Converts a product to CSV row format
 */
function productToCSVRow(product: any): Record<string, string> {
  // Parse dimensions if present
  let dimensionsStr = '';
  if (product.dimensions) {
    const dim = product.dimensions as any;
    if (dim.length && dim.width && dim.height) {
      dimensionsStr = `${dim.length}x${dim.width}x${dim.height}`;
    }
  }

  // Parse visibility target IDs
  let targetIdsStr = '';
  if (
    product.visibilityType !== ProductVisibility.ALL &&
    product.visibilityTargetIds
  ) {
    const targetIds = product.visibilityTargetIds as string[];
    targetIdsStr = Array.isArray(targetIds) ? targetIds.join(',') : '';
  }

  // Parse image URLs
  const imageUrlsStr = Array.isArray(product.imagesUrls)
    ? product.imagesUrls.join(',')
    : '';

  return {
    SKU: product.sku || '',
    Name: product.name || '',
    Description: product.description || '',
    'Cost Price': product.costPrice ? product.costPrice.toString() : '0',
    'Suggested Price': product.suggestedPrice
      ? product.suggestedPrice.toString()
      : '0',
    Stock: product.stock !== undefined ? product.stock.toString() : '0',
    'Low Stock Threshold': product.lowStockThreshold
      ? product.lowStockThreshold.toString()
      : '10',
    'Weight (kg)': product.weight ? product.weight.toString() : '',
    'Dimensions (LxWxH cm)': dimensionsStr,
    'Supplier Code': product.supplier?.code || '',
    'Visibility Type': product.visibilityType || 'ALL',
    'Visibility Target IDs': targetIdsStr,
    'Image URLs': imageUrlsStr,
  };
}

/**
 * Exports products to CSV format
 * @param productIds - Optional array of product IDs to export. If not provided, exports all products
 * @returns CSV string
 */
export async function exportProducts(productIds?: string[]): Promise<string> {
  // Build where clause
  const where = productIds ? { id: { in: productIds } } : {};

  // Fetch products with supplier information
  const products = await prisma.product.findMany({
    where,
    include: {
      supplier: {
        select: {
          code: true,
        },
      },
    },
    orderBy: {
      sku: 'asc',
    },
  });

  // Convert products to CSV rows
  const rows = products.map(productToCSVRow);

  // Generate CSV
  const csv = Papa.unparse({
    fields: [...CSV_HEADERS],
    data: rows,
  });

  return csv;
}

/**
 * Exports specific products by SKUs
 * @param skus - Array of SKUs to export
 * @returns CSV string
 */
export async function exportProductsBySKU(skus: string[]): Promise<string> {
  const products = await prisma.product.findMany({
    where: {
      sku: { in: skus },
    },
    include: {
      supplier: {
        select: {
          code: true,
        },
      },
    },
    orderBy: {
      sku: 'asc',
    },
  });

  const rows = products.map(productToCSVRow);

  const csv = Papa.unparse({
    fields: [...CSV_HEADERS],
    data: rows,
  });

  return csv;
}