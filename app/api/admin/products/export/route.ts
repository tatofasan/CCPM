import { NextRequest, NextResponse } from 'next/server';
import { exportProducts } from '@/lib/products/csv-generator';

/**
 * GET /api/admin/products/export
 * Exports products to CSV format
 *
 * Query Parameters:
 * - productIds: Optional comma-separated list of product IDs to export
 * - skus: Optional comma-separated list of SKUs to export
 *
 * If no parameters provided, exports all products
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check for admin users
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);

    // Get product IDs if provided
    const productIdsParam = searchParams.get('productIds');
    const productIds = productIdsParam
      ? productIdsParam.split(',').map((id) => id.trim())
      : undefined;

    // Generate CSV
    const csvContent = await exportProducts(productIds);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `products-export-${timestamp}.csv`;

    // Return as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}