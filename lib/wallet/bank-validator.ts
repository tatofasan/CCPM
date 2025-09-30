/**
 * Bank Account Validation Utilities
 *
 * Provides validation for Argentine banking information:
 * - CBU (Clave Bancaria Uniforme): 22-digit account identifier
 * - Bank aliases: alphanumeric identifiers with dots
 */

/**
 * Validates an Argentine CBU (Clave Bancaria Uniforme)
 *
 * CBU Format (22 digits):
 * - Bank Code: 3 digits (positions 0-2)
 * - Branch: 4 digits (positions 3-6)
 * - Verification Digit 1: 1 digit (position 7)
 * - Account Number: 13 digits (positions 8-20)
 * - Verification Digit 2: 1 digit (position 21)
 *
 * @param cbu - The CBU string to validate
 * @returns true if CBU is valid, false otherwise
 */
export function validateCBU(cbu: string): boolean {
  // Remove spaces and dashes for validation
  const cleaned = cbu.replace(/[\s-]/g, '');

  // Must be exactly 22 digits
  if (!/^\d{22}$/.test(cleaned)) {
    return false;
  }

  // Validate first verification digit (position 7)
  const firstBlock = cleaned.substring(0, 7);
  const firstVerifier = parseInt(cleaned.charAt(7), 10);

  if (!validateVerificationDigit(firstBlock, firstVerifier)) {
    return false;
  }

  // Validate second verification digit (position 21)
  const secondBlock = cleaned.substring(8, 21);
  const secondVerifier = parseInt(cleaned.charAt(21), 10);

  if (!validateVerificationDigit(secondBlock, secondVerifier)) {
    return false;
  }

  return true;
}

/**
 * Validates a verification digit using the modulo 10 algorithm
 * Used by Argentine CBU validation
 *
 * @param block - The block of digits to validate
 * @param verifier - The verification digit
 * @returns true if verification digit is correct
 */
function validateVerificationDigit(block: string, verifier: number): boolean {
  const weights = [3, 1, 7, 9, 3, 1, 7, 9, 3, 1, 7, 9, 3];
  let sum = 0;

  for (let i = 0; i < block.length; i++) {
    sum += parseInt(block.charAt(i), 10) * weights[i];
  }

  const remainder = sum % 10;
  const expectedVerifier = remainder === 0 ? 0 : 10 - remainder;

  return verifier === expectedVerifier;
}

/**
 * Validates a bank alias
 *
 * Format: word.word.word (e.g., "mi.alias.bancario")
 * Rules:
 * - Must contain exactly 2 dots (3 segments)
 * - Each segment must be 3-20 alphanumeric characters
 * - Case insensitive
 * - No special characters except dots
 *
 * @param alias - The alias string to validate
 * @returns true if alias is valid, false otherwise
 */
export function validateAlias(alias: string): boolean {
  // Check basic format: word.word.word
  const aliasRegex = /^[a-z0-9]{3,20}\.[a-z0-9]{3,20}\.[a-z0-9]{3,20}$/i;

  if (!aliasRegex.test(alias)) {
    return false;
  }

  // Additional validation: ensure no consecutive dots
  if (alias.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Formats a CBU for display (adds separators for readability)
 * Example: 2850590940090418135201 -> 285-059094-00904181352-01
 *
 * @param cbu - The CBU string to format
 * @returns Formatted CBU string
 */
export function formatCBU(cbu: string): string {
  const cleaned = cbu.replace(/[\s-]/g, '');

  if (cleaned.length !== 22) {
    return cbu; // Return original if invalid
  }

  // Format: XXX-XXXXXX-XXXXXXXXXXXXX-X
  return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 9)}-${cleaned.substring(9, 21)}-${cleaned.substring(21)}`;
}

/**
 * Validates account holder name
 *
 * Rules:
 * - Must be 2-100 characters
 * - Can contain letters, spaces, hyphens, and apostrophes
 * - Cannot be only spaces
 *
 * @param name - The account holder name
 * @returns true if name is valid, false otherwise
 */
export function validateAccountHolder(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    return false;
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/;

  return nameRegex.test(name);
}

/**
 * Validates bank name
 *
 * Rules:
 * - Must be 2-50 characters
 * - Can contain letters, spaces, and common punctuation
 *
 * @param name - The bank name
 * @returns true if name is valid, false otherwise
 */
export function validateBankName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.trim().length > 50) {
    return false;
  }

  return true;
}

/**
 * Account type enum
 */
export enum AccountType {
  SAVINGS = 'SAVINGS',
  CHECKING = 'CHECKING'
}

/**
 * Validates account type
 *
 * @param type - The account type
 * @returns true if type is valid, false otherwise
 */
export function validateAccountType(type: string): type is AccountType {
  return type === AccountType.SAVINGS || type === AccountType.CHECKING;
}

/**
 * Full bank account validation
 * Validates all required fields for a bank account
 *
 * @param data - Bank account data to validate
 * @returns Object with isValid boolean and errors array
 */
export interface BankAccountValidation {
  isValid: boolean;
  errors: string[];
}

export interface BankAccountData {
  cbu: string;
  alias?: string;
  accountHolder: string;
  accountType: string;
  bankName: string;
}

export function validateBankAccount(data: BankAccountData): BankAccountValidation {
  const errors: string[] = [];

  // Validate CBU
  if (!data.cbu || !validateCBU(data.cbu)) {
    errors.push('Invalid CBU format. Must be 22 digits with valid verification codes.');
  }

  // Validate alias (optional)
  if (data.alias && !validateAlias(data.alias)) {
    errors.push('Invalid alias format. Must be three alphanumeric segments separated by dots (e.g., mi.alias.bancario).');
  }

  // Validate account holder
  if (!data.accountHolder || !validateAccountHolder(data.accountHolder)) {
    errors.push('Invalid account holder name. Must be 2-100 characters.');
  }

  // Validate account type
  if (!data.accountType || !validateAccountType(data.accountType)) {
    errors.push('Invalid account type. Must be SAVINGS or CHECKING.');
  }

  // Validate bank name
  if (!data.bankName || !validateBankName(data.bankName)) {
    errors.push('Invalid bank name. Must be 2-50 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}