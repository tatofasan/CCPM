import { PaymentType } from '@prisma/client'
import {
  detectPaymentType,
  getPaymentMethodDescription,
} from '@/lib/shopify/payment-detector'
import { ShopifyOrder } from '@/lib/shopify/client'

describe('Payment Detector', () => {
  describe('detectPaymentType', () => {
    it('should detect COD when payment gateway contains "Cash on Delivery"', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Cash on Delivery'],
        financial_status: 'pending',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.COD)
    })

    it('should detect COD when payment gateway contains "Manual Payment"', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Manual Payment Method'],
        financial_status: 'pending',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.COD)
    })

    it('should detect TC when payment gateway contains "Shopify Payments"', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['shopify_payments'],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should detect TC when payment gateway contains "Stripe"', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Stripe'],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should detect TC when payment gateway contains "Mercado Pago"', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Mercado Pago'],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should detect TC when financial status is paid with no gateway specified', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: [],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should detect COD when financial status is pending with no gateway', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: [],
        financial_status: 'pending',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.COD)
    })

    it('should detect TC when financial status is authorized even with unknown gateway', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Unknown Gateway'],
        financial_status: 'authorized',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should be case insensitive for payment gateway names', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['CASH ON DELIVERY'],
        financial_status: 'pending',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.COD)
    })

    it('should detect TC when payment gateway contains credit card', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Credit Card'],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.TC)
    })

    it('should prioritize COD indicators over TC indicators', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Cash on Delivery', 'Stripe'],
        financial_status: 'paid',
      } as ShopifyOrder

      expect(detectPaymentType(order as ShopifyOrder)).toBe(PaymentType.COD)
    })
  })

  describe('getPaymentMethodDescription', () => {
    it('should return formatted description for COD', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Cash on Delivery'],
        financial_status: 'pending',
      } as ShopifyOrder

      const description = getPaymentMethodDescription(order as ShopifyOrder)
      expect(description).toBe('COD (Cash on Delivery)')
    })

    it('should return formatted description for TC', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Stripe'],
        financial_status: 'paid',
      } as ShopifyOrder

      const description = getPaymentMethodDescription(order as ShopifyOrder)
      expect(description).toBe('TC (Stripe)')
    })

    it('should handle multiple payment gateways', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: ['Stripe', 'PayPal'],
        financial_status: 'paid',
      } as ShopifyOrder

      const description = getPaymentMethodDescription(order as ShopifyOrder)
      expect(description).toBe('TC (Stripe, PayPal)')
    })

    it('should handle no payment gateway', () => {
      const order: Partial<ShopifyOrder> = {
        payment_gateway_names: [],
        financial_status: 'pending',
      } as ShopifyOrder

      const description = getPaymentMethodDescription(order as ShopifyOrder)
      expect(description).toBe('Cash on Delivery (No gateway)')
    })
  })
})