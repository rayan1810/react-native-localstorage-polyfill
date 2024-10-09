# react-native-localstorage-polyfill

Adds polyfill for localstorage using async storage

## Installation

```sh
npm install react-native-localstorage-polyfill
```

### Install peer dependencies

```sh
npm install @react-native-async-storage/async-storage
```

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

Simply import react-native-localstorage-polyfill in the root of your app

```js
import 'react-native-localstorage-polyfill';
```

```js
localStorage.setItem('key', 'value');

localStorage.getItem('key');
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
