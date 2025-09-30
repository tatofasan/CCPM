# Products Library

This library provides comprehensive product management functionality for the dropshipping platform.

## Quick Start

```typescript
import {
  createProduct,
  updateProduct,
  listProducts,
  updateStock,
  getVisibilityFilter,
} from '@/lib/products';

// Create a product
const product = await createProduct({
  name: 'Wireless Mouse',
  costPrice: 10.00,
  suggestedPrice: 25.00,
  supplierId: 'supplier_id',
  visibilityType: 'ALL',
});

// List products with visibility filtering
const { products, total } = await listProducts({
  where: getVisibilityFilter(dropshipperId),
  take: 20,
});

// Update stock
await updateStock(productId, 5, 'DECREMENT');
```

## Modules

### crud.ts
Core CRUD operations for products.
- `createProduct()` - Create new product (auto-generates SKU)
- `updateProduct()` - Update existing product
- `deleteProduct()` - Delete product (checks for orders)
- `getProductById()` - Fetch by ID
- `getProductBySKU()` - Fetch by SKU
- `listProducts()` - Paginated list with filters

### sku-generator.ts
Automatic SKU generation.
- `generateSKU()` - Generate unique SKU (ECOMDROP##-#)
- `isValidSKUFormat()` - Validate SKU format
- `isSKUUnique()` - Check SKU uniqueness

### visibility.ts
Product visibility filtering for dropshippers.
- `getVisibilityFilter()` - Get Prisma where clause
- `filterProductsByVisibility()` - In-memory filter
- `canDropshipperViewProduct()` - Permission check
- `updateProductVisibility()` - Update visibility settings

### stock.ts
Stock management and low stock alerts.
- `updateStock()` - Update with SET/INCREMENT/DECREMENT
- `bulkUpdateStock()` - Update multiple products
- `checkLowStock()` - Check if product is low on stock
- `getLowStockProducts()` - Get all low stock products
- `updateLowStockThreshold()` - Update threshold

### search.ts
Search and filtering utilities.
- `buildProductSearchFilter()` - Build Prisma where clause
- `buildProductSortOrder()` - Build order by clause
- `parseSearchParams()` - Parse query parameters

## Visibility Types

- **ALL**: Product visible to all dropshippers
- **GROUPS**: Product visible to specific groups
- **SPECIFIC**: Product visible to specific dropshippers

For GROUPS and SPECIFIC, provide `visibilityTargetIds` array.

## Stock Operations

- **SET**: Set stock to absolute value
- **INCREMENT**: Add to stock
- **DECREMENT**: Subtract from stock

Automatically triggers low stock alerts when stock falls below threshold.

## SKU Format

Format: `ECOMDROP##-#`

Examples:
- `ECOMDROP01-1`
- `ECOMDROP12-12`
- `ECOMDROP00-100`

## Error Handling

All functions throw errors with descriptive messages:
- Product not found
- Supplier not found
- Invalid visibility settings
- Negative stock
- SKU already exists

Handle errors appropriately in your API routes.

## See Also

- API Documentation: `/PRODUCT_CRUD_SUMMARY.md`
- Stream A Documentation: `/.claude/epics/dropshipping-platform/updates/6/stream-a.md`