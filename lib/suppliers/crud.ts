import { prisma } from '@/lib/prisma';
import { SupplierStatus } from '@prisma/client';
import { validateCUIT } from './validation';

export interface CreateSupplierInput {
  code: string;
  name: string;
  cuit?: string;
  contactEmail?: string;
  status?: SupplierStatus;
}

export interface UpdateSupplierInput {
  code?: string;
  name?: string;
  cuit?: string;
  contactEmail?: string;
  status?: SupplierStatus;
}

export async function createSupplier(data: CreateSupplierInput) {
  // Validate CUIT if provided
  if (data.cuit) {
    const cuitValidation = validateCUIT(data.cuit);
    if (!cuitValidation.valid) {
      throw new Error(cuitValidation.error || 'Invalid CUIT format');
    }
  }

  // Check if code already exists
  const existingByCode = await prisma.supplier.findUnique({
    where: { code: data.code },
  });

  if (existingByCode) {
    throw new Error(`Supplier with code '${data.code}' already exists`);
  }

  // Check if CUIT already exists (if provided)
  if (data.cuit) {
    const existingByCuit = await prisma.supplier.findFirst({
      where: { cuit: data.cuit },
    });

    if (existingByCuit) {
      throw new Error(`Supplier with CUIT '${data.cuit}' already exists`);
    }
  }

  // Validate email format if provided
  if (data.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      throw new Error('Invalid email format');
    }
  }

  return prisma.supplier.create({
    data: {
      code: data.code,
      name: data.name,
      cuit: data.cuit || null,
      contactEmail: data.contactEmail || null,
      status: data.status || SupplierStatus.ACTIVE,
    },
  });
}

export async function updateSupplier(id: string, data: UpdateSupplierInput) {
  // Check if supplier exists
  const existing = await prisma.supplier.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Supplier not found');
  }

  // Validate CUIT if provided
  if (data.cuit) {
    const cuitValidation = validateCUIT(data.cuit);
    if (!cuitValidation.valid) {
      throw new Error(cuitValidation.error || 'Invalid CUIT format');
    }

    // Check if CUIT already exists for another supplier
    const existingByCuit = await prisma.supplier.findFirst({
      where: {
        cuit: data.cuit,
        id: { not: id },
      },
    });

    if (existingByCuit) {
      throw new Error(`CUIT '${data.cuit}' is already in use by another supplier`);
    }
  }

  // Check if code already exists for another supplier
  if (data.code) {
    const existingByCode = await prisma.supplier.findFirst({
      where: {
        code: data.code,
        id: { not: id },
      },
    });

    if (existingByCode) {
      throw new Error(`Code '${data.code}' is already in use by another supplier`);
    }
  }

  // Validate email format if provided
  if (data.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contactEmail)) {
      throw new Error('Invalid email format');
    }
  }

  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.code && { code: data.code }),
      ...(data.name && { name: data.name }),
      ...(data.cuit !== undefined && { cuit: data.cuit || null }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail || null }),
      ...(data.status && { status: data.status }),
    },
  });
}

export async function deleteSupplier(id: string) {
  // Check if supplier exists
  const existing = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });

  if (!existing) {
    throw new Error('Supplier not found');
  }

  // Check if supplier has active products
  const hasActiveProducts = existing.products.length > 0;

  if (hasActiveProducts) {
    // Soft delete: Set status to INACTIVE instead of deleting
    return prisma.supplier.update({
      where: { id },
      data: { status: SupplierStatus.INACTIVE },
    });
  }

  // Hard delete if no products
  return prisma.supplier.delete({
    where: { id },
  });
}

export async function getSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      warehouses: true,
      products: {
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
        },
      },
    },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  return supplier;
}

export async function listSuppliers(filters?: {
  status?: SupplierStatus;
  search?: string;
}) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { cuit: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.supplier.findMany({
    where,
    include: {
      warehouses: {
        select: {
          id: true,
          name: true,
          capacity: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}