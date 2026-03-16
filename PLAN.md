# Plan: Add MMKV Storage Backend Support

## Overview

Add modular storage backend support so users can choose between AsyncStorage (current default) and MMKV. This involves introducing a **StorageBackend interface**, separate backend implementations, and a migration utility for existing users to move their data from AsyncStorage to MMKV.

---

## Architecture

### Current Flow
```
index.tsx → localStorage (localstorage.ts) → SyncStorage (SyncStorage.ts) → AsyncStorage
```

### Proposed Flow
```
index.tsx (default, AsyncStorage)
  OR
index.mmkv.tsx (MMKV entry)
  OR
configure({ backend }) (custom setup)
    ↓
localStorage (localstorage.ts) → SyncStorage (SyncStorage.ts) → StorageBackend interface
                                                                    ├── AsyncStorageBackend
                                                                    └── MMKVBackend
```

---

## Step-by-Step Implementation Plan

### Step 1: Define the StorageBackend Interface

Create `src/backends/types.ts`:

```typescript
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
```

This is the minimal contract SyncStorage needs from any backend.

### Step 2: Create AsyncStorageBackend

Create `src/backends/AsyncStorageBackend.ts`:

- Move AsyncStorage import here
- Implement `StorageBackend` interface
- Wraps current AsyncStorage logic from SyncStorage.ts

```typescript
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
```

### Step 3: Create MMKVBackend

Create `src/backends/MMKVBackend.ts`:

- Import from `react-native-mmkv`
- MMKV is fully synchronous, so no async needed
- MMKV stores strings natively, fits well

```typescript
import { MMKV } from 'react-native-mmkv';
import type { StorageBackend } from './types';

export class MMKVBackend implements StorageBackend {
  private mmkv: MMKV;

  constructor(mmkvInstance?: MMKV) {
    this.mmkv = mmkvInstance ?? new MMKV();
  }

  async init(): Promise<[string, any][]> {
    const keys = this.mmkv.getAllKeys();
    return keys.map((key) => [key, this.mmkv.getString(key) ?? null]);
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
```

**Note:** The constructor accepts an optional MMKV instance so users can pass their own configured instance (custom ID, encryption, etc.).

### Step 4: Refactor SyncStorage to Accept a Backend

Modify `src/SyncStorage.ts`:

- Remove direct AsyncStorage import
- Accept a `StorageBackend` via constructor or setter
- Default to AsyncStorageBackend for backward compatibility

```typescript
import type { StorageBackend } from './backends/types';

class SyncStorage {
  data: Map<any, any> = new Map();
  loading: boolean = true;
  private backend: StorageBackend | null = null;

  setBackend(backend: StorageBackend) {
    this.backend = backend;
  }

  private getBackend(): StorageBackend {
    if (!this.backend) {
      // Lazy-load default AsyncStorage backend
      const { AsyncStorageBackend } = require('./backends/AsyncStorageBackend');
      this.backend = new AsyncStorageBackend();
    }
    return this.backend;
  }

  // ... rest uses this.getBackend() instead of direct AsyncStorage calls
}
```

The lazy-load pattern for AsyncStorageBackend ensures:
- Existing users who just `import 'react-native-localstorage-polyfill'` get the same behavior
- MMKV users who set a backend before init() never load AsyncStorage

### Step 5: Add Configuration API

Create `src/configure.ts`:

```typescript
import syncStorage from './SyncStorage';
import type { StorageBackend } from './backends/types';

export function configure(options: { backend: StorageBackend }) {
  syncStorage.setBackend(options.backend);
}
```

### Step 6: Update Entry Points

**`src/index.tsx`** (default - unchanged behavior):
```typescript
import localStorage from './localstorage';

// @ts-ignore
global.localStorage = localStorage;

export { configure } from './configure';
export type { StorageBackend } from './backends/types';
```

Add sub-path exports in **`package.json`**:
```json
{
  "exports": {
    ".": { /* existing */ },
    "./mmkv": {
      "import": "./lib/module/backends/MMKVBackend.js",
      "require": "./lib/commonjs/backends/MMKVBackend.js",
      "types": "./lib/typescript/module/src/backends/MMKVBackend.d.ts"
    }
  }
}
```

### Step 7: Migration Utility (AsyncStorage → MMKV)

Create `src/migrate.ts`:

```typescript
import type { StorageBackend } from './backends/types';

/**
 * Migrates all data from one storage backend to another.
 * Typically used to migrate from AsyncStorage to MMKV.
 *
 * Usage:
 *   import { migrateStorage } from 'react-native-localstorage-polyfill';
 *   import { AsyncStorageBackend } from 'react-native-localstorage-polyfill';
 *   import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';
 *
 *   await migrateStorage({
 *     from: new AsyncStorageBackend(),
 *     to: new MMKVBackend(),
 *     deleteAfterMigration: true,  // clears AsyncStorage after migration
 *   });
 */
export async function migrateStorage(options: {
  from: StorageBackend;
  to: StorageBackend;
  deleteAfterMigration?: boolean;
}): Promise<{ migratedKeys: number }> {
  const { from, to, deleteAfterMigration = false } = options;

  // 1. Load all data from source
  const data = await from.init();

  // 2. Write each item to destination
  for (const [key, value] of data) {
    if (key && value != null) {
      await to.setItem(key, value);
    }
  }

  // 3. Optionally clear source
  if (deleteAfterMigration) {
    await from.clear();
  }

  return { migratedKeys: data.length };
}
```

### Step 8: Update package.json Dependencies

```json
{
  "dependencies": {},
  "peerDependencies": {
    "react": "*",
    "react-native": "*",
    "@react-native-async-storage/async-storage": ">=1.0.0",
    "react-native-mmkv": ">=2.0.0"
  },
  "peerDependenciesMeta": {
    "@react-native-async-storage/async-storage": {
      "optional": true
    },
    "react-native-mmkv": {
      "optional": true
    }
  }
}
```

- AsyncStorage moves from `dependencies` to optional `peerDependencies`
- MMKV added as optional `peerDependency`
- Users install only what they need

---

## User-Facing API & Usage Examples

### Existing users (no changes required)
```javascript
// Works exactly as before
import 'react-native-localstorage-polyfill';
await localStorage.init();
localStorage.setItem('key', 'value');
```

### New users choosing MMKV
```javascript
import 'react-native-localstorage-polyfill';
import { configure } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

configure({ backend: new MMKVBackend() });
await localStorage.init();

localStorage.setItem('key', 'value');
```

### Migrating from AsyncStorage to MMKV
```javascript
import { configure, migrateStorage } from 'react-native-localstorage-polyfill';
import { AsyncStorageBackend } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

// Run migration once (guard with a flag or version check)
const mmkvBackend = new MMKVBackend();
await migrateStorage({
  from: new AsyncStorageBackend(),
  to: mmkvBackend,
  deleteAfterMigration: true,
});

// Then configure to use MMKV going forward
configure({ backend: mmkvBackend });
await localStorage.init();
```

### Custom MMKV instance (encryption, custom ID)
```javascript
import { MMKV } from 'react-native-mmkv';
import { configure } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

const mmkv = new MMKV({
  id: 'my-app-storage',
  encryptionKey: 'my-secret-key',
});

configure({ backend: new MMKVBackend(mmkv) });
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/backends/types.ts` | **Create** - StorageBackend interface |
| `src/backends/AsyncStorageBackend.ts` | **Create** - AsyncStorage implementation |
| `src/backends/MMKVBackend.ts` | **Create** - MMKV implementation |
| `src/SyncStorage.ts` | **Modify** - Accept pluggable backend |
| `src/configure.ts` | **Create** - configure() function |
| `src/migrate.ts` | **Create** - migrateStorage() utility |
| `src/localstorage.ts` | **Minor modify** - No changes needed (works through SyncStorage) |
| `src/index.tsx` | **Modify** - Re-export configure, types |
| `package.json` | **Modify** - Dependencies → optional peerDependencies, add exports |
| `README.md` | **Update** - Document MMKV option & migration |

---

## Migration Plan for Existing Users

### Zero breaking changes for v0.x → v1.0

1. **Default behavior is unchanged** - importing the package without calling `configure()` uses AsyncStorage exactly as before
2. **AsyncStorage lazy-loaded** - the default backend is loaded via `require()` only when first used, so MMKV-only users don't need AsyncStorage installed
3. **Migration utility provided** - `migrateStorage()` copies all data from AsyncStorage to MMKV in one call
4. **Recommended migration flow for app developers:**
   - Install `react-native-mmkv`
   - Add migration code that runs once (gated by a version flag stored in MMKV)
   - Switch to MMKV backend via `configure()`
   - After confirming migration success, optionally uninstall `@react-native-async-storage/async-storage`

### Versioning Strategy

- Release as **v1.0.0** (major bump since AsyncStorage moves to peerDependency)
- Clearly document in CHANGELOG that existing users need to `npm install @react-native-async-storage/async-storage` as a peer dependency if they weren't already
- Most React Native apps already have AsyncStorage installed, so impact is minimal

---

## Key Design Decisions

1. **Interface over inheritance** - StorageBackend is a simple interface, not a base class. Easy to implement custom backends.
2. **Lazy default backend** - AsyncStorageBackend loaded via `require()` only when needed, avoiding hard dependency for MMKV users.
3. **MMKV as sub-path export** - `react-native-localstorage-polyfill/mmkv` keeps MMKV import separate, so the main bundle doesn't include MMKV code.
4. **Constructor injection for MMKV** - Users can pass their own MMKV instance for custom configuration (encryption, storage ID).
5. **Migration is explicit** - No automatic migration. Users control when and how data moves between backends.
