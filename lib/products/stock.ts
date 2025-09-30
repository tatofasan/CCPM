import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/jobs/notification-dispatcher';

export type StockOperation = 'SET' | 'INCREMENT' | 'DECREMENT';

export interface StockUpdateResult {
  success: boolean;
  newStock: number;
  lowStockAlert: boolean;
}

/**
 * Updates the stock for a product
 *
 * @param productId - The ID of the product
 * @param quantity - The quantity to set/add/subtract
 * @param operation - The operation type: SET (absolute), INCREMENT (add), DECREMENT (subtract)
 * @returns Stock update result with low stock alert flag
 */
export async function updateStock(
  productId: string,
  quantity: number,
  operation: StockOperation = 'SET'
): Promise<StockUpdateResult> {
  // Fetch the current product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStockThreshold: true,
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Calculate new stock based on operation
  let newStock: number;
  switch (operation) {
    case 'SET':
      newStock = quantity;
      break;
    case 'INCREMENT':
      newStock = product.stock + quantity;
      break;
    case 'DECREMENT':
      newStock = product.stock - quantity;
      break;
    default:
      throw new Error(`Invalid stock operation: ${operation}`);
  }

  // Ensure stock doesn't go negative
  if (newStock < 0) {
    throw new Error(
      `Stock cannot be negative. Current: ${product.stock}, Attempted: ${newStock}`
    );
  }

  // Update the stock
  await prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  });

  // Check if low stock alert should be triggered
  const lowStockAlert = newStock < product.lowStockThreshold;

  // Create low-stock notification if threshold crossed
  if (lowStockAlert && newStock < product.stock) {
    // Only alert if stock is decreasing and below threshold
    await createLowStockAlert(product.id, product.name, product.sku, newStock, product.lowStockThreshold);
  }

  return {
    success: true,
    newStock,
    lowStockAlert,
  };
}

/**
 * Bulk update stock for multiple products
 */
export async function bulkUpdateStock(
  updates: Array<{ productId: string; quantity: number; operation: StockOperation }>
): Promise<StockUpdateResult[]> {
  const results: StockUpdateResult[] = [];

  // Process updates sequentially to avoid race conditions
  for (const update of updates) {
    try {
      const result = await updateStock(update.productId, update.quantity, update.operation);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        newStock: 0,
        lowStockAlert: false,
      });
    }
  }

  return results;
}

/**
 * Checks if a product has low stock
 */
export async function checkLowStock(productId: string): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      stock: true,
      lowStockThreshold: true,
    },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  return product.stock < product.lowStockThreshold;
}

/**
 * Gets all products with low stock
 */
export async function getLowStockProducts() {
  // Note: Prisma doesn't support comparing two columns directly in where clause
  // So we fetch all products and filter in memory
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      lowStockThreshold: true,
      supplier: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  // Filter products where stock < lowStockThreshold
  return allProducts
    .filter((product) => product.stock < product.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);
}

/**
 * Creates a low-stock alert notification
 */
async function createLowStockAlert(
  productId: string,
  productName: string,
  sku: string,
  currentStock: number,
  threshold: number
): Promise<void> {
  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    // Create notification for each admin
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type: 'LOW_STOCK_ALERT',
        title: 'Low Stock Alert',
        message: `Product "${productName}" (${sku}) is running low on stock. Current: ${currentStock}, Threshold: ${threshold}`,
        metadata: {
          productId,
          productName,
          sku,
          currentStock,
          threshold,
        },
      });
    }
  } catch (error) {
    // Log error but don't throw - stock update should still succeed
    console.error('Failed to create low stock alert:', error);
  }
}

/**
 * Updates the low stock threshold for a product
 */
export async function updateLowStockThreshold(
  productId: string,
  threshold: number
): Promise<void> {
  if (threshold < 0) {
    throw new Error('Low stock threshold cannot be negative');
  }

  await prisma.product.update({
    where: { id: productId },
    data: { lowStockThreshold: threshold },
  });
}