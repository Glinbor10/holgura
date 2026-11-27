import type { AppData, Repository } from './appData';

const KEY = 'savings-tracker:data';

/** Used when running in a browser (development); the Android app uses SQLite. */
export const localStorageRepository: Repository = {
  async load() {
    const stored = localStorage.getItem(KEY);
    return stored ? (JSON.parse(stored) as AppData) : null;
  },
  async save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
};
