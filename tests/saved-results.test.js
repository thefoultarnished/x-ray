import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { countSavedResults, clearSavedResults } = require('../src/saved-results.js');

// A stand-in for chrome.storage.local that holds plain values.
function fakeStore(values) {
  const data = new Map(Object.entries(values));
  return {
    data,
    get: async () => Object.fromEntries(data),
    remove: async (keys) => [].concat(keys).forEach((k) => data.delete(k)),
  };
}

describe('counting saved results', () => {
  it('counts only the saved locations', async () => {
    const store = fakeStore({ 'loc:a': {}, 'loc:b': {}, movedOldResults: true, other: 1 });
    expect(await countSavedResults(store)).toBe(2);
  });

  it('counts zero for empty storage and for storage with no results', async () => {
    expect(await countSavedResults(fakeStore({}))).toBe(0);
    expect(await countSavedResults(fakeStore({ movedOldResults: true }))).toBe(0);
  });
});

describe('clearing saved results', () => {
  it('removes every saved location and nothing else', async () => {
    const store = fakeStore({ 'loc:a': {}, 'loc:b': {}, movedOldResults: true, other: 1 });
    expect(await clearSavedResults(store)).toBe(2);
    expect([...store.data.keys()].sort()).toEqual(['movedOldResults', 'other']);
  });

  it('does nothing, and does not call remove, when nothing is saved', async () => {
    const store = fakeStore({ movedOldResults: true });
    store.remove = () => {
      throw new Error('remove should not be called');
    };
    expect(await clearSavedResults(store)).toBe(0);
    expect(store.data.size).toBe(1);
  });

  it('passes a failed removal on to the caller', async () => {
    const store = fakeStore({ 'loc:a': {} });
    store.remove = async () => {
      throw new Error('storage failed');
    };
    await expect(clearSavedResults(store)).rejects.toThrow('storage failed');
  });

  it('keeps names that only look similar to the prefix', async () => {
    const store = fakeStore({ loc: 1, 'xloc:a': 2, 'loc:a': 3 });
    await clearSavedResults(store);
    expect([...store.data.keys()].sort()).toEqual(['loc', 'xloc:a']);
  });
});
