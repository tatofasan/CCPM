# Stream B Quick Start Guide
## Supplier & Warehouse Management

### 🚀 Quick Test

```bash
# Run all tests
npm test -- suppliers.test.ts warehouses.test.ts

# Expected: 28 tests passing (12 supplier + 16 warehouse)
```

---

## 📦 API Quick Reference

### Create a Supplier
```bash
curl -X POST http://localhost:3000/api/admin/suppliers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUP001",
    "name": "Acme Wholesale",
    "cuit": "20-12345678-5",
    "contactEmail": "contact@acme.com",
    "status": "ACTIVE"
  }'
```

### Create a Warehouse
```bash
curl -X POST http://localhost:3000/api/admin/warehouses \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "SUPPLIER_ID_HERE",
    "name": "Main Warehouse",
    "address": "Av. Corrientes 1234, CABA",
    "operatingHours": "9:00-18:00",
    "capacity": 50000
  }'
```

### List Suppliers
```bash
curl http://localhost:3000/api/admin/suppliers?status=ACTIVE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### List Warehouses by Supplier
```bash
curl http://localhost:3000/api/admin/warehouses?supplierId=SUPPLIER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔍 CUIT Validation Examples

### Valid CUITs (with correct checksum)
```typescript
✓ "20-12345678-5"
✓ "30-71234567-8"
✓ "27-98765432-1"
```

### Invalid CUITs
```typescript
✗ "20123456785"      // Missing hyphens
✗ "20-12345678-9"    // Wrong checksum
✗ "invalid"          // Invalid format
```

### Generate Valid CUIT Checksum
```typescript
import { validateCUIT, formatCUIT } from '@/lib/suppliers/validation';

// Validate
const result = validateCUIT('20-12345678-5');
console.log(result.valid); // true

// Format from digits
const formatted = formatCUIT('20123456785');
console.log(formatted); // "20-12345678-5"
```

---

## ⏰ Operating Hours Examples

### Valid Formats
```typescript
✓ "9:00-18:00"                 // Single period
✓ "9:00-13:00, 14:00-18:00"   // Multiple periods
✓ "24/7"                       // Always open
✓ "Closed"                     // Not operational
```

### Invalid Formats
```typescript
✗ "18:00-9:00"     // End before start
✗ "25:00-18:00"    // Invalid hour
✗ "9:00-18:99"     // Invalid minute
✗ "invalid"        // Wrong format
```

---

## 📁 File Locations

```
lib/
├── suppliers/
│   ├── crud.ts          # Create, update, delete, get, list
│   └── validation.ts    # CUIT, email validation
└── warehouses/
    ├── crud.ts          # Create, update, delete, get, list
    └── validation.ts    # Operating hours validation

app/api/admin/
├── suppliers/
│   ├── route.ts         # GET (list), POST (create)
│   └── [id]/route.ts    # GET, PATCH, DELETE
└── warehouses/
    ├── route.ts         # GET (list), POST (create)
    └── [id]/route.ts    # GET, PATCH, DELETE
```

---

## 🧪 Usage in Code

### Create Supplier
```typescript
import { createSupplier } from '@/lib/suppliers/crud';

const supplier = await createSupplier({
  code: 'SUP001',
  name: 'Acme Wholesale',
  cuit: '20-12345678-5',
  contactEmail: 'contact@acme.com',
  status: 'ACTIVE'
});
```

### Create Warehouse
```typescript
import { createWarehouse } from '@/lib/warehouses/crud';

const warehouse = await createWarehouse({
  supplierId: supplier.id,
  name: 'Main Warehouse',
  address: 'Av. Corrientes 1234, CABA',
  operatingHours: '9:00-18:00',
  capacity: 50000
});
```

### List Suppliers with Filters
```typescript
import { listSuppliers } from '@/lib/suppliers/crud';
import { SupplierStatus } from '@prisma/client';

const suppliers = await listSuppliers({
  status: SupplierStatus.ACTIVE,
  search: 'acme'
});
```

### Delete Supplier (Smart Delete)
```typescript
import { deleteSupplier } from '@/lib/suppliers/crud';

// Automatically soft-deletes if has products
// Hard-deletes if no products
const result = await deleteSupplier(supplierId);
console.log(result.status); // INACTIVE if had products
```

---

## 🔐 Authentication

All endpoints require **ADMIN** role:

```typescript
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';

const authResult = await requireRole(request, [UserRole.ADMIN]);
if (authResult instanceof NextResponse) {
  return authResult; // 401 or 403
}
```

---

## 📊 Database Schema

```typescript
// Supplier
interface Supplier {
  id: string;              // CUID
  code: string;            // Unique code
  name: string;
  cuit: string | null;     // Argentine tax ID
  contactEmail: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse
interface Warehouse {
  id: string;              // CUID
  supplierId: string;      // FK to suppliers
  name: string;
  address: string;
  operatingHours: string | null;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🐛 Common Errors

### CUIT Validation Failed
**Error**: "Invalid CUIT checksum digit"
**Fix**: Use a valid CUIT with correct checksum (e.g., "20-12345678-5")

### Supplier Code Already Exists
**Error**: "Supplier with code 'SUP001' already exists"
**Fix**: Use a unique supplier code

### Warehouse Creation Failed
**Error**: "Supplier not found"
**Fix**: Ensure supplier exists before creating warehouse

### Operating Hours Invalid
**Error**: "Invalid time format"
**Fix**: Use format "HH:MM-HH:MM" or special values "24/7", "Closed"

---

## ✅ Checklist for Integration

- [x] Supplier CRUD implemented
- [x] Warehouse CRUD implemented
- [x] CUIT validation with checksum
- [x] Operating hours validation
- [x] API endpoints secured (ADMIN only)
- [x] Tests passing (28/28)
- [x] TypeScript compilation successful
- [x] Documentation complete

**Status**: Ready for Stream A (Product) integration

---

## 📖 Full Documentation

See `SUPPLIER_WAREHOUSE_SUMMARY.md` for complete API documentation, examples, and troubleshooting.

---

**Last Updated**: 2025-09-30
**Stream**: Stream B - Supplier & Warehouse Management
**Issue**: #6 - Product Catalog & Supplier Management