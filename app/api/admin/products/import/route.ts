import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '@/lib/products/csv-parser';
import {
  validateBulkProducts,
  enrichProductsWithSupplierIds,
} from '@/lib/products/bulk-validator';
import { createProduct, updateProduct, getProductBySKU } from '@/lib/products/crud';
import { prisma } from '@/lib/prisma';

/**
 * Batch size for processing products
 * Process 100 products at a time to avoid transaction timeouts
 */
const BATCH_SIZE = 100;

/**
 * POST /api/admin/products/import
 * Imports products from CSV file
 *
 * Request Body:
 * - file: CSV file content as text (multipart/form-data or JSON with csvContent field)
 *
 * Response:
 * - success: boolean
 * - data: { created: number, updated: number, total: number }
 * - errors: Array of validation errors (if any)
 * - warnings: Array of warning messages (if any)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Parse the request body
    let csvContent: string;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            error: 'No file provided',
          },
          { status: 400 }
        );
      }

      csvContent = await file.text();
    } else if (contentType.includes('application/json')) {
      // Handle JSON with csvContent field
      const body = await request.json();
      csvContent = body.csvContent;

      if (!csvContent) {
        return NextResponse.json(
          {
            success: false,
            error: 'No csvContent provided in request body',
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported content type. Use multipart/form-data or application/json',
        },
        { status: 400 }
      );
    }

    // Step 1: Parse CSV
    console.log('Parsing CSV...');
    const parseResult = parseCSV(csvContent);

    if (parseResult.errors.length > 0) {
      // Return parsing errors immediately
      return NextResponse.json(
        {
          success: false,
          error: 'CSV parsing failed',
          errors: parseResult.errors,
          totalRows: parseResult.totalRows,
        },
        { status: 400 }
      );
    }

    if (parseResult.products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid products found in CSV',
          totalRows: parseResult.totalRows,
        },
        { status: 400 }
      );
    }

    console.log(`Parsed ${parseResult.products.length} products`);

    // Step 2: Validate all products
    console.log('Validating products...');
    const validationResult = await validateBulkProducts(parseResult.products);

    if (!validationResult.valid) {
      // Return validation errors without saving anything
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          totalRows: parseResult.totalRows,
        },
        { status: 400 }
      );
    }

    console.log('Validation passed');

    // Step 3: Enrich products with supplier IDs
    const enrichedProducts = await enrichProductsWithSupplierIds(
      parseResult.products
    );

    // Step 4: Process products in batches
    console.log('Processing products...');
    let createdCount = 0;
    let updatedCount = 0;
    const errors: Array<{ lineNumber: number; message: string }> = [];

    // Process in batches to avoid transaction timeouts
    for (let i = 0; i < enrichedProducts.length; i += BATCH_SIZE) {
      const batch = enrichedProducts.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(enrichedProducts.length / BATCH_SIZE)}...`
      );

      for (const product of batch) {
        try {
          // Check if product exists by SKU
          let existingProduct = null;
          if (product.sku) {
            try {
              existingProduct = await getProductBySKU(product.sku);
            } catch (error) {
              // Product doesn't exist, which is fine
              existingProduct = null;
            }
          }

          if (existingProduct) {
            // Update existing product
            await updateProduct(existingProduct.id, {
              name: product.name,
              description: product.description,
              costPrice: product.costPrice,
              suggestedPrice: product.suggestedPrice,
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              weight: product.weight,
              dimensions: product.dimensions,
              supplierId: product.supplierId,
              visibilityType: product.visibilityType,
              visibilityTargetIds: product.visibilityTargetIds,
              imagesUrls: product.imagesUrls,
            });
            updatedCount++;
          } else {
            // Create new product
            await createProduct({
              sku: product.sku,
              name: product.name,
              description: product.description,
              costPrice: product.costPrice,
              suggestedPrice: product.suggestedPrice,
              stock: product.stock ?? 0,
              lowStockThreshold: product.lowStockThreshold ?? 10,
              weight: product.weight,
              dimensions: product.dimensions,
              supplierId: product.supplierId,
              visibilityType: product.visibilityType,
              visibilityTargetIds: product.visibilityTargetIds,
              imagesUrls: product.imagesUrls,
            });
            createdCount++;
          }
        } catch (error) {
          console.error(`Error processing product at line ${product.lineNumber}:`, error);
          errors.push({
            lineNumber: product.lineNumber,
            message:
              error instanceof Error ? error.message : 'Unknown error during import',
          });
        }
      }
    }

    console.log(`Import complete: ${createdCount} created, ${updatedCount} updated`);

    // Return success with summary
    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdCount,
          updated: updatedCount,
          total: createdCount + updatedCount,
          failed: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: validationResult.warnings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}