export interface StorageBackend {
  /** Load all existing key-value pairs from persistent storage */
  init(): Promise<[string, any][]>;
  /** Persist a key-value pair */
  setItem(key: string, value: string): void | Promise<void>;
  /** Remove a key from persistent storage */
  removeItem(key: string): void | Promise<void>;
  /** Clear all data from persistent storage */
  clear(): void | Promise<void>;
}
