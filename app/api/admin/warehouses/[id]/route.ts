import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';
import { getWarehouse, updateWarehouse, deleteWarehouse } from '@/lib/warehouses/crud';

/**
 * GET /api/admin/warehouses/[id]
 * Get a specific warehouse by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const warehouse = await getWarehouse(params.id);
    return NextResponse.json({ warehouse });
  } catch (error: any) {
    console.error('Error getting warehouse:', error);

    if (error.message === 'Warehouse not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get warehouse' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/warehouses/[id]
 * Update a warehouse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();

    // Validate name if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return NextResponse.json(
        { error: 'Warehouse name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate address if provided
    if (body.address !== undefined && (typeof body.address !== 'string' || body.address.trim() === '')) {
      return NextResponse.json(
        { error: 'Warehouse address must be a non-empty string' },
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

    const warehouse = await updateWarehouse(params.id, {
      supplierId: body.supplierId,
      name: body.name,
      address: body.address,
      operatingHours: body.operatingHours,
      capacity: body.capacity,
    });

    return NextResponse.json({
      message: 'Warehouse updated successfully',
      warehouse,
    });
  } catch (error: any) {
    console.error('Error updating warehouse:', error);

    if (error.message === 'Warehouse not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

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
      { error: error.message || 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/warehouses/[id]
 * Delete a warehouse
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Require ADMIN role
  const authResult = await requireRole(request, [UserRole.ADMIN]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const warehouse = await deleteWarehouse(params.id);

    return NextResponse.json({
      message: 'Warehouse deleted successfully',
      warehouse,
    });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);

    if (error.message === 'Warehouse not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}