import { UserRole } from '@prisma/client';

// Define all permissions in the system
export enum Permission {
  // User management
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',

  // Order management
  ORDERS_READ_ALL = 'orders:read:all',
  ORDERS_READ_OWN = 'orders:read:own',
  ORDERS_WRITE = 'orders:write',
  ORDERS_UPDATE_STATE = 'orders:update_state',
  ORDERS_CANCEL = 'orders:cancel',

  // Product management
  PRODUCTS_READ = 'products:read',
  PRODUCTS_WRITE = 'products:write',
  PRODUCTS_DELETE = 'products:delete',

  // Wallet management
  WALLET_READ_ALL = 'wallet:read:all',
  WALLET_READ_OWN = 'wallet:read:own',
  WALLET_APPROVE_DEPOSIT = 'wallet:approve_deposit',
  WALLET_APPROVE_WITHDRAWAL = 'wallet:approve_withdrawal',
  WALLET_REQUEST_DEPOSIT = 'wallet:request_deposit',
  WALLET_REQUEST_WITHDRAWAL = 'wallet:request_withdrawal',

  // Supplier management
  SUPPLIERS_READ = 'suppliers:read',
  SUPPLIERS_WRITE = 'suppliers:write',
  SUPPLIERS_DELETE = 'suppliers:delete',

  // Shopify connection management
  SHOPIFY_READ_OWN = 'shopify:read:own',
  SHOPIFY_WRITE_OWN = 'shopify:write:own',
  SHOPIFY_READ_ALL = 'shopify:read:all',

  // Dropshipper profile management
  PROFILE_READ_OWN = 'profile:read:own',
  PROFILE_WRITE_OWN = 'profile:write:own',
  PROFILE_READ_ALL = 'profile:read:all',
  PROFILE_WRITE_ALL = 'profile:write:all',

  // Bank account management
  BANK_ACCOUNTS_READ_OWN = 'bank_accounts:read:own',
  BANK_ACCOUNTS_WRITE_OWN = 'bank_accounts:write:own',
  BANK_ACCOUNTS_READ_ALL = 'bank_accounts:read:all',

  // Analytics & Reports
  ANALYTICS_READ = 'analytics:read',
  REPORTS_READ = 'reports:read',
}

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to all resources
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_WRITE,
    Permission.ORDERS_UPDATE_STATE,
    Permission.ORDERS_CANCEL,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.WALLET_READ_ALL,
    Permission.WALLET_APPROVE_DEPOSIT,
    Permission.WALLET_APPROVE_WITHDRAWAL,
    Permission.SUPPLIERS_READ,
    Permission.SUPPLIERS_WRITE,
    Permission.SUPPLIERS_DELETE,
    Permission.SHOPIFY_READ_ALL,
    Permission.PROFILE_READ_ALL,
    Permission.PROFILE_WRITE_ALL,
    Permission.BANK_ACCOUNTS_READ_ALL,
    Permission.ANALYTICS_READ,
    Permission.REPORTS_READ,
  ],

  DROPSHIPPER: [
    // Own orders
    Permission.ORDERS_READ_OWN,
    Permission.ORDERS_WRITE,

    // Product catalog
    Permission.PRODUCTS_READ,

    // Own wallet
    Permission.WALLET_READ_OWN,
    Permission.WALLET_REQUEST_DEPOSIT,
    Permission.WALLET_REQUEST_WITHDRAWAL,

    // Suppliers (read-only)
    Permission.SUPPLIERS_READ,

    // Own Shopify connections
    Permission.SHOPIFY_READ_OWN,
    Permission.SHOPIFY_WRITE_OWN,

    // Own profile
    Permission.PROFILE_READ_OWN,
    Permission.PROFILE_WRITE_OWN,

    // Own bank accounts
    Permission.BANK_ACCOUNTS_READ_OWN,
    Permission.BANK_ACCOUNTS_WRITE_OWN,

    // Analytics for own data
    Permission.ANALYTICS_READ,
  ],

  SUPPORT: [
    // Read-only access to help customers
    Permission.ORDERS_READ_ALL,
    Permission.PRODUCTS_READ,
    Permission.SUPPLIERS_READ,
    Permission.PROFILE_READ_ALL,
    Permission.BANK_ACCOUNTS_READ_ALL,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user can access a resource owned by another user
 * Used for "own" resources like orders, wallet, etc.
 */
export function canAccessResource(
  role: UserRole,
  resourceOwnerId: string,
  currentUserId: string,
  readPermission: Permission,
  readOwnPermission: Permission
): boolean {
  // Admins and Support can access all resources
  if (hasPermission(role, readPermission)) {
    return true;
  }

  // Users can access their own resources
  if (resourceOwnerId === currentUserId && hasPermission(role, readOwnPermission)) {
    return true;
  }

  return false;
}

/**
 * Sub-roles for more granular access control (optional extension)
 * Can be stored in user metadata or a separate table
 */
export enum SubRole {
  // Admin sub-roles
  ADMIN_SUPER = 'admin:super',
  ADMIN_FINANCE = 'admin:finance',
  ADMIN_OPERATIONS = 'admin:operations',

  // Support sub-roles
  SUPPORT_L1 = 'support:l1',
  SUPPORT_L2 = 'support:l2',
  SUPPORT_MANAGER = 'support:manager',
}

/**
 * Additional permissions for sub-roles
 * This allows more granular control beyond the base role permissions
 */
const subRolePermissions: Record<SubRole, Permission[]> = {
  [SubRole.ADMIN_SUPER]: [
    // Full access (inherits all ADMIN permissions)
  ],

  [SubRole.ADMIN_FINANCE]: [
    // Finance-specific permissions
    Permission.WALLET_READ_ALL,
    Permission.WALLET_APPROVE_DEPOSIT,
    Permission.WALLET_APPROVE_WITHDRAWAL,
    Permission.REPORTS_READ,
  ],

  [SubRole.ADMIN_OPERATIONS]: [
    // Operations-specific permissions
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_UPDATE_STATE,
    Permission.PRODUCTS_READ,
    Permission.SUPPLIERS_READ,
  ],

  [SubRole.SUPPORT_L1]: [
    // Basic support permissions
    Permission.ORDERS_READ_ALL,
    Permission.PROFILE_READ_ALL,
  ],

  [SubRole.SUPPORT_L2]: [
    // Advanced support permissions
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_UPDATE_STATE,
    Permission.PROFILE_READ_ALL,
    Permission.BANK_ACCOUNTS_READ_ALL,
  ],

  [SubRole.SUPPORT_MANAGER]: [
    // Support manager permissions
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_UPDATE_STATE,
    Permission.PROFILE_READ_ALL,
    Permission.BANK_ACCOUNTS_READ_ALL,
    Permission.REPORTS_READ,
  ],
};

/**
 * Check if a sub-role has a specific permission
 */
export function hasSubRolePermission(subRole: SubRole, permission: Permission): boolean {
  const permissions = subRolePermissions[subRole] || [];
  return permissions.includes(permission);
}