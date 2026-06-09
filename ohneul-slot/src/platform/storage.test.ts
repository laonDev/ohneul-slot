import { describe, it, expect } from 'vitest';
import { getJSON, setJSON } from './storage';

describe('storage JSON helpers (fallback path)', () => {
  it('round-trips a value', async () => {
    await setJSON('unit:test', { a: 1 });
    expect(await getJSON<{ a: number }>('unit:test', { a: 0 })).toEqual({ a: 1 });
  });
  it('returns fallback for missing key', async () => {
    expect(await getJSON('unit:missing', 'def')).toBe('def');
  });
});
