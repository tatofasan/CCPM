import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';
import { createWarehouse, listWarehouses } from '@/lib/warehouses/crud';

/**
 * GET /api/admin/warehouses
 * List all warehouses with optional filtering
 */
export async function GET(request: NextRequest) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const search = searchParams.get('search');

    const filters: any = {};

    if (supplierId) {
      filters.supplierId = supplierId;
    }

    if (search) {
      filters.search = search;
    }

    const warehouses = await listWarehouses(filters);

    return NextResponse.json({
      warehouses,
      count: warehouses.length,
    });
  } catch (error: any) {
    console.error('Error listing warehouses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list warehouses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/warehouses
 * Create a new warehouse
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
    if (!body.supplierId || typeof body.supplierId !== 'string') {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Warehouse name is required' },
        { status: 400 }
      );
    }

    if (!body.address || typeof body.address !== 'string') {
      return NextResponse.json(
        { error: 'Warehouse address is required' },
        { status: 400 }
      );
    }

    // Validate capacity if provided
    if (body.capacity !== undefined && body.capacity !== null) {
      if (typeof body.capacity !== 'number' || body.capacity < 0) {
        return NextResponse.json(
          { error: 'Capacity must be a positive number' },
          { status: 400 }
        );
      }
    }

    const warehouse = await createWarehouse({
      supplierId: body.supplierId,
      name: body.name,
      address: body.address,
      operatingHours: body.operatingHours,
      capacity: body.capacity,
    });

    return NextResponse.json(
      {
        message: 'Warehouse created successfully',
        warehouse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating warehouse:', error);

    // Handle validation errors with 400 status
    if (error.message.includes('not found') ||
        error.message.includes('Invalid') ||
        error.message.includes('required') ||
        error.message.includes('must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}