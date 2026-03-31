export interface MMKV {
  getAllKeys(): string[];
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  remove(key: string): void;
  clearAll(): void;
}

export interface MMKVConfiguration {
  id?: string;
  encryptionKey?: string;
}

export function createMMKV(config?: MMKVConfiguration): MMKV;
