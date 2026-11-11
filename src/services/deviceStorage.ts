import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Browser demo sessions are memory-only; never put refresh credentials in localStorage.
const memory = new Map<string, string>();
export const deviceStorage = {
  async get(key: string): Promise<string | null> {
    return Platform.OS === 'web' ? memory.get(key) ?? null : SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') memory.set(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') memory.delete(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
