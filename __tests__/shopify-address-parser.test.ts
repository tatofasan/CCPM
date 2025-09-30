import {
  parseShippingAddress,
  validateAddress,
  formatAddress,
  ParsedAddress,
} from '@/lib/shopify/address-parser'
import { ShopifyOrder } from '@/lib/shopify/client'

describe('Address Parser', () => {
  describe('parseShippingAddress', () => {
    it('should parse a complete Argentinian address', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address1: 'Av. Corrientes 1234',
          address2: 'Piso 5 Depto B',
          city: 'Buenos Aires',
          province: 'Buenos Aires',
          zip: 'C1043',
          country: 'Argentina',
          phone: '+54911234567',
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)

      expect(parsed.street).toBe('Av. Corrientes')
      expect(parsed.number).toBe('1234')
      expect(parsed.floor).toBe('5')
      expect(parsed.apartment).toBe('B')
      expect(parsed.city).toBe('Buenos Aires')
      expect(parsed.province).toBe('Buenos Aires')
      expect(parsed.postal_code).toBe('C1043')
      expect(parsed.country).toBe('Argentina')
      expect(parsed.phone).toBe('+54911234567')
    })

    it('should parse address without floor and apartment', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Jane',
          last_name: 'Smith',
          address1: 'San Martin 456',
          address2: null,
          city: 'Rosario',
          province: 'Santa Fe',
          zip: '2000',
          country: 'Argentina',
          phone: '+54341234567',
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)

      expect(parsed.street).toBe('San Martin')
      expect(parsed.number).toBe('456')
      expect(parsed.floor).toBeUndefined()
      expect(parsed.apartment).toBeUndefined()
      expect(parsed.city).toBe('Rosario')
    })

    it('should parse address with "bis" suffix', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle Falsa 123 bis',
          address2: null,
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)

      expect(parsed.street).toBe('Calle Falsa')
      expect(parsed.number).toBe('123 bis')
    })

    it('should parse floor with "Piso" keyword', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle 123',
          address2: 'Piso 3',
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.floor).toBe('3')
    })

    it('should parse floor with ordinal suffix', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle 123',
          address2: '5to piso',
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.floor).toBe('5')
    })

    it('should parse apartment/department info', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle 123',
          address2: 'Depto A',
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.apartment).toBe('A')
    })

    it('should parse apartment with number', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle 123',
          address2: 'Departamento 3B',
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.apartment).toBe('3B')
    })

    it('should store unstructured address2 as additional_info', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Calle 123',
          address2: 'Timbre 2, Casa verde',
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.additional_info).toBe('Timbre 2, Casa verde')
    })

    it('should parse address with standard number format', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Av. Libertador 5000',
          address2: null,
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.street).toBe('Av. Libertador')
      expect(parsed.number).toBe('5000')
    })

    it('should handle address without number', () => {
      const order: Partial<ShopifyOrder> = {
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address1: 'Edificio Central',
          address2: null,
          city: 'Ciudad',
          province: 'Provincia',
          zip: '1000',
          country: 'Argentina',
          phone: null,
        },
      } as ShopifyOrder

      const parsed = parseShippingAddress(order as ShopifyOrder)
      expect(parsed.street).toBe('Edificio Central')
      expect(parsed.number).toBe('')
    })

    it('should throw error when shipping address is missing', () => {
      const order: Partial<ShopifyOrder> = {} as ShopifyOrder

      expect(() => parseShippingAddress(order as ShopifyOrder)).toThrow(
        'Shipping address is missing from order',
      )
    })
  })

  describe('validateAddress', () => {
    it('should validate complete address as valid', () => {
      const address: ParsedAddress = {
        street: 'Av. Corrientes',
        number: '1234',
        floor: '5',
        apartment: 'B',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        postal_code: 'C1043',
        country: 'Argentina',
        phone: '+54911234567',
      }

      const validation = validateAddress(address)

      expect(validation.isValid).toBe(true)
      expect(validation.missingFields).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const address: ParsedAddress = {
        street: '',
        number: '1234',
        city: '',
        province: 'Buenos Aires',
        postal_code: 'C1043',
        country: '',
      }

      const validation = validateAddress(address)

      expect(validation.isValid).toBe(false)
      expect(validation.missingFields).toContain('street')
      expect(validation.missingFields).toContain('city')
      expect(validation.missingFields).toContain('country')
    })

    it('should warn about missing recommended fields', () => {
      const address: ParsedAddress = {
        street: 'Av. Corrientes',
        number: '',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        postal_code: '',
        country: 'Argentina',
      }

      const validation = validateAddress(address)

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toContain('Street number is missing')
      expect(validation.warnings).toContain('Postal code is missing')
      expect(validation.warnings).toContain('Phone number is missing')
    })
  })

  describe('formatAddress', () => {
    it('should format complete address', () => {
      const address: ParsedAddress = {
        street: 'Av. Corrientes',
        number: '1234',
        floor: '5',
        apartment: 'B',
        city: 'Buenos Aires',
        province: 'Buenos Aires',
        postal_code: 'C1043',
        country: 'Argentina',
        phone: '+54911234567',
      }

      const formatted = formatAddress(address)

      expect(formatted).toBe(
        'Av. Corrientes 1234, Piso 5 Depto B, Buenos Aires, Buenos Aires (C1043), Argentina',
      )
    })

    it('should format address without floor and apartment', () => {
      const address: ParsedAddress = {
        street: 'San Martin',
        number: '456',
        city: 'Rosario',
        province: 'Santa Fe',
        postal_code: '2000',
        country: 'Argentina',
      }

      const formatted = formatAddress(address)

      expect(formatted).toBe('San Martin 456, Rosario, Santa Fe (2000), Argentina')
    })

    it('should format address with only floor', () => {
      const address: ParsedAddress = {
        street: 'Calle Falsa',
        number: '123',
        floor: '3',
        city: 'Ciudad',
        province: 'Provincia',
        postal_code: '1000',
        country: 'Argentina',
      }

      const formatted = formatAddress(address)

      expect(formatted).toBe('Calle Falsa 123, Piso 3, Ciudad, Provincia (1000), Argentina')
    })
  })
})