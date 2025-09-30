import { createSupplier, updateSupplier, deleteSupplier, getSupplier, listSuppliers } from '@/lib/suppliers/crud';
import { validateCUIT, formatCUIT } from '@/lib/suppliers/validation';
import { SupplierStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    supplier: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('Supplier CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSupplier', () => {
    it('should create a supplier with valid data', async () => {
      const mockSupplier = {
        id: 'test-id',
        code: 'SUP001',
        name: 'Test Supplier',
        cuit: '20-12345678-5',
        contactEmail: 'test@supplier.com',
        status: SupplierStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.create as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await createSupplier({
        code: 'SUP001',
        name: 'Test Supplier',
        cuit: '20-12345678-5',
        contactEmail: 'test@supplier.com',
      });

      expect(result).toEqual(mockSupplier);
      expect(prisma.supplier.create).toHaveBeenCalledWith({
        data: {
          code: 'SUP001',
          name: 'Test Supplier',
          cuit: '20-12345678-5',
          contactEmail: 'test@supplier.com',
          status: SupplierStatus.ACTIVE,
        },
      });
    });

    it('should reject invalid CUIT format', async () => {
      await expect(
        createSupplier({
          code: 'SUP001',
          name: 'Test Supplier',
          cuit: 'invalid-cuit',
        })
      ).rejects.toThrow('CUIT must follow format');
    });

    it('should reject duplicate code', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        createSupplier({
          code: 'SUP001',
          name: 'Test Supplier',
        })
      ).rejects.toThrow('already exists');
    });

    it('should reject invalid email', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        createSupplier({
          code: 'SUP001',
          name: 'Test Supplier',
          contactEmail: 'invalid-email',
        })
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier with valid data', async () => {
      const mockSupplier = {
        id: 'test-id',
        code: 'SUP001',
        name: 'Updated Supplier',
        cuit: null,
        contactEmail: null,
        status: SupplierStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.supplier.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.supplier.update as jest.Mock).mockResolvedValue(mockSupplier);

      const result = await updateSupplier('test-id', {
        name: 'Updated Supplier',
      });

      expect(result).toEqual(mockSupplier);
    });

    it('should throw error if supplier not found', async () => {
      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        updateSupplier('nonexistent-id', { name: 'Updated' })
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('deleteSupplier', () => {
    it('should soft delete supplier with products', async () => {
      const mockSupplier = {
        id: 'test-id',
        code: 'SUP001',
        name: 'Test Supplier',
        cuit: null,
        contactEmail: null,
        status: SupplierStatus.ACTIVE,
        products: [{ id: 'product-1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.supplier.update as jest.Mock).mockResolvedValue({
        ...mockSupplier,
        status: SupplierStatus.INACTIVE,
      });

      const result = await deleteSupplier('test-id');

      expect(result.status).toBe(SupplierStatus.INACTIVE);
      expect(prisma.supplier.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { status: SupplierStatus.INACTIVE },
      });
    });

    it('should hard delete supplier without products', async () => {
      const mockSupplier = {
        id: 'test-id',
        code: 'SUP001',
        name: 'Test Supplier',
        cuit: null,
        contactEmail: null,
        status: SupplierStatus.ACTIVE,
        products: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.supplier.findUnique as jest.Mock).mockResolvedValue(mockSupplier);
      (prisma.supplier.delete as jest.Mock).mockResolvedValue(mockSupplier);

      await deleteSupplier('test-id');

      expect(prisma.supplier.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });
  });
});

describe('CUIT Validation', () => {
  it('should validate correct CUIT format', () => {
    const result = validateCUIT('20-12345678-5');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid CUIT format', () => {
    const result = validateCUIT('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  it('should reject CUIT without hyphens', () => {
    const result = validateCUIT('20123456785');
    expect(result.valid).toBe(false);
  });

  it('should format CUIT correctly', () => {
    const result = formatCUIT('20123456785');
    expect(result).toBe('20-12345678-5');
  });
});