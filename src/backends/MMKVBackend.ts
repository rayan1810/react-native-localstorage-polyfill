import { MMKV } from 'react-native-mmkv';
import type { StorageBackend } from './types';

export class MMKVBackend implements StorageBackend {
  private mmkv: MMKV;

  constructor(mmkvInstance?: MMKV) {
    this.mmkv = mmkvInstance ?? new MMKV();
  }

  async init(): Promise<[string, any][]> {
    const keys = this.mmkv.getAllKeys();
    return keys.map((key: string) => [key, this.mmkv.getString(key) ?? null]);
  }

  setItem(key: string, value: string): void {
    this.mmkv.set(key, value);
  }

  removeItem(key: string): void {
    this.mmkv.delete(key);
  }

  clear(): void {
    this.mmkv.clearAll();
  }
}
