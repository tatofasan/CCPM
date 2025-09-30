import { prisma } from '@/lib/prisma';
import { ProductVisibility, Prisma } from '@prisma/client';
import { generateSKU } from './sku-generator';

export interface CreateProductInput {
  name: string;
  description?: string;
  costPrice: number;
  suggestedPrice: number;
  stock?: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  supplierId: string;
  visibilityType?: ProductVisibility;
  visibilityTargetIds?: string[];
  imagesUrls?: string[];
  sku?: string; // Optional: auto-generated if not provided
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  costPrice?: number;
  suggestedPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  supplierId?: string;
  visibilityType?: ProductVisibility;
  visibilityTargetIds?: string[];
  imagesUrls?: string[];
}

/**
 * Creates a new product
 * Automatically generates a SKU if not provided
 */
export async function createProduct(input: CreateProductInput) {
  // Validate supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: input.supplierId },
  });

  if (!supplier) {
    throw new Error(`Supplier with ID ${input.supplierId} not found`);
  }

  // Generate SKU if not provided
  const sku = input.sku || (await generateSKU());

  // Validate visibility
  if (
    (input.visibilityType === ProductVisibility.GROUPS ||
      input.visibilityType === ProductVisibility.SPECIFIC) &&
    (!input.visibilityTargetIds || input.visibilityTargetIds.length === 0)
  ) {
    throw new Error(
      `visibilityTargetIds is required for visibility type ${input.visibilityType}`
    );
  }

  // Create product
  return prisma.product.create({
    data: {
      sku,
      name: input.name,
      description: input.description,
      costPrice: input.costPrice,
      suggestedPrice: input.suggestedPrice,
      stock: input.stock ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 10,
      weight: input.weight,
      dimensions: input.dimensions || Prisma.JsonNull,
      supplierId: input.supplierId,
      visibilityType: input.visibilityType ?? ProductVisibility.ALL,
      visibilityTargetIds:
        input.visibilityType === ProductVisibility.ALL
          ? Prisma.JsonNull
          : input.visibilityTargetIds || Prisma.JsonNull,
      imagesUrls: input.imagesUrls ?? [],
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

/**
 * Updates an existing product
 */
export async function updateProduct(productId: string, input: UpdateProductInput) {
  // Verify product exists
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Validate supplier if being updated
  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });

    if (!supplier) {
      throw new Error(`Supplier with ID ${input.supplierId} not found`);
    }
  }

  // Validate visibility
  if (
    (input.visibilityType === ProductVisibility.GROUPS ||
      input.visibilityType === ProductVisibility.SPECIFIC) &&
    (!input.visibilityTargetIds || input.visibilityTargetIds.length === 0)
  ) {
    throw new Error(
      `visibilityTargetIds is required for visibility type ${input.visibilityType}`
    );
  }

  // Build update data
  const updateData: Prisma.ProductUpdateInput = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.costPrice !== undefined && { costPrice: input.costPrice }),
    ...(input.suggestedPrice !== undefined && { suggestedPrice: input.suggestedPrice }),
    ...(input.stock !== undefined && { stock: input.stock }),
    ...(input.lowStockThreshold !== undefined && {
      lowStockThreshold: input.lowStockThreshold,
    }),
    ...(input.weight !== undefined && { weight: input.weight }),
    ...(input.dimensions !== undefined && { dimensions: input.dimensions || Prisma.JsonNull }),
    ...(input.supplierId !== undefined && { supplierId: input.supplierId }),
    ...(input.visibilityType !== undefined && {
      visibilityType: input.visibilityType,
      visibilityTargetIds:
        input.visibilityType === ProductVisibility.ALL
          ? Prisma.JsonNull
          : input.visibilityTargetIds || Prisma.JsonNull,
    }),
    ...(input.imagesUrls !== undefined && { imagesUrls: input.imagesUrls }),
  };

  // Update product
  return prisma.product.update({
    where: { id: productId },
    data: updateData,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });
}

/**
 * Deletes a product
 * Note: Will fail if product has associated order items due to Restrict constraint
 */
export async function deleteProduct(productId: string) {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: {
        select: {
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Check if product has order items
  if (product._count.orderItems > 0) {
    throw new Error(
      `Cannot delete product. It has ${product._count.orderItems} associated order items.`
    );
  }

  // Delete product
  return prisma.product.delete({
    where: { id: productId },
  });
}

/**
 * Gets a single product by ID
 */
export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  return product;
}

/**
 * Gets a single product by SKU
 */
export async function getProductBySKU(sku: string) {
  const product = await prisma.product.findUnique({
    where: { sku },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product with SKU ${sku} not found`);
  }

  return product;
}

/**
 * Lists products with pagination
 */
export async function listProducts(params: {
  skip?: number;
  take?: number;
  where?: Prisma.ProductWhereInput;
  orderBy?: Prisma.ProductOrderByWithRelationInput;
  includeSupplier?: boolean;
}) {
  const { skip = 0, take = 50, where, orderBy, includeSupplier = true } = params;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take,
      where,
      orderBy,
      include: includeSupplier
        ? {
            supplier: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
              },
            },
          }
        : undefined,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    skip,
    take,
    hasMore: skip + products.length < total,
  };
}