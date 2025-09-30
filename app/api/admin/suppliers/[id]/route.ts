import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { UserRole, SupplierStatus } from '@prisma/client';
import { getSupplier, updateSupplier, deleteSupplier } from '@/lib/suppliers/crud';

/**
 * GET /api/admin/suppliers/[id]
 * Get a specific supplier by ID
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
    const supplier = await getSupplier(params.id);
    return NextResponse.json({ supplier });
  } catch (error: any) {
    console.error('Error getting supplier:', error);

    if (error.message === 'Supplier not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to get supplier' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/suppliers/[id]
 * Update a supplier
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

    // Validate status if provided
    if (body.status && !Object.values(SupplierStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate code if provided
    if (body.code !== undefined && (typeof body.code !== 'string' || body.code.trim() === '')) {
      return NextResponse.json(
        { error: 'Supplier code must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate name if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return NextResponse.json(
        { error: 'Supplier name must be a non-empty string' },
        { status: 400 }
      );
    }

    const supplier = await updateSupplier(params.id, {
      code: body.code,
      name: body.name,
      cuit: body.cuit,
      contactEmail: body.contactEmail,
      status: body.status,
    });

    return NextResponse.json({
      message: 'Supplier updated successfully',
      supplier,
    });
  } catch (error: any) {
    console.error('Error updating supplier:', error);

    if (error.message === 'Supplier not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    // Handle validation errors with 400 status
    if (error.message.includes('already') ||
        error.message.includes('Invalid') ||
        error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/suppliers/[id]
 * Delete a supplier (soft delete if has products)
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
    const result = await deleteSupplier(params.id);

    // Check if it was a soft delete (status changed to INACTIVE)
    const wasSoftDelete = result.status === SupplierStatus.INACTIVE;

    return NextResponse.json({
      message: wasSoftDelete
        ? 'Supplier has active products and was set to INACTIVE'
        : 'Supplier deleted successfully',
      supplier: result,
      softDelete: wasSoftDelete,
    });
  } catch (error: any) {
    console.error('Error deleting supplier:', error);

    if (error.message === 'Supplier not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}