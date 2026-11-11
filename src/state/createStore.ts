import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(listener: () => void): () => void;
}

/** A very small observable store, so the app needs no state library. */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Subscribe a component to one slice of a store.
 * The selector must return a value held in the store (not a new array or object),
 * otherwise the component re-renders on every change.
 */
export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}
