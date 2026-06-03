import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Gradient palette for user avatars. */
export const AVATAR_COLORS = [
  'linear-gradient(135deg, #4a90f2 0%, #7b6cf0 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
];

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string; // emoji, or '' to fall back to the name initial
  color: string;  // one of AVATAR_COLORS
  createdAt: number;
}

interface StoredUser extends User {
  salt: string;
  passwordHash: string;
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthState {
  users: Record<string, StoredUser>;
  currentUserId: string | null;

  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'email' | 'avatar' | 'color'>>) => Result;
  changePassword: (current: string, next: string) => Promise<Result>;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function findByEmail(users: Record<string, StoredUser>, email: string): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  return Object.values(users).find((u) => u.email.toLowerCase() === e);
}

/** Strip secret fields before exposing a user to the UI. */
export function publicUser(u: StoredUser): User {
  const { salt: _salt, passwordHash: _hash, ...rest } = u;
  return rest;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: {},
      currentUserId: null,

      async register(name, email, password) {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        if (cleanName.length < 2) return { ok: false, error: 'Enter your name (at least 2 characters).' };
        if (!EMAIL_RE.test(cleanEmail)) return { ok: false, error: 'Enter a valid email address.' };
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        if (findByEmail(get().users, cleanEmail)) {
          return { ok: false, error: 'An account with this email already exists.' };
        }

        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        const id = uid();
        const user: StoredUser = {
          id,
          name: cleanName,
          email: cleanEmail,
          avatar: '',
          color: AVATAR_COLORS[Object.keys(get().users).length % AVATAR_COLORS.length],
          createdAt: Date.now(),
          salt,
          passwordHash,
        };
        set((s) => ({ users: { ...s.users, [id]: user }, currentUserId: id }));
        return { ok: true };
      },

      async login(email, password) {
        const user = findByEmail(get().users, email);
        if (!user) return { ok: false, error: 'No account found for this email.' };
        const hash = await hashPassword(password, user.salt);
        if (hash !== user.passwordHash) return { ok: false, error: 'Incorrect password.' };
        set({ currentUserId: user.id });
        return { ok: true };
      },

      logout() {
        set({ currentUserId: null });
      },

      updateProfile(patch) {
        const id = get().currentUserId;
        if (!id) return { ok: false, error: 'Not signed in.' };
        const current = get().users[id];

        if (patch.name !== undefined && patch.name.trim().length < 2) {
          return { ok: false, error: 'Name must be at least 2 characters.' };
        }
        if (patch.email !== undefined) {
          const e = patch.email.trim();
          if (!EMAIL_RE.test(e)) return { ok: false, error: 'Enter a valid email address.' };
          const clash = findByEmail(get().users, e);
          if (clash && clash.id !== id) return { ok: false, error: 'That email is already in use.' };
        }

        const next: StoredUser = {
          ...current,
          ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
          ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
          ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
          ...(patch.color !== undefined ? { color: patch.color } : {}),
        };
        set((s) => ({ users: { ...s.users, [id]: next } }));
        return { ok: true };
      },

      async changePassword(current, next) {
        const id = get().currentUserId;
        if (!id) return { ok: false, error: 'Not signed in.' };
        const user = get().users[id];
        const currentHash = await hashPassword(current, user.salt);
        if (currentHash !== user.passwordHash) return { ok: false, error: 'Current password is incorrect.' };
        if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
        const salt = randomSalt();
        const passwordHash = await hashPassword(next, salt);
        set((s) => ({ users: { ...s.users, [id]: { ...user, salt, passwordHash } } }));
        return { ok: true };
      },
    }),
    { name: 'notion-clone-auth' }
  )
);

/**
 * Hook returning the signed-in user, or null.
 * Selects the stored object directly so the reference stays stable across
 * unrelated renders (avoids the useSyncExternalStore "new snapshot" loop).
 * The UI only ever reads public fields.
 */
export function useCurrentUser(): User | null {
  return useAuth((s) => (s.currentUserId ? s.users[s.currentUserId] : null));
}
