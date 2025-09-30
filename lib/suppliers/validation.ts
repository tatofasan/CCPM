/**
 * Validates Argentine CUIT format: ##-########-#
 * CUIT is the Argentine tax identification number (Clave Única de Identificación Tributaria)
 *
 * @param cuit The CUIT string to validate
 * @returns Object with validation result and optional error message
 */
export function validateCUIT(cuit: string): { valid: boolean; error?: string } {
  if (!cuit || typeof cuit !== 'string') {
    return { valid: false, error: 'CUIT is required' };
  }

  // Remove any whitespace
  const cleanedCuit = cuit.trim();

  // Check format: ##-########-#
  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;

  if (!cuitRegex.test(cleanedCuit)) {
    return {
      valid: false,
      error: 'CUIT must follow format ##-########-# (e.g., 20-12345678-9)'
    };
  }

  // Extract the numbers without hyphens for checksum validation
  const numbersOnly = cleanedCuit.replace(/-/g, '');

  // Validate checksum digit
  const isValidChecksum = validateCUITChecksum(numbersOnly);

  if (!isValidChecksum) {
    return {
      valid: false,
      error: 'Invalid CUIT checksum digit'
    };
  }

  return { valid: true };
}

/**
 * Validates the CUIT checksum digit using the Modulo 11 algorithm
 *
 * @param cuit 11-digit CUIT string without hyphens
 * @returns true if checksum is valid
 */
function validateCUITChecksum(cuit: string): boolean {
  if (cuit.length !== 11) {
    return false;
  }

  // Multipliers for each position (from right to left, excluding check digit)
  const multipliers = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5];

  // Get the first 10 digits
  const digits = cuit.substring(0, 10).split('').map(Number);

  // Calculate weighted sum
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * multipliers[i];
  }

  // Calculate expected check digit
  let remainder = sum % 11;
  let expectedCheckDigit = 11 - remainder;

  // Special cases
  if (expectedCheckDigit === 11) {
    expectedCheckDigit = 0;
  } else if (expectedCheckDigit === 10) {
    expectedCheckDigit = 9;
  }

  // Compare with actual check digit
  const actualCheckDigit = parseInt(cuit.charAt(10), 10);

  return expectedCheckDigit === actualCheckDigit;
}

/**
 * Formats a CUIT string by adding hyphens if needed
 *
 * @param cuit CUIT string with or without hyphens
 * @returns Formatted CUIT string in format ##-########-#
 */
export function formatCUIT(cuit: string): string {
  if (!cuit) return '';

  // Remove all hyphens
  const numbersOnly = cuit.replace(/-/g, '');

  // Check if we have the right number of digits
  if (numbersOnly.length !== 11) {
    return cuit; // Return as-is if invalid length
  }

  // Format: ##-########-#
  return `${numbersOnly.substring(0, 2)}-${numbersOnly.substring(2, 10)}-${numbersOnly.charAt(10)}`;
}

/**
 * Validates email format
 *
 * @param email Email string to validate
 * @returns Object with validation result and optional error message
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}