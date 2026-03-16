import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageBackend } from './types';

export class AsyncStorageBackend implements StorageBackend {
  async init(): Promise<[string, any][]> {
    const keys = await AsyncStorage.getAllKeys();
    const data = await AsyncStorage.multiGet(keys);
    return data as [string, any][];
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  clear(): Promise<void> {
    return AsyncStorage.clear();
  }
}
