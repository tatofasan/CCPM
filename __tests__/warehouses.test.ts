import { createWarehouse, updateWarehouse, deleteWarehouse, getWarehouse, listWarehouses } from '@/lib/warehouses/crud';
import { validateOperatingHours, formatOperatingHours } from '@/lib/warehouses/validation';
import { prisma } from '@/lib/prisma';

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    supplier: {
      findUnique: jest.fn(),
    },
    warehouse: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Warehouse CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWarehouse', () => {
    it('should create a warehouse with valid data', async () => {
      const mockWarehouse = {
        id: 'test-id',
        supplierId: 'supplier-id',
        name: 'Main Warehouse',
        address: '123 Main St',
        operatingHours: '9:00-18:00',
        capacity: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-id',
          code: 'SUP001',
          name: 'Test Supplier',
        },
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'supplier-id' });
      (prisma.warehouse.create as jest.Mock).mockResolvedValue(mockWarehouse);

      const result = await createWarehouse({
        supplierId: 'supplier-id',
        name: 'Main Warehouse',
        address: '123 Main St',
        operatingHours: '9:00-18:00',
        capacity: 10000,
      });

      expect(result).toEqual(mockWarehouse);
    });

    it('should reject if supplier not found', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        createWarehouse({
          supplierId: 'nonexistent',
          name: 'Test Warehouse',
          address: '123 Main St',
        })
      ).rejects.toThrow('Supplier not found');
    });

    it('should reject invalid operating hours', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'supplier-id' });

      await expect(
        createWarehouse({
          supplierId: 'supplier-id',
          name: 'Test Warehouse',
          address: '123 Main St',
          operatingHours: 'invalid-hours',
        })
      ).rejects.toThrow('Invalid time format');
    });

    it('should reject negative capacity', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'supplier-id' });

      await expect(
        createWarehouse({
          supplierId: 'supplier-id',
          name: 'Test Warehouse',
          address: '123 Main St',
          capacity: -100,
        })
      ).rejects.toThrow('positive number');
    });
  });

  describe('updateWarehouse', () => {
    it('should update warehouse with valid data', async () => {
      const mockWarehouse = {
        id: 'test-id',
        supplierId: 'supplier-id',
        name: 'Updated Warehouse',
        address: '123 Main St',
        operatingHours: '9:00-18:00',
        capacity: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        supplier: {
          id: 'supplier-id',
          code: 'SUP001',
          name: 'Test Supplier',
        },
      };

      (prisma.warehouse.findUnique as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.warehouse.update as jest.Mock).mockResolvedValue(mockWarehouse);

      const result = await updateWarehouse('test-id', {
        name: 'Updated Warehouse',
      });

      expect(result).toEqual(mockWarehouse);
    });

    it('should throw error if warehouse not found', async () => {
      (prisma.warehouse.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        updateWarehouse('nonexistent-id', { name: 'Updated' })
      ).rejects.toThrow('Warehouse not found');
    });
  });

  describe('deleteWarehouse', () => {
    it('should delete warehouse successfully', async () => {
      const mockWarehouse = {
        id: 'test-id',
        supplierId: 'supplier-id',
        name: 'Test Warehouse',
        address: '123 Main St',
        operatingHours: '9:00-18:00',
        capacity: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.warehouse.findUnique as jest.Mock).mockResolvedValue(mockWarehouse);
      (prisma.warehouse.delete as jest.Mock).mockResolvedValue(mockWarehouse);

      await deleteWarehouse('test-id');

      expect(prisma.warehouse.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });
  });
});

describe('Operating Hours Validation', () => {
  it('should validate correct time format', () => {
    const result = validateOperatingHours('9:00-18:00');
    expect(result.valid).toBe(true);
  });

  it('should validate multiple periods', () => {
    const result = validateOperatingHours('9:00-13:00, 14:00-18:00');
    expect(result.valid).toBe(true);
  });

  it('should accept 24/7', () => {
    const result = validateOperatingHours('24/7');
    expect(result.valid).toBe(true);
  });

  it('should accept Closed', () => {
    const result = validateOperatingHours('Closed');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid time format', () => {
    const result = validateOperatingHours('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  it('should reject end time before start time', () => {
    const result = validateOperatingHours('18:00-9:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('before');
  });

  it('should reject invalid hours', () => {
    const result = validateOperatingHours('25:00-18:00');
    expect(result.valid).toBe(false);
  });

  it('should reject invalid minutes', () => {
    const result = validateOperatingHours('9:00-18:99');
    expect(result.valid).toBe(false);
  });

  it('should format operating hours correctly', () => {
    const result = formatOperatingHours('9:00-18:00, 14:00-22:00');
    expect(result).toBe('9:00-18:00, 14:00-22:00');
  });
});