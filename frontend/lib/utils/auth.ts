import { jwtDecode } from 'jwt-decode';
import type { UserResponse } from '@/types/api';

interface JwtPayload {
  nameid: string;
  email: string;
  role: string;
  employeeId: string;
  forcePasswordChange: string;
  saccoId?: string;
  exp: number;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'accessToken';
  private static readonly USER_KEY  = 'userData';
  static requiresPasswordChange: any;

  // ── Storage helpers ───────────────────────────────────────────────────────

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user: UserResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): UserResponse | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as UserResponse) : null;
    } catch {
      return null;
    }
  }

  // ── Token inspection ──────────────────────────────────────────────────────

  private static decodeToken(): JwtPayload | null {
    try {
      const token = this.getToken();
      if (!token) return null;
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  static isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded) return true;
    // decoded.exp is in seconds
    return decoded.exp * 1000 < Date.now();
  }

  /**
   * CRITICAL: only call this client-side (inside useEffect).
   * Returns true if token exists AND is not expired.
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false; // SSR — never redirect
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  // ── User info from JWT or stored user object ───────────────────────────────

  static getUserRole(): string | null {
    // Prefer stored user (cheaper than decoding JWT every time)
    const user = this.getUser();
    if (user?.role) return user.role;
    return this.decodeToken()?.role ?? null;
  }

  static getSaccoId(): string | null {
    const user = this.getUser();
    if (user?.saccoId) return user.saccoId;
    return this.decodeToken()?.saccoId ?? null;
  }

  static getUserId(): string | null {
    const user = this.getUser();
    if (user?.id) return user.id;
    return this.decodeToken()?.nameid ?? null;
  }

  static getEmployeeId(): string | null {
    const user = this.getUser();
    if (user?.employeeId) return user.employeeId;
    return this.decodeToken()?.employeeId ?? null;
  }

  // ── Session management ────────────────────────────────────────────────────

  /** Call this after successful login to persist everything */
  static saveSession(token: string, user: UserResponse): void {
    this.setToken(token);
    this.setUser(user);
    // Keep accessToken key in sync (used by axios interceptor)
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /** Clears all auth state — use for logout */
  static clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('tempEmail');
    localStorage.removeItem('tempToken');
  }

  /** Alias for clear() — some old code calls logout() */
  static logout(): void {
    this.clear();
  }
}

// ── Standalone helpers ────────────────────────────────────────────────────────

export const getSaccoId = (): string | null => AuthService.getSaccoId();

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};