# react-native-localstorage-polyfill

Adds polyfill for localstorage using AsyncStorage or MMKV

## Installation

```sh
npm install react-native-localstorage-polyfill
```

### Install peer dependencies

Choose one (or both, if migrating):

**AsyncStorage (default):**

```sh
npm install @react-native-async-storage/async-storage
```

**MMKV (faster, synchronous):**

```sh
npm install react-native-mmkv
```

> **MMKV v4+** uses Nitro modules under the hood. Make sure `react-native-nitro-modules` is installed (it comes as a peer dependency of `react-native-mmkv` v4). Both MMKV v2/v3 and v4 are supported.

### Linking

#### React Native 0.60 and above

```sh
npx pod-install
```

#### React Native 0.59 and below

```sh
react-native link @react-native-async-storage/async-storage
```

## Usage

### With AsyncStorage (default)

Simply import react-native-localstorage-polyfill in the root of your app:

```js
import 'react-native-localstorage-polyfill';
```

```js
localStorage.setItem('key', 'value');

localStorage.getItem('key');
```

### With MMKV

```js
import 'react-native-localstorage-polyfill';
import { configure } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

configure({ backend: new MMKVBackend() });
await localStorage.init();

localStorage.setItem('key', 'value');
localStorage.getItem('key');
```

#### Custom MMKV instance

You can pass your own MMKV instance for encryption or custom storage IDs:

```js
import { createMMKV } from 'react-native-mmkv';
import { configure } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

const mmkv = createMMKV({
  id: 'my-app-storage',
  encryptionKey: 'my-secret-key',
});

configure({ backend: new MMKVBackend(mmkv) });
```

> **Note:** MMKV v2/v3 used `new MMKV(...)`, while v4+ uses `createMMKV(...)`. This library supports both — just pass the instance you create.

## Migrating from AsyncStorage to MMKV

If you're already using this library with AsyncStorage and want to switch to MMKV, use the built-in migration utility:

```js
import { configure, migrateStorage, AsyncStorageBackend } from 'react-native-localstorage-polyfill';
import { MMKVBackend } from 'react-native-localstorage-polyfill/mmkv';

async function setupStorage() {
  const mmkvBackend = new MMKVBackend();

  // Migrate all data from AsyncStorage to MMKV (run once)
  await migrateStorage({
    from: new AsyncStorageBackend(),
    to: mmkvBackend,
    deleteAfterMigration: true, // clears AsyncStorage after migration
  });

  // Use MMKV going forward
  configure({ backend: mmkvBackend });
  await localStorage.init();
}
```

After confirming the migration is successful, you can optionally uninstall `@react-native-async-storage/async-storage`.

## API

### `configure({ backend })`

Set the storage backend. Must be called before `localStorage.init()`.

### `migrateStorage({ from, to, deleteAfterMigration? })`

Migrates all data from one backend to another. Returns `{ migratedKeys: number }`.

### `AsyncStorageBackend`

Storage backend using `@react-native-async-storage/async-storage`.

### `MMKVBackend`

Storage backend using `react-native-mmkv`. Import from `react-native-localstorage-polyfill/mmkv`.

Constructor: `new MMKVBackend(mmkvInstance?)` — optionally accepts a pre-created MMKV instance (from `createMMKV()` in v4+ or `new MMKV()` in v2/v3).

### `StorageBackend` (type)

Interface for implementing custom storage backends:

```ts
interface StorageBackend {
  init(): Promise<[string, any][]>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
