import { prisma } from '@/lib/prisma';
import { ProductVisibility } from '@prisma/client';
import { ParsedProduct } from './csv-parser';
import { isValidSKUFormat } from './sku-generator';

/**
 * Validation error details
 */
export interface ValidationError {
  lineNumber: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * Result of bulk validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

/**
 * Validates a single product's business rules
 */
function validateProductRules(
  product: ParsedProduct,
  supplierMap: Map<string, string>,
  skuSet: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate name length
  if (product.name.length > 255) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Name',
      message: 'Name must not exceed 255 characters',
      value: product.name,
    });
  }

  // Validate prices are positive
  if (product.costPrice <= 0) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Cost Price',
      message: 'Cost Price must be greater than 0',
      value: product.costPrice,
    });
  }

  if (product.suggestedPrice <= 0) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Suggested Price',
      message: 'Suggested Price must be greater than 0',
      value: product.suggestedPrice,
    });
  }

  // Validate suggested price is higher than cost price
  if (product.suggestedPrice < product.costPrice) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Suggested Price',
      message: 'Suggested Price should be greater than or equal to Cost Price',
      value: `Cost: ${product.costPrice}, Suggested: ${product.suggestedPrice}`,
    });
  }

  // Validate stock is non-negative
  if (product.stock !== undefined && product.stock < 0) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Stock',
      message: 'Stock cannot be negative',
      value: product.stock,
    });
  }

  // Validate low stock threshold is non-negative
  if (
    product.lowStockThreshold !== undefined &&
    product.lowStockThreshold < 0
  ) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Low Stock Threshold',
      message: 'Low Stock Threshold cannot be negative',
      value: product.lowStockThreshold,
    });
  }

  // Validate weight is positive if provided
  if (product.weight !== undefined && product.weight <= 0) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Weight (kg)',
      message: 'Weight must be greater than 0',
      value: product.weight,
    });
  }

  // Validate dimensions are positive if provided
  if (product.dimensions) {
    if (
      product.dimensions.length <= 0 ||
      product.dimensions.width <= 0 ||
      product.dimensions.height <= 0
    ) {
      errors.push({
        lineNumber: product.lineNumber,
        field: 'Dimensions (LxWxH cm)',
        message: 'All dimensions must be greater than 0',
        value: `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}`,
      });
    }
  }

  // Validate SKU format if provided
  if (product.sku) {
    if (!isValidSKUFormat(product.sku)) {
      errors.push({
        lineNumber: product.lineNumber,
        field: 'SKU',
        message: 'SKU must be in format ECOMDROP##-#',
        value: product.sku,
      });
    }

    // Check SKU uniqueness within batch
    if (skuSet.has(product.sku)) {
      errors.push({
        lineNumber: product.lineNumber,
        field: 'SKU',
        message: 'Duplicate SKU found in CSV',
        value: product.sku,
      });
    } else {
      skuSet.add(product.sku);
    }
  }

  // Validate supplier exists
  if (!supplierMap.has(product.supplierCode)) {
    errors.push({
      lineNumber: product.lineNumber,
      field: 'Supplier Code',
      message: `Supplier with code "${product.supplierCode}" not found`,
      value: product.supplierCode,
    });
  }

  // Validate visibility settings
  if (
    product.visibilityType === ProductVisibility.GROUPS ||
    product.visibilityType === ProductVisibility.SPECIFIC
  ) {
    if (
      !product.visibilityTargetIds ||
      product.visibilityTargetIds.length === 0
    ) {
      errors.push({
        lineNumber: product.lineNumber,
        field: 'Visibility Target IDs',
        message: `Visibility Target IDs are required when Visibility Type is ${product.visibilityType}`,
        value: product.visibilityType,
      });
    }
  }

  // Validate image URLs format (basic check)
  if (product.imagesUrls && product.imagesUrls.length > 0) {
    for (const url of product.imagesUrls) {
      try {
        new URL(url);
      } catch (e) {
        errors.push({
          lineNumber: product.lineNumber,
          field: 'Image URLs',
          message: `Invalid URL format: ${url}`,
          value: url,
        });
      }
    }
  }

  return errors;
}

/**
 * Validates a batch of products for import
 * Checks:
 * - Required fields are present
 * - Numeric fields are in valid ranges
 * - SKU format is correct
 * - SKU is unique within batch and against database
 * - Supplier exists
 * - Visibility settings are valid
 *
 * @param products - Array of parsed products to validate
 * @returns ValidationResult with errors
 */
export async function validateBulkProducts(
  products: ParsedProduct[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (products.length === 0) {
    return {
      valid: false,
      errors: [
        {
          lineNumber: 0,
          field: 'CSV',
          message: 'No valid products found in CSV',
        },
      ],
    };
  }

  // Check batch size limit
  if (products.length > 1000) {
    return {
      valid: false,
      errors: [
        {
          lineNumber: 0,
          field: 'CSV',
          message: 'CSV contains more than 1000 products. Maximum allowed is 1000 products per import.',
          value: products.length,
        },
      ],
    };
  }

  // Fetch all suppliers and create a map of supplier code to ID
  const suppliers = await prisma.supplier.findMany({
    select: {
      id: true,
      code: true,
      status: true,
    },
  });

  const supplierMap = new Map<string, string>();
  for (const supplier of suppliers) {
    supplierMap.set(supplier.code, supplier.id);

    // Warn about inactive suppliers
    if (supplier.status !== 'ACTIVE') {
      const productsWithInactiveSupplier = products.filter(
        (p) => p.supplierCode === supplier.code
      );
      if (productsWithInactiveSupplier.length > 0) {
        warnings.push(
          `Supplier "${supplier.code}" is ${supplier.status}. Products using this supplier may not be available.`
        );
      }
    }
  }

  // Fetch existing SKUs to check for duplicates
  const skusInCsv = products.filter((p) => p.sku).map((p) => p.sku!);
  const existingProducts = await prisma.product.findMany({
    where: {
      sku: { in: skusInCsv },
    },
    select: {
      id: true,
      sku: true,
    },
  });

  const existingSkuMap = new Map<string, string>();
  for (const product of existingProducts) {
    existingSkuMap.set(product.sku, product.id);
  }

  // Track SKUs within the batch for duplicate detection
  const skuSet = new Set<string>();

  // Validate each product
  for (const product of products) {
    const productErrors = validateProductRules(
      product,
      supplierMap,
      skuSet
    );
    errors.push(...productErrors);

    // Check if SKU already exists in database
    if (product.sku && existingSkuMap.has(product.sku)) {
      // Note: This is not an error - we will update the existing product
      // We just track it for reporting purposes
      warnings.push(
        `Line ${product.lineNumber}: Product with SKU "${product.sku}" already exists and will be updated.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Enriches parsed products with supplier IDs
 * This prepares the products for database insertion
 *
 * @param products - Array of parsed products
 * @returns Array of products with supplier IDs added
 */
export async function enrichProductsWithSupplierIds(
  products: ParsedProduct[]
): Promise<
  Array<
    Omit<ParsedProduct, 'supplierCode'> & { supplierId: string }
  >
> {
  // Fetch all suppliers
  const supplierCodes = [...new Set(products.map((p) => p.supplierCode))];
  const suppliers = await prisma.supplier.findMany({
    where: {
      code: { in: supplierCodes },
    },
    select: {
      id: true,
      code: true,
    },
  });

  const supplierMap = new Map<string, string>();
  for (const supplier of suppliers) {
    supplierMap.set(supplier.code, supplier.id);
  }

  // Enrich products with supplier IDs
  return products.map((product) => {
    const { supplierCode, ...rest } = product;
    const supplierId = supplierMap.get(supplierCode);

    if (!supplierId) {
      throw new Error(
        `Supplier with code "${supplierCode}" not found (line ${product.lineNumber})`
      );
    }

    return {
      ...rest,
      supplierId,
    };
  });
}