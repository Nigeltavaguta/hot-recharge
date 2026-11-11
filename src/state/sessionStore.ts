import type { User } from '@/models';

import { createStore } from './createStore';

interface SessionState {
  user: User | null;
  restoreError: string | null;
}

/** Who is signed in. Held in memory only until real auth and secure storage are added. */
export const sessionStore = createStore<SessionState>({ user: null, restoreError: null });

export function signIn(user: User): void {
  sessionStore.set({ user, restoreError: null });
}

export function signOut(): void {
  sessionStore.set({ user: null });
}
