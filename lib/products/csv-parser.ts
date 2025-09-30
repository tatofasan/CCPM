import Papa from 'papaparse';
import { ProductVisibility } from '@prisma/client';

/**
 * Parsed product data from CSV
 */
export interface ParsedProduct {
  lineNumber: number; // Original line number in CSV (for error reporting)
  sku?: string;
  name: string;
  description?: string;
  costPrice: number;
  suggestedPrice: number;
  stock?: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  supplierCode: string;
  visibilityType?: ProductVisibility;
  visibilityTargetIds?: string[];
  imagesUrls?: string[];
}

/**
 * Parse error details
 */
export interface ParseError {
  lineNumber: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Result of CSV parsing
 */
export interface ParseResult {
  products: ParsedProduct[];
  errors: ParseError[];
  totalRows: number;
}

/**
 * Expected CSV headers (case-insensitive matching)
 */
const EXPECTED_HEADERS = [
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
];

/**
 * Normalizes header names for case-insensitive matching
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

/**
 * Creates a header mapping from CSV headers to expected headers
 */
function createHeaderMapping(
  csvHeaders: string[]
): Map<string, string> | null {
  const mapping = new Map<string, string>();
  const normalizedExpected = EXPECTED_HEADERS.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));

  for (const csvHeader of csvHeaders) {
    const normalized = normalizeHeader(csvHeader);
    const match = normalizedExpected.find((exp) => exp.normalized === normalized);
    if (match) {
      mapping.set(match.original, csvHeader);
    }
  }

  // Check if required headers are present
  const requiredHeaders = ['Name', 'Cost Price', 'Suggested Price', 'Supplier Code'];
  for (const required of requiredHeaders) {
    if (!mapping.has(required)) {
      return null;
    }
  }

  return mapping;
}

/**
 * Parses dimensions string in format "LxWxH" (e.g., "20x15x8")
 */
function parseDimensions(
  dimensionsStr: string
): { length: number; width: number; height: number; unit: string } | null {
  if (!dimensionsStr || dimensionsStr.trim() === '') {
    return null;
  }

  const parts = dimensionsStr.trim().split('x');
  if (parts.length !== 3) {
    return null;
  }

  const [length, width, height] = parts.map((p) => parseFloat(p.trim()));
  if (isNaN(length) || isNaN(width) || isNaN(height)) {
    return null;
  }

  return { length, width, height, unit: 'cm' };
}

/**
 * Parses comma-separated list of IDs/URLs
 */
function parseCommaSeparatedList(str: string): string[] {
  if (!str || str.trim() === '') {
    return [];
  }
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parses a CSV row into a product object
 */
function parseRow(
  row: any,
  lineNumber: number,
  headerMapping: Map<string, string>
): { product?: ParsedProduct; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const getField = (fieldName: string): string => {
    const csvHeader = headerMapping.get(fieldName);
    return csvHeader ? (row[csvHeader] || '').toString().trim() : '';
  };

  // Parse required fields
  const name = getField('Name');
  if (!name) {
    errors.push({
      lineNumber,
      field: 'Name',
      message: 'Name is required',
      value: name,
    });
  }

  const costPriceStr = getField('Cost Price');
  const costPrice = parseFloat(costPriceStr);
  if (!costPriceStr || isNaN(costPrice)) {
    errors.push({
      lineNumber,
      field: 'Cost Price',
      message: 'Cost Price must be a valid number',
      value: costPriceStr,
    });
  }

  const suggestedPriceStr = getField('Suggested Price');
  const suggestedPrice = parseFloat(suggestedPriceStr);
  if (!suggestedPriceStr || isNaN(suggestedPrice)) {
    errors.push({
      lineNumber,
      field: 'Suggested Price',
      message: 'Suggested Price must be a valid number',
      value: suggestedPriceStr,
    });
  }

  const supplierCode = getField('Supplier Code');
  if (!supplierCode) {
    errors.push({
      lineNumber,
      field: 'Supplier Code',
      message: 'Supplier Code is required',
      value: supplierCode,
    });
  }

  // Parse optional fields
  const sku = getField('SKU') || undefined;
  const description = getField('Description') || undefined;

  const stockStr = getField('Stock');
  const stock = stockStr ? parseInt(stockStr, 10) : 0;
  if (stockStr && isNaN(stock)) {
    errors.push({
      lineNumber,
      field: 'Stock',
      message: 'Stock must be a valid integer',
      value: stockStr,
    });
  }

  const lowStockThresholdStr = getField('Low Stock Threshold');
  const lowStockThreshold = lowStockThresholdStr
    ? parseInt(lowStockThresholdStr, 10)
    : 10;
  if (lowStockThresholdStr && isNaN(lowStockThreshold)) {
    errors.push({
      lineNumber,
      field: 'Low Stock Threshold',
      message: 'Low Stock Threshold must be a valid integer',
      value: lowStockThresholdStr,
    });
  }

  const weightStr = getField('Weight (kg)');
  const weight = weightStr ? parseFloat(weightStr) : undefined;
  if (weightStr && isNaN(weight!)) {
    errors.push({
      lineNumber,
      field: 'Weight (kg)',
      message: 'Weight must be a valid number',
      value: weightStr,
    });
  }

  const dimensionsStr = getField('Dimensions (LxWxH cm)');
  const dimensions = dimensionsStr ? parseDimensions(dimensionsStr) : undefined;
  if (dimensionsStr && !dimensions) {
    errors.push({
      lineNumber,
      field: 'Dimensions (LxWxH cm)',
      message: 'Dimensions must be in format LxWxH (e.g., 20x15x8)',
      value: dimensionsStr,
    });
  }

  const visibilityTypeStr = getField('Visibility Type');
  let visibilityType: ProductVisibility = ProductVisibility.ALL;
  if (visibilityTypeStr) {
    const upperVisibility = visibilityTypeStr.toUpperCase();
    if (
      upperVisibility === 'ALL' ||
      upperVisibility === 'GROUPS' ||
      upperVisibility === 'SPECIFIC'
    ) {
      visibilityType = upperVisibility as ProductVisibility;
    } else {
      errors.push({
        lineNumber,
        field: 'Visibility Type',
        message: 'Visibility Type must be ALL, GROUPS, or SPECIFIC',
        value: visibilityTypeStr,
      });
    }
  }

  const visibilityTargetIdsStr = getField('Visibility Target IDs');
  const visibilityTargetIds = visibilityTargetIdsStr
    ? parseCommaSeparatedList(visibilityTargetIdsStr)
    : undefined;

  const imageUrlsStr = getField('Image URLs');
  const imagesUrls = imageUrlsStr
    ? parseCommaSeparatedList(imageUrlsStr)
    : undefined;

  // If there are parsing errors, don't create the product object
  if (errors.length > 0) {
    return { errors };
  }

  const product: ParsedProduct = {
    lineNumber,
    sku,
    name,
    description,
    costPrice,
    suggestedPrice,
    stock,
    lowStockThreshold,
    weight,
    dimensions,
    supplierCode,
    visibilityType,
    visibilityTargetIds,
    imagesUrls,
  };

  return { product, errors };
}

/**
 * Parses a CSV file content into product objects
 * @param fileContent - CSV file content as string
 * @returns ParseResult with products and errors
 */
export function parseCSV(fileContent: string): ParseResult {
  const errors: ParseError[] = [];
  const products: ParsedProduct[] = [];

  // Parse CSV using PapaParse
  const parseResult = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors && parseResult.errors.length > 0) {
    for (const error of parseResult.errors) {
      errors.push({
        lineNumber: error.row ? error.row + 2 : 1, // +2 because row is 0-indexed and we have a header
        field: 'CSV',
        message: error.message,
      });
    }
  }

  const rows = parseResult.data;
  if (!rows || rows.length === 0) {
    return { products: [], errors, totalRows: 0 };
  }

  // Create header mapping
  const csvHeaders = parseResult.meta.fields || [];
  const headerMapping = createHeaderMapping(csvHeaders);

  if (!headerMapping) {
    errors.push({
      lineNumber: 1,
      field: 'Headers',
      message:
        'CSV is missing required headers: Name, Cost Price, Suggested Price, Supplier Code',
    });
    return { products: [], errors, totalRows: 0 };
  }

  // Parse each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2; // +2 because: 0-indexed + 1 header row + 1 for human-readable

    // Skip empty rows
    const isEmpty = Object.values(row).every(
      (val) => !val || val.toString().trim() === ''
    );
    if (isEmpty) {
      continue;
    }

    const { product, errors: rowErrors } = parseRow(row, lineNumber, headerMapping);

    if (product) {
      products.push(product);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    }
  }

  return {
    products,
    errors,
    totalRows: rows.length,
  };
}