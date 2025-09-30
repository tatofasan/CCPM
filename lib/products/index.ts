// Core CRUD operations
export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductBySKU,
  listProducts,
  type CreateProductInput,
  type UpdateProductInput,
} from './crud';

// SKU generation
export {
  generateSKU,
  isValidSKUFormat,
  isSKUUnique,
} from './sku-generator';

// Visibility filtering
export {
  getVisibilityFilter,
  filterProductsByVisibility,
  canDropshipperViewProduct,
  updateProductVisibility,
} from './visibility';

// Stock management
export {
  updateStock,
  bulkUpdateStock,
  checkLowStock,
  getLowStockProducts,
  updateLowStockThreshold,
  type StockOperation,
  type StockUpdateResult,
} from './stock';

// Search and filtering
export {
  buildProductSearchFilter,
  buildProductSortOrder,
  parseSearchParams,
  type ProductSearchParams,
} from './search';