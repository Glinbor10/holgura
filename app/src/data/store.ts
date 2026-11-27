import { Capacitor } from '@capacitor/core';
import { createInitialData, type AppData } from './appData';
import { localStorageRepository } from './localStorageRepository';
import { sqliteRepository } from './sqliteRepository';

const repository = Capacitor.isNativePlatform() ? sqliteRepository : localStorageRepository;

let cache: AppData | null = null;
let loading: Promise<AppData> | null = null;

export const loadData = (): Promise<AppData> => {
  if (cache) {
    return Promise.resolve(cache);
  }
  loading ??= repository.load().then((stored) => {
    cache = stored ?? createInitialData();
    return cache;
  });
  return loading;
};

/** Applies a pure mutation and persists the result. Unchanged data is not written again. */
export const mutate = async (change: (data: AppData) => AppData): Promise<void> => {
  const current = await loadData();
  const next = change(current);
  if (next !== current) {
    await repository.save(next);
    cache = next;
  }
};

/** Replaces everything (used when importing a backup). */
export const replaceData = async (data: AppData): Promise<void> => {
  await repository.save(data);
  cache = data;
};
