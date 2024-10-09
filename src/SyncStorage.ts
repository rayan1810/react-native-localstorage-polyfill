import AsyncStorage from '@react-native-async-storage/async-storage';

type KeyType = string;

class SyncStorage {
  data: Map<any, any> = new Map();

  loading: boolean = true;

  init(): Promise<Array<any>> {
    return AsyncStorage.getAllKeys().then((keys: any) =>
      AsyncStorage.multiGet(keys).then((data: any): Array<any> => {
        data.forEach(this.saveItem.bind(this));

        return [...this.data];
      })
    );
  }

  getItem(key: KeyType): any {
    return this.data.get(key);
  }

  setItem(key: KeyType, value: any): Promise<any> {
    if (!key) return Promise.resolve('error a key is not provided');

    this.data.set(key, value);
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  removeItem(key: KeyType): Promise<any> {
    if (!key) return Promise.resolve('error a key is not provided');

    this.data.delete(key);
    return AsyncStorage.removeItem(key);
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

  clear(): Promise<void> {
    this.data.clear();
    return AsyncStorage.clear();
  }
}

const syncStorage = new SyncStorage();

export default syncStorage;
