import { OrderState, PaymentType, Prisma } from '@prisma/client'
import {
  mapShopifyOrderToDatabase,
  validateShopifyOrder,
} from '@/lib/shopify/order-mapper'
import { ShopifyOrder } from '@/lib/shopify/client'
import { prisma } from '@/lib/prisma'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dropshipperProfile: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
  },
}))

describe('Order Mapper', () => {
  const mockDropshipperId = 'dropshipper_123'
  const mockConnectionId = 'connection_123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateShopifyOrder', () => {
    it('should validate a complete order', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        name: '#1001',
        email: 'customer@example.com',
        total_price: '150.00',
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address1: 'Av. Corrientes 1234',
          address2: null,
          city: 'Buenos Aires',
          province: 'Buenos Aires',
          zip: 'C1043',
          country: 'Argentina',
          phone: '+54911234567',
        },
        line_items: [
          {
            id: 1,
            product_id: 456,
            variant_id: 789,
            title: 'Product Name',
            sku: 'SKU001',
            quantity: 2,
            price: '70.00',
          },
        ],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing order ID', () => {
      const order: Partial<ShopifyOrder> = {
        name: '#1001',
        total_price: '150.00',
        line_items: [],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Order ID is missing')
    })

    it('should detect missing line items', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        total_price: '150.00',
        line_items: [],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Order has no line items')
    })

    it('should detect missing total price', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        line_items: [
          {
            id: 1,
            product_id: 456,
            variant_id: 789,
            title: 'Product',
            sku: 'SKU001',
            quantity: 1,
            price: '50.00',
          },
        ],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Total price is missing')
    })

    it('should detect invalid total price', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        total_price: 'invalid',
        shipping_address: {} as any,
        line_items: [
          {
            id: 1,
            product_id: 456,
            variant_id: 789,
            title: 'Product',
            sku: 'SKU001',
            quantity: 1,
            price: '50.00',
          },
        ],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Invalid total price')
    })

    it('should detect line item missing SKU', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        total_price: '50.00',
        shipping_address: {} as any,
        line_items: [
          {
            id: 1,
            product_id: 456,
            variant_id: 789,
            title: 'Product',
            sku: '',
            quantity: 1,
            price: '50.00',
          },
        ],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Line item 1 is missing SKU')
    })

    it('should detect line item with invalid quantity', () => {
      const order: Partial<ShopifyOrder> = {
        id: 123456,
        total_price: '50.00',
        shipping_address: {} as any,
        line_items: [
          {
            id: 1,
            product_id: 456,
            variant_id: 789,
            title: 'Product',
            sku: 'SKU001',
            quantity: 0,
            price: '50.00',
          },
        ],
      } as ShopifyOrder

      const validation = validateShopifyOrder(order as ShopifyOrder)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Line item 1 has invalid quantity')
    })
  })

  describe('mapShopifyOrderToDatabase', () => {
    const mockShopifyOrder: ShopifyOrder = {
      id: 123456,
      name: '#1001',
      email: 'customer@example.com',
      created_at: '2025-09-30T12:00:00Z',
      total_price: '150.00',
      currency: 'ARS',
      financial_status: 'paid',
      fulfillment_status: null,
      customer: {
        id: 789,
        email: 'customer@example.com',
        first_name: 'John',
        last_name: 'Doe',
      },
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: 'Av. Corrientes 1234',
        address2: 'Piso 5 Depto B',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        country: 'Argentina',
        zip: 'C1043',
        phone: '+54911234567',
      },
      line_items: [
        {
          id: 1,
          product_id: 456,
          variant_id: 789,
          title: 'Product Name',
          quantity: 2,
          price: '70.00',
          sku: 'SKU001',
        },
      ],
      payment_gateway_names: ['Stripe'],
      total_shipping_price_set: {
        shop_money: {
          amount: '10.00',
          currency_code: 'ARS',
        },
      },
    }

    it('should successfully map a complete order', async () => {
      // Mock dropshipper profile lookup
      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.15),
      })

      // Mock product lookup
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product_123',
        name: 'Product Name',
        sku: 'SKU001',
      })

      const result = await mapShopifyOrderToDatabase(
        mockShopifyOrder,
        mockConnectionId,
        mockDropshipperId,
      )

      expect(result.order).toBeDefined()
      expect(result.order.shopifyOrderId).toBe('123456')
      expect(result.order.storeId).toBe(mockConnectionId)
      expect(result.order.dropshipperId).toBe(mockDropshipperId)
      expect(result.order.customerName).toBe('John Doe')
      expect(result.order.customerEmail).toBe('customer@example.com')
      expect(result.order.paymentType).toBe(PaymentType.TC)
      expect(result.order.state).toBe(OrderState.PENDING)
      expect(Number(result.order.totalAmount)).toBe(150)
      expect(Number(result.order.productCost)).toBe(140)
      expect(Number(result.order.shippingCost)).toBe(10)
      expect(Number(result.order.commissionAmount)).toBe(21) // 140 * 0.15
      expect(result.order.items).toHaveLength(1)
    })

    it('should handle missing product gracefully without strict matching', async () => {
      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.15),
      })

      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        mapShopifyOrderToDatabase(
          mockShopifyOrder,
          mockConnectionId,
          mockDropshipperId,
          { strictProductMatching: false },
        ),
      ).rejects.toThrow('No valid line items could be mapped')
    })

    it('should throw error when dropshipper not found', async () => {
      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        mapShopifyOrderToDatabase(
          mockShopifyOrder,
          mockConnectionId,
          mockDropshipperId,
        ),
      ).rejects.toThrow('Dropshipper profile not found')
    })

    it('should extract customer name from shipping address if customer object missing', async () => {
      const orderWithoutCustomer = {
        ...mockShopifyOrder,
        customer: undefined,
      }

      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.15),
      })

      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product_123',
        name: 'Product Name',
        sku: 'SKU001',
      })

      const result = await mapShopifyOrderToDatabase(
        orderWithoutCustomer as ShopifyOrder,
        mockConnectionId,
        mockDropshipperId,
      )

      expect(result.order.customerName).toBe('John Doe')
    })

    it('should calculate commission based on dropshipper rate', async () => {
      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.20), // 20% commission
      })

      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product_123',
        name: 'Product Name',
        sku: 'SKU001',
      })

      const result = await mapShopifyOrderToDatabase(
        mockShopifyOrder,
        mockConnectionId,
        mockDropshipperId,
      )

      // Product cost is 140, commission should be 140 * 0.20 = 28
      expect(Number(result.order.commissionAmount)).toBe(28)
    })

    it('should parse and validate shipping address', async () => {
      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.15),
      })

      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product_123',
        name: 'Product Name',
        sku: 'SKU001',
      })

      const result = await mapShopifyOrderToDatabase(
        mockShopifyOrder,
        mockConnectionId,
        mockDropshipperId,
      )

      const address = result.order.shippingAddress as any
      expect(address.street).toBe('Av. Corrientes')
      expect(address.number).toBe('1234')
      expect(address.floor).toBe('5')
      expect(address.apartment).toBe('B')
      expect(address.city).toBe('Buenos Aires')
    })

    it('should include warnings for address issues', async () => {
      const orderWithIncompleteAddress = {
        ...mockShopifyOrder,
        shipping_address: {
          ...mockShopifyOrder.shipping_address,
          zip: '',
          phone: '',
        },
      }

      ;(prisma.dropshipperProfile.findUnique as jest.Mock).mockResolvedValue({
        id: mockDropshipperId,
        commissionRate: new Prisma.Decimal(0.15),
      })

      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'product_123',
        name: 'Product Name',
        sku: 'SKU001',
      })

      const result = await mapShopifyOrderToDatabase(
        orderWithIncompleteAddress as ShopifyOrder,
        mockConnectionId,
        mockDropshipperId,
      )

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some((w) => w.includes('Postal code'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('Phone number'))).toBe(true)
    })
  })
})