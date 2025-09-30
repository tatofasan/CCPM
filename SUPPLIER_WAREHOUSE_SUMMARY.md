# Supplier & Warehouse Management System - Implementation Summary

## Overview
Complete implementation of supplier and warehouse CRUD operations with comprehensive validation for the dropshipping platform. This system manages supplier relationships and their warehouse locations with Argentine business compliance (CUIT validation).

---

## Architecture

### File Structure
```
lib/
├── suppliers/
│   ├── crud.ts          # Supplier CRUD operations
│   └── validation.ts    # CUIT and email validation
└── warehouses/
    ├── crud.ts          # Warehouse CRUD operations
    └── validation.ts    # Operating hours validation

app/api/admin/
├── suppliers/
│   ├── route.ts         # GET (list), POST (create)
│   └── [id]/
│       └── route.ts     # GET, PATCH, DELETE by ID
└── warehouses/
    ├── route.ts         # GET (list), POST (create)
    └── [id]/
        └── route.ts     # GET, PATCH, DELETE by ID

__tests__/
├── suppliers.test.ts    # 12 test cases
└── warehouses.test.ts   # 16 test cases
```

---

## Supplier Management

### Data Model
```typescript
interface Supplier {
  id: string;                  // CUID
  code: string;                // Unique supplier code (e.g., "SUP001")
  name: string;                // Supplier name
  cuit: string | null;         // Argentine tax ID (##-########-#)
  contactEmail: string | null; // Contact email
  status: SupplierStatus;      // ACTIVE | INACTIVE | SUSPENDED
  createdAt: Date;
  updatedAt: Date;
}
```

### CUIT Validation
Argentine tax identification number (Clave Única de Identificación Tributaria):

**Format**: `##-########-#` (11 digits with hyphens)

**Example Valid CUITs**:
- `20-12345678-5` - Individual person
- `30-71234567-8` - Company
- `27-98765432-1` - Female individual

**Validation Rules**:
1. Format must be exactly `##-########-#`
2. Must contain only digits and hyphens
3. Checksum digit (last digit) validated using Modulo 11 algorithm
4. Must be unique across all suppliers

**Checksum Algorithm** (Modulo 11):
```typescript
// Multipliers: [2, 3, 4, 5, 6, 7, 2, 3, 4, 5]
// Sum = (d0*2 + d1*3 + d2*4 + ... + d9*5)
// Checksum = 11 - (Sum % 11)
// Special cases: 11 → 0, 10 → 9
```

### API Endpoints

#### List Suppliers
```http
GET /api/admin/suppliers?status=ACTIVE&search=supplier
Authorization: Bearer <admin-token>

Response 200:
{
  "suppliers": [
    {
      "id": "clx1...",
      "code": "SUP001",
      "name": "Supplier Name",
      "cuit": "20-12345678-5",
      "contactEmail": "contact@supplier.com",
      "status": "ACTIVE",
      "warehouses": [...],
      "_count": { "products": 42 },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:20:00Z"
    }
  ],
  "count": 1
}
```

#### Create Supplier
```http
POST /api/admin/suppliers
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "code": "SUP001",
  "name": "Test Supplier",
  "cuit": "20-12345678-5",
  "contactEmail": "contact@supplier.com",
  "status": "ACTIVE"
}

Response 201:
{
  "message": "Supplier created successfully",
  "supplier": { ... }
}

Errors:
- 400: Invalid CUIT format/checksum
- 400: Duplicate code or CUIT
- 400: Invalid email format
- 401: Authentication required
- 403: Insufficient permissions
```

#### Get Supplier
```http
GET /api/admin/suppliers/:id
Authorization: Bearer <admin-token>

Response 200:
{
  "supplier": {
    "id": "clx1...",
    "code": "SUP001",
    "name": "Supplier Name",
    "warehouses": [
      {
        "id": "clx2...",
        "name": "Main Warehouse",
        "capacity": 10000
      }
    ],
    "products": [
      {
        "id": "clx3...",
        "sku": "ECOMDROP01-1",
        "name": "Product Name",
        "stock": 100
      }
    ]
  }
}

Errors:
- 404: Supplier not found
```

#### Update Supplier
```http
PATCH /api/admin/suppliers/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "INACTIVE",
  "contactEmail": "new@email.com"
}

Response 200:
{
  "message": "Supplier updated successfully",
  "supplier": { ... }
}

Errors:
- 400: Validation errors
- 404: Supplier not found
```

#### Delete Supplier
```http
DELETE /api/admin/suppliers/:id
Authorization: Bearer <admin-token>

Response 200 (has products - soft delete):
{
  "message": "Supplier has active products and was set to INACTIVE",
  "supplier": { ... },
  "softDelete": true
}

Response 200 (no products - hard delete):
{
  "message": "Supplier deleted successfully",
  "supplier": { ... },
  "softDelete": false
}

Errors:
- 404: Supplier not found
```

### Business Rules
1. **Code Uniqueness**: Supplier codes must be unique across all suppliers
2. **CUIT Uniqueness**: CUITs must be unique across all suppliers
3. **CUIT Validation**: Full format and checksum validation
4. **Email Validation**: Contact emails must be valid format
5. **Smart Deletion**:
   - If supplier has products → soft delete (status = INACTIVE)
   - If supplier has no products → hard delete (remove from DB)
6. **Status Management**: Can manually set to ACTIVE, INACTIVE, or SUSPENDED

---

## Warehouse Management

### Data Model
```typescript
interface Warehouse {
  id: string;                  // CUID
  supplierId: string;          // FK to suppliers table
  name: string;                // Warehouse name
  address: string;             // Physical address
  operatingHours: string | null; // Operating hours (e.g., "9:00-18:00")
  capacity: number | null;     // Storage capacity
  createdAt: Date;
  updatedAt: Date;
  supplier: Supplier;          // Relation
}
```

### Operating Hours Validation

**Accepted Formats**:
```typescript
"9:00-18:00"                  // Single period
"9:00-13:00, 14:00-18:00"    // Multiple periods (lunch break)
"8:30-17:30"                  // Custom times
"24/7"                        // Always open
"Closed"                      // Not operational
```

**Validation Rules**:
1. Time format must be `HH:MM-HH:MM` (24-hour format)
2. Hours: 0-23, Minutes: 0-59
3. Start time must be before end time
4. Multiple periods separated by comma
5. Special values: "24/7" or "Closed" (case-insensitive)

**Invalid Examples**:
```typescript
"18:00-9:00"     // End before start
"25:00-18:00"    // Invalid hour (25)
"9:00-18:99"     // Invalid minute (99)
"invalid-hours"  // Invalid format
```

### API Endpoints

#### List Warehouses
```http
GET /api/admin/warehouses?supplierId=clx1...&search=main
Authorization: Bearer <admin-token>

Response 200:
{
  "warehouses": [
    {
      "id": "clx2...",
      "supplierId": "clx1...",
      "name": "Main Warehouse",
      "address": "123 Main St, Buenos Aires",
      "operatingHours": "9:00-18:00",
      "capacity": 10000,
      "supplier": {
        "id": "clx1...",
        "code": "SUP001",
        "name": "Supplier Name",
        "status": "ACTIVE"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:20:00Z"
    }
  ],
  "count": 1
}
```

#### Create Warehouse
```http
POST /api/admin/warehouses
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "supplierId": "clx1...",
  "name": "Main Warehouse",
  "address": "123 Main St, Buenos Aires",
  "operatingHours": "9:00-18:00",
  "capacity": 10000
}

Response 201:
{
  "message": "Warehouse created successfully",
  "warehouse": { ... }
}

Errors:
- 400: Supplier not found
- 400: Invalid operating hours
- 400: Invalid capacity (negative)
- 401: Authentication required
- 403: Insufficient permissions
```

#### Get Warehouse
```http
GET /api/admin/warehouses/:id
Authorization: Bearer <admin-token>

Response 200:
{
  "warehouse": {
    "id": "clx2...",
    "supplierId": "clx1...",
    "name": "Main Warehouse",
    "address": "123 Main St",
    "operatingHours": "9:00-18:00",
    "capacity": 10000,
    "supplier": {
      "id": "clx1...",
      "code": "SUP001",
      "name": "Supplier Name",
      "status": "ACTIVE"
    }
  }
}

Errors:
- 404: Warehouse not found
```

#### Update Warehouse
```http
PATCH /api/admin/warehouses/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Warehouse",
  "operatingHours": "8:00-20:00",
  "capacity": 15000
}

Response 200:
{
  "message": "Warehouse updated successfully",
  "warehouse": { ... }
}

Errors:
- 400: Validation errors
- 404: Warehouse not found
```

#### Delete Warehouse
```http
DELETE /api/admin/warehouses/:id
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "Warehouse deleted successfully",
  "warehouse": { ... }
}

Errors:
- 404: Warehouse not found
```

### Business Rules
1. **Supplier Required**: Must link to existing supplier
2. **Address Required**: Cannot create warehouse without address
3. **Operating Hours**: Optional, but if provided must be valid format
4. **Capacity**: Optional, but if provided must be positive number
5. **Cascade Delete**: Warehouses are deleted when supplier is deleted
6. **Search & Filter**: Can filter by supplier or search by name/address

---

## Usage Examples

### Creating a Complete Supplier with Warehouse

```typescript
// 1. Create supplier
const supplier = await fetch('/api/admin/suppliers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'SUP001',
    name: 'Acme Wholesale',
    cuit: '20-12345678-5',
    contactEmail: 'contact@acme.com',
    status: 'ACTIVE'
  })
});

// 2. Create warehouse for supplier
const warehouse = await fetch('/api/admin/warehouses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supplierId: supplier.id,
    name: 'Acme Main Warehouse',
    address: 'Av. Corrientes 1234, CABA, Buenos Aires',
    operatingHours: '9:00-18:00',
    capacity: 50000
  })
});

// 3. List all warehouses for this supplier
const warehouses = await fetch(
  `/api/admin/warehouses?supplierId=${supplier.id}`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

### CUIT Validation in Frontend

```typescript
import { validateCUIT, formatCUIT } from '@/lib/suppliers/validation';

// Validate CUIT before submitting
const handleCuitChange = (value: string) => {
  const validation = validateCUIT(value);

  if (!validation.valid) {
    setError(validation.error);
  } else {
    setError(null);
  }
};

// Format CUIT from plain digits
const formattedCuit = formatCUIT('20123456785');
// Result: "20-12345678-5"
```

### Operating Hours Validation

```typescript
import { validateOperatingHours } from '@/lib/warehouses/validation';

const handleHoursChange = (value: string) => {
  const validation = validateOperatingHours(value);

  if (!validation.valid) {
    setError(validation.error);
  } else {
    setError(null);
  }
};

// Valid examples:
validateOperatingHours('9:00-18:00');                // ✓
validateOperatingHours('9:00-13:00, 14:00-18:00');  // ✓
validateOperatingHours('24/7');                      // ✓
validateOperatingHours('Closed');                    // ✓
```

---

## Testing

### Test Coverage
- **Suppliers**: 12 test cases
  - CRUD operations (create, update, delete, get, list)
  - CUIT validation (format, checksum, uniqueness)
  - Email validation
  - Soft vs hard delete logic
  - Error cases

- **Warehouses**: 16 test cases
  - CRUD operations (create, update, delete, get, list)
  - Operating hours validation (format, ranges, special values)
  - Capacity validation
  - Supplier relationship validation
  - Error cases

### Running Tests
```bash
# Run supplier tests
npm test -- suppliers.test.ts

# Run warehouse tests
npm test -- warehouses.test.ts

# Run all tests
npm test
```

---

## Integration Notes for Stream A (Products)

### Product-Supplier Relationship
Products should reference suppliers:

```typescript
// In product creation
const product = await prisma.product.create({
  data: {
    sku: 'ECOMDROP01-1',
    name: 'Product Name',
    supplierId: 'clx1...',  // Link to supplier
    // ... other fields
  }
});

// Schema already has proper relation:
// supplier Supplier @relation(fields: [supplierId], references: [id], onDelete: Restrict)
```

### Supplier Deletion Protection
- Suppliers with products cannot be hard deleted
- They are automatically soft deleted (status = INACTIVE)
- Products remain linked to inactive suppliers
- You can filter products by supplier status if needed

### Querying Products by Supplier
```typescript
// Get all products from a supplier
const products = await prisma.product.findMany({
  where: {
    supplierId: 'clx1...'
  },
  include: {
    supplier: true
  }
});

// Get products only from active suppliers
const products = await prisma.product.findMany({
  where: {
    supplier: {
      status: 'ACTIVE'
    }
  }
});
```

---

## Security

### Authentication & Authorization
- All endpoints require JWT authentication
- Only ADMIN role can access supplier/warehouse endpoints
- Uses `requireRole(request, [UserRole.ADMIN])` middleware
- Returns 401 if not authenticated, 403 if not authorized

### Validation
- All inputs validated before database operations
- CUIT checksum prevents fake tax IDs
- Email format validation
- Operating hours format validation
- Capacity must be positive

### Error Handling
- Sensitive information not exposed in errors
- Proper HTTP status codes (400, 401, 403, 404, 500)
- Validation errors clearly indicate the issue
- Database errors logged but not exposed to client

---

## Performance Considerations

### Database Indexes
Already configured in Prisma schema:
```prisma
model Supplier {
  code String @unique  // Indexed for fast lookup
  cuit String @unique  // Indexed for uniqueness check
}

model Warehouse {
  supplierId String   // Indexed via FK
}
```

### Query Optimization
- List operations include relevant relations
- Count queries use `_count` for efficiency
- Search uses case-insensitive mode
- Filters applied at database level

---

## Future Enhancements

### Potential Features
1. **Product-Warehouse Assignment**
   - Track which products are in which warehouses
   - Stock levels per warehouse

2. **Supplier Performance Metrics**
   - Delivery times
   - Order fulfillment rates
   - Quality scores

3. **Warehouse Capacity Management**
   - Current utilization tracking
   - Low capacity alerts
   - Capacity planning

4. **AFIP Integration**
   - Real-time CUIT verification with Argentine tax authority
   - Automated tax status checks

5. **Multi-warehouse Inventory**
   - Split inventory across warehouses
   - Warehouse selection logic for orders
   - Transfer between warehouses

---

## Troubleshooting

### Common Issues

**CUIT Validation Failing**:
- Ensure format is exactly `##-########-#`
- Check checksum digit is correct using Modulo 11
- Use `formatCUIT()` to automatically format from digits

**Supplier Cannot Be Deleted**:
- Check if supplier has associated products
- Soft delete will occur automatically if products exist
- Consider setting status to INACTIVE instead

**Operating Hours Validation Error**:
- Ensure format is `HH:MM-HH:MM`
- Check hours (0-23) and minutes (0-59)
- Ensure start time is before end time
- Use special values "24/7" or "Closed" if applicable

**Warehouse Creation Fails**:
- Verify supplier exists and ID is correct
- Check all required fields (supplierId, name, address)
- Validate operating hours format if provided
- Ensure capacity is positive if provided

---

## Database Schema Reference

```prisma
model Supplier {
  id           String         @id @default(cuid())
  code         String         @unique
  name         String
  cuit         String?
  contactEmail String?        @map("contact_email")
  status       SupplierStatus @default(ACTIVE)
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")

  products   Product[]
  warehouses Warehouse[]

  @@map("suppliers")
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Warehouse {
  id             String   @id @default(cuid())
  supplierId     String   @map("supplier_id")
  name           String
  address        String
  operatingHours String?  @map("operating_hours")
  capacity       Int?
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  supplier Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@map("warehouses")
}
```

---

## Contact & Support

For questions about this implementation:
- Review the code in `/lib/suppliers` and `/lib/warehouses`
- Check test files for usage examples
- See API route files for endpoint details

**Status**: ✅ Complete and Ready for Integration