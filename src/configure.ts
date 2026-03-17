import syncStorage from './SyncStorage';
import type { StorageBackend } from './backends/types';

export function configure(options: { backend: StorageBackend }) {
  syncStorage.setBackend(options.backend);
}
