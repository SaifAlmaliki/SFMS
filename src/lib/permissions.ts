/**
 * RBAC (Role-Based Access Control) utilities
 */

export type UserRole = 'Viewer' | 'Editor' | 'Admin';

export interface Permission {
  resource: string;
  actions: string[];
}

/**
 * Permission definitions for each role
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  Viewer: [
    { resource: 'policies', actions: ['read'] },
    { resource: 'tickets', actions: ['read'] },
    { resource: 'logs', actions: ['read'] },
    { resource: 'alerts', actions: ['read'] },
    { resource: 'compliance', actions: ['read'] },
  ],
  Editor: [
    { resource: 'policies', actions: ['read', 'create'] },
    { resource: 'tickets', actions: ['read', 'create', 'update'] },
    { resource: 'logs', actions: ['read'] },
    { resource: 'alerts', actions: ['read', 'acknowledge'] },
    { resource: 'compliance', actions: ['read'] },
  ],
  Admin: [
    { resource: 'policies', actions: ['read', 'create', 'update', 'delete', 'approve', 'deploy'] },
    { resource: 'tickets', actions: ['read', 'create', 'update', 'delete', 'approve', 'reject'] },
    { resource: 'logs', actions: ['read', 'export'] },
    { resource: 'alerts', actions: ['read', 'acknowledge', 'resolve', 'suppress'] },
    { resource: 'compliance', actions: ['read', 'export'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
};

/**
 * Check if a user role has permission for an action
 */
export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[role];
  const resourcePerm = permissions.find(p => p.resource === resource);
  
  if (!resourcePerm) return false;
  
  return resourcePerm.actions.includes(action) || resourcePerm.actions.includes('*');
}

/**
 * Check if user can approve policies/tickets
 */
export function canApprove(role: UserRole): boolean {
  return role === 'Admin';
}

/**
 * Check if user can create policies/tickets
 */
export function canCreate(role: UserRole): boolean {
  return role === 'Editor' || role === 'Admin';
}

/**
 * Check if user can deploy policies
 */
export function canDeploy(role: UserRole): boolean {
  return role === 'Admin';
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'Admin';
}

