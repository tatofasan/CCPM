import { prisma } from '@/lib/prisma';
import { validateOperatingHours } from './validation';

export interface CreateWarehouseInput {
  supplierId: string;
  name: string;
  address: string;
  operatingHours?: string;
  capacity?: number;
}

export interface UpdateWarehouseInput {
  supplierId?: string;
  name?: string;
  address?: string;
  operatingHours?: string;
  capacity?: number;
}

export async function createWarehouse(data: CreateWarehouseInput) {
  // Check if supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Validate operating hours if provided
  if (data.operatingHours) {
    const validation = validateOperatingHours(data.operatingHours);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid operating hours format');
    }
  }

  // Validate capacity if provided
  if (data.capacity !== undefined && data.capacity < 0) {
    throw new Error('Capacity must be a positive number');
  }

  return prisma.warehouse.create({
    data: {
      supplierId: data.supplierId,
      name: data.name,
      address: data.address,
      operatingHours: data.operatingHours || null,
      capacity: data.capacity || null,
    },
    include: {
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function updateWarehouse(id: string, data: UpdateWarehouseInput) {
  // Check if warehouse exists
  const existing = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Warehouse not found');
  }

  // Check if supplier exists (if being updated)
  if (data.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }
  }

  // Validate operating hours if provided
  if (data.operatingHours) {
    const validation = validateOperatingHours(data.operatingHours);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid operating hours format');
    }
  }

  // Validate capacity if provided
  if (data.capacity !== undefined && data.capacity < 0) {
    throw new Error('Capacity must be a positive number');
  }

  return prisma.warehouse.update({
    where: { id },
    data: {
      ...(data.supplierId && { supplierId: data.supplierId }),
      ...(data.name && { name: data.name }),
      ...(data.address && { address: data.address }),
      ...(data.operatingHours !== undefined && { operatingHours: data.operatingHours || null }),
      ...(data.capacity !== undefined && { capacity: data.capacity || null }),
    },
    include: {
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function deleteWarehouse(id: string) {
  // Check if warehouse exists
  const existing = await prisma.warehouse.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Warehouse not found');
  }

  return prisma.warehouse.delete({
    where: { id },
  });
}

export async function getWarehouse(id: string) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  return warehouse;
}

export async function listWarehouses(filters?: {
  supplierId?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { address: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.warehouse.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}