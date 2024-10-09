// localStoragePolyfill.js
import syncStorage from './SyncStorage';
const localStorage = {
  async init() {
    try {
      const value = await syncStorage.init();
      return value;
    } catch (error) {
      console.error('Error Initializing syncStorage', error);
      return null;
    }
  },
  getItem(key: string) {
    try {
      const value = syncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting item from localStorage', error);
      return null;
    }
  },
  async setItem(key: string, value: any) {
    try {
      await syncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item to localStorage', error);
    }
  },
  async removeItem(key: string) {
    try {
      await syncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage', error);
    }
  },
  async clear() {
    try {
      await syncStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  },
  getAllKeys() {
    try {
      const keys = syncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('Error getting all keys from localStorage', error);
      return [];
    }
  },
};

export default localStorage;
