import localStorage from './localstorage';

// @ts-ignore
global.localStorage = localStorage;

export { configure } from './configure';
export { migrateStorage } from './migrate';
export { AsyncStorageBackend } from './backends/AsyncStorageBackend';
export type { StorageBackend } from './backends/types';
