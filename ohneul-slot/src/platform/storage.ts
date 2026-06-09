import { Storage } from '@apps-in-toss/web-framework';

const isNode = typeof window === 'undefined';
const mem = new Map<string, string>();

async function rawGet(key: string): Promise<string | null> {
  if (isNode) return mem.has(key) ? mem.get(key)! : null;
  try { return await Storage.getItem(key); }
  catch { return mem.has(key) ? mem.get(key)! : null; } // 토스 밖 로컬 브라우저
}

async function rawSet(key: string, value: string): Promise<void> {
  if (isNode) { mem.set(key, value); return; }
  try { await Storage.setItem(key, value); }
  catch { mem.set(key, value); }
}

export async function getJSON<T>(key: string, fallbackValue: T): Promise<T> {
  const raw = await rawGet(key);
  if (raw == null) return fallbackValue;
  try { return JSON.parse(raw) as T; } catch { return fallbackValue; }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await rawSet(key, JSON.stringify(value));
}
