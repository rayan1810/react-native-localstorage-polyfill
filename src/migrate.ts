import type { StorageBackend } from './backends/types';

/**
 * Migrates all data from one storage backend to another.
 * Typically used to migrate from AsyncStorage to MMKV.
 *
 * @example
 * ```ts
 * import { migrateStorage, AsyncStorageBackend } from 'react-native-localstorage-polyfill';
 * import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';
 *
 * const mmkvBackend = new MMKVBackend();
 * await migrateStorage({
 *   from: new AsyncStorageBackend(),
 *   to: mmkvBackend,
 *   deleteAfterMigration: true,
 * });
 * ```
 */
export async function migrateStorage(options: {
  from: StorageBackend;
  to: StorageBackend;
  deleteAfterMigration?: boolean;
}): Promise<{ migratedKeys: number }> {
  const { from, to, deleteAfterMigration = false } = options;

  const data = await from.init();

  for (const [key, value] of data) {
    if (key && value != null) {
      await to.setItem(key, value);
    }
  }

  if (deleteAfterMigration) {
    await from.clear();
  }

  return { migratedKeys: data.length };
}
