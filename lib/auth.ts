/**
 * Simple admin authentication
 * TODO: Upgrade to Supabase Auth for production
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change this!

export function checkAdminAuth(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('admin_auth') === 'true';
}

export function setAdminAuth(authenticated: boolean) {
  if (typeof window === 'undefined') return;
  if (authenticated) {
    localStorage.setItem('admin_auth', 'true');
  } else {
    localStorage.removeItem('admin_auth');
  }
}
