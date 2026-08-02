export const STAFF_ROLES = ['admin', 'desarrollo', 'laboratorio', 'administracion', 'atencion_cliente'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && STAFF_ROLES.includes(role as StaffRole)
}
