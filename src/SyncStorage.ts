import type { StorageBackend } from './backends/types';
import { AsyncStorageBackend } from './backends/AsyncStorageBackend';

type KeyType = string;

class SyncStorage {
  data: Map<any, any> = new Map();

  loading: boolean = true;

  private backend: StorageBackend | null = null;

  setBackend(backend: StorageBackend) {
    this.backend = backend;
  }

  private getBackend(): StorageBackend {
    if (!this.backend) {
      this.backend = new AsyncStorageBackend();
    }
    return this.backend;
  }

  init(): Promise<Array<any>> {
    return this.getBackend()
      .init()
      .then((data) => {
        data.forEach((item) => this.saveItem(item));
        return [...this.data];
      });
  }

  getItem(key: KeyType): any {
    return this.data.get(key);
  }

  setItem(key: KeyType, value: any): Promise<any> | void {
    if (!key) return Promise.resolve('error a key is not provided');

    this.data.set(key, value);
    return this.getBackend().setItem(key, JSON.stringify(value));
  }

  removeItem(key: KeyType): Promise<any> | void {
    if (!key) return Promise.resolve('error a key is not provided');

    this.data.delete(key);
    return this.getBackend().removeItem(key);
  }

  saveItem(item: Array<KeyType>) {
    let value;

    try {
      value = JSON.parse(item[1] ?? '{}');
    } catch (e) {
      console.log(e);
      [, value] = item;
    }

    this.data.set(item[0], value);
    this.loading = false;
  }

  getAllKeys(): Array<any> {
    return Array.from(this.data.keys());
  }

  clear(): Promise<void> | void {
    this.data.clear();
    return this.getBackend().clear();
  }
}

const syncStorage = new SyncStorage();

export default syncStorage;
