import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { UserRole, SupplierStatus } from '@prisma/client';
import { createSupplier, listSuppliers } from '@/lib/suppliers/crud';

/**
 * GET /api/admin/suppliers
 * List all suppliers with optional filtering
 */
export async function GET(request: NextRequest) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as SupplierStatus | null;
    const search = searchParams.get('search');

    const filters: any = {};

    if (status) {
      // Validate status
      if (!Object.values(SupplierStatus).includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      filters.status = status;
    }

    if (search) {
      filters.search = search;
    }

    const suppliers = await listSuppliers(filters);

    return NextResponse.json({
      suppliers,
      count: suppliers.length,
    });
  } catch (error: any) {
    console.error('Error listing suppliers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list suppliers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.code || typeof body.code !== 'string') {
      return NextResponse.json(
        { error: 'Supplier code is required' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(SupplierStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const supplier = await createSupplier({
      code: body.code,
      name: body.name,
      cuit: body.cuit,
      contactEmail: body.contactEmail,
      status: body.status,
    });

    return NextResponse.json(
      {
        message: 'Supplier created successfully',
        supplier,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating supplier:', error);

    // Handle validation errors with 400 status
    if (error.message.includes('already exists') ||
        error.message.includes('Invalid') ||
        error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create supplier' },
      { status: 500 }
    );
  }
}