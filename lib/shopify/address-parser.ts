import { ShopifyOrder } from './client'

/**
 * Parsed shipping address structure matching database JSONB schema
 */
export interface ParsedAddress {
  street: string
  number: string
  floor?: string
  apartment?: string
  city: string
  province: string
  postal_code: string
  country: string
  phone?: string
  additional_info?: string
}

/**
 * Address validation result
 */
export interface AddressValidation {
  isValid: boolean
  missingFields: string[]
  warnings: string[]
}

/**
 * Parse Shopify shipping address to database format
 *
 * Extracts structured address from Shopify's address1 and address2 fields
 * Common patterns:
 * - "Av. Corrientes 1234" → street: "Av. Corrientes", number: "1234"
 * - "Calle Falsa 123" → street: "Calle Falsa", number: "123"
 * - "Piso 5 Depto B" in address2 → floor: "5", apartment: "B"
 * - "5to piso, Depto 10" → floor: "5", apartment: "10"
 *
 * @param shopifyOrder - The Shopify order containing shipping address
 * @returns ParsedAddress - Structured address object
 */
export function parseShippingAddress(
  shopifyOrder: ShopifyOrder,
): ParsedAddress {
  const shippingAddress = shopifyOrder.shipping_address

  if (!shippingAddress) {
    throw new Error('Shipping address is missing from order')
  }

  // Parse address1 to extract street and number
  const { street, number } = parseStreetAddress(shippingAddress.address1)

  // Parse address2 for floor and apartment
  const { floor, apartment, additionalInfo } = parseAddressLine2(
    shippingAddress.address2,
  )

  return {
    street,
    number,
    floor,
    apartment,
    city: shippingAddress.city || '',
    province: shippingAddress.province || '',
    postal_code: shippingAddress.zip || '',
    country: shippingAddress.country || '',
    phone: shippingAddress.phone || undefined,
    additional_info: additionalInfo || undefined,
  }
}

/**
 * Parse street address line to extract street name and number
 *
 * Handles patterns like:
 * - "Av. Corrientes 1234" → {street: "Av. Corrientes", number: "1234"}
 * - "Calle Falsa 123 bis" → {street: "Calle Falsa", number: "123 bis"}
 * - "San Martin 456" → {street: "San Martin", number: "456"}
 *
 * @param address1 - The first address line from Shopify
 * @returns Object with street and number
 */
function parseStreetAddress(address1: string): {
  street: string
  number: string
} {
  if (!address1) {
    return { street: '', number: '' }
  }

  const trimmed = address1.trim()

  // Pattern 1: Try to match street name followed by number
  // Matches: "Calle Falsa 123", "Av. Corrientes 1234 bis", "San Martin 456"
  const pattern1 = /^(.+?)\s+(\d+[a-zA-Z]*(?:\s+bis)?)$/i
  const match1 = trimmed.match(pattern1)

  if (match1) {
    return {
      street: match1[1].trim(),
      number: match1[2].trim(),
    }
  }

  // Pattern 2: Try to match with explicit number keyword
  // Matches: "Calle Falsa número 123", "Av. Corrientes n° 1234"
  const pattern2 = /^(.+?)\s+(?:n[úu]mero|n[°º])\s+(\d+[a-zA-Z]*)$/i
  const match2 = trimmed.match(pattern2)

  if (match2) {
    return {
      street: match2[1].trim(),
      number: match2[2].trim(),
    }
  }

  // Pattern 3: If no number found, treat entire address as street
  // Last resort for addresses like "Edificio Central"
  return {
    street: trimmed,
    number: '',
  }
}

/**
 * Parse second address line to extract floor, apartment, and additional info
 *
 * Handles patterns like:
 * - "Piso 5 Depto B" → {floor: "5", apartment: "B"}
 * - "5to piso, Depto 10" → {floor: "5", apartment: "10"}
 * - "Depto 3A" → {apartment: "3A"}
 * - "Timbre 2" → {additionalInfo: "Timbre 2"}
 *
 * @param address2 - The second address line from Shopify (optional)
 * @returns Object with floor, apartment, and additional info
 */
function parseAddressLine2(
  address2: string | null,
): {
  floor?: string
  apartment?: string
  additionalInfo?: string
} {
  if (!address2) {
    return {}
  }

  const trimmed = address2.trim()
  const result: {
    floor?: string
    apartment?: string
    additionalInfo?: string
  } = {}

  // Extract floor (piso)
  const floorPattern =
    /(?:piso|pº|p(?!\w))\s*(\d+)|(\d+)[°º]?\s*piso|(\d+)(?:st|nd|rd|th|to|do|ro)\s*piso/gi
  const floorMatch = floorPattern.exec(trimmed)

  if (floorMatch) {
    // Get the captured number from any of the capture groups
    const floorNumber = floorMatch[1] || floorMatch[2] || floorMatch[3]
    if (floorNumber) {
      result.floor = floorNumber
    }
  }

  // Extract apartment/department (depto, dpto, departamento)
  const aptPattern =
    /(?:depto?|departamento|dto|apt|apartment)\s*[:\-]?\s*([a-zA-Z0-9]+)/i
  const aptMatch = aptPattern.exec(trimmed)

  if (aptMatch) {
    result.apartment = aptMatch[1].trim()
  }

  // If no structured info found, store entire line as additional info
  if (!result.floor && !result.apartment && trimmed) {
    result.additionalInfo = trimmed
  }

  return result
}

/**
 * Validate parsed address completeness
 *
 * Checks for required fields and provides warnings for incomplete data
 *
 * @param address - Parsed address to validate
 * @returns AddressValidation - Validation result with missing fields and warnings
 */
export function validateAddress(address: ParsedAddress): AddressValidation {
  const missingFields: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!address.street) missingFields.push('street')
  if (!address.city) missingFields.push('city')
  if (!address.province) missingFields.push('province')
  if (!address.country) missingFields.push('country')

  // Warnings for recommended fields
  if (!address.number) warnings.push('Street number is missing')
  if (!address.postal_code) warnings.push('Postal code is missing')
  if (!address.phone) warnings.push('Phone number is missing')

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  }
}

/**
 * Format parsed address as a single-line string for display
 *
 * @param address - Parsed address object
 * @returns string - Formatted address
 */
export function formatAddress(address: ParsedAddress): string {
  const parts: string[] = []

  // Street and number
  if (address.street) {
    parts.push(address.street)
    if (address.number) {
      parts[parts.length - 1] += ` ${address.number}`
    }
  }

  // Floor and apartment
  const floorApt: string[] = []
  if (address.floor) floorApt.push(`Piso ${address.floor}`)
  if (address.apartment) floorApt.push(`Depto ${address.apartment}`)
  if (floorApt.length > 0) {
    parts.push(floorApt.join(' '))
  }

  // City, province, postal code
  const cityProvince: string[] = []
  if (address.city) cityProvince.push(address.city)
  if (address.province) cityProvince.push(address.province)
  if (cityProvince.length > 0) {
    let locationStr = cityProvince.join(', ')
    if (address.postal_code) {
      locationStr += ` (${address.postal_code})`
    }
    parts.push(locationStr)
  } else if (address.postal_code) {
    parts.push(`(${address.postal_code})`)
  }

  // Country
  if (address.country) parts.push(address.country)

  return parts.join(', ')
}

/**
 * Use billing address as fallback when shipping address is missing
 *
 * Note: Currently Shopify orders don't expose billing_address in the webhook payload
 * This function is prepared for future use or manual order imports
 *
 * @param shopifyOrder - The Shopify order
 * @returns ParsedAddress - Parsed address from available source
 */
export function getAddressWithFallback(
  shopifyOrder: ShopifyOrder,
): ParsedAddress {
  try {
    return parseShippingAddress(shopifyOrder)
  } catch (error) {
    throw new Error(
      'Cannot parse address: both shipping and billing address are missing',
    )
  }
}