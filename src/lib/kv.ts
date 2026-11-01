import Storage from 'expo-sqlite/kv-store';

/** On-device store. Web resolves `kv.web.ts` instead, so this file never loads in the browser. */
export const kv = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
  removeItem: (key: string) => Storage.removeItem(key),
};
