export type UserRole = 'admin' | 'operator' | 'viewer';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operario',
  viewer: 'Visor',
};
