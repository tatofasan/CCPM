import { NextRequest, NextResponse } from 'next/server';
import { generateTemplate } from '@/lib/products/csv-generator';

/**
 * GET /api/admin/products/export/template
 * Downloads a CSV template with headers and example rows
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

    // Generate template CSV
    const csvContent = generateTemplate();

    // Return as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="product-import-template.csv"',
      },
    });
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSV template',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}