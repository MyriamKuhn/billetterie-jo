/**
 * Representation of a user in the system.
 */
export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  created_at: string;
  updated_at: string | null;
  role: 'admin' | 'employee' | 'user';
  twofa_enabled: boolean;
  email_verified_at: string | null;
  is_active: boolean;
}