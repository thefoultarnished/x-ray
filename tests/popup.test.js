// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const html = readFileSync(require.resolve('../src/popup.html'), 'utf8');
const { countSavedResults, clearSavedResults } = require('../src/saved-results.js');

let data;
let removeFails;
const flush = () => vi.advanceTimersByTimeAsync(0);
const button = () => document.getElementById('clearSaved');
const count = () => document.getElementById('savedCount').textContent;

async function openPopup(values, { readFails = false } = {}) {
  data = new Map(Object.entries(values));
  removeFails = false;
  document.body.replaceChildren(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
  globalThis.countSavedResults = countSavedResults;
  globalThis.clearSavedResults = clearSavedResults;
  globalThis.chrome = {
    runtime: { getURL: (p) => p, getManifest: () => ({ version: '9.9' }) },
    tabs: { create: async () => {} },
    storage: {
      local: {
        get: async () => {
          if (readFails) throw new Error('storage failed');
          return Object.fromEntries(data);
        },
        remove: async (keys) => {
          if (removeFails) throw new Error('storage failed');
          [].concat(keys).forEach((k) => data.delete(k));
        },
      },
    },
  };
  delete require.cache[require.resolve('../src/popup.js')];
  require('../src/popup.js');
  await flush();
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the clear cached records button', () => {
  it('shows how many locations are saved', async () => {
    await openPopup({ 'loc:a': {}, 'loc:b': {}, other: 1 });
    expect(count()).toBe('Cached Records: 2');
    expect(button().disabled).toBe(false);
  });

  it('is switched off when nothing is saved', async () => {
    await openPopup({ other: 1 });
    expect(count()).toBe('Cached Records: 0');
    expect(button().disabled).toBe(true);
  });

  it('asks for a second click first and clears nothing yet', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    await flush();
    expect(button().textContent).toBe('Click again to clear');
    expect(button().classList.contains('confirming')).toBe(true);
    expect(data.has('loc:a')).toBe(true);
  });

  it('clears the cached records on the second click and keeps other data', async () => {
    await openPopup({ 'loc:a': {}, 'loc:b': {}, movedOldResults: true });
    button().click();
    button().click();
    await flush();
    expect([...data.keys()]).toEqual(['movedOldResults']);
    expect(button().textContent).toBe('Cleared');
    expect(button().classList.contains('confirming')).toBe(false);
    expect(count()).toBe('Cached Records: 0');
    expect(button().disabled).toBe(true);
  });

  it('goes back to the first step when the second click comes too late', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    await vi.advanceTimersByTimeAsync(3001);
    expect(button().textContent).toBe('Clear cache');
    expect(button().classList.contains('confirming')).toBe(false);
    button().click();
    await flush();
    expect(data.has('loc:a')).toBe(true);
    expect(button().textContent).toBe('Click again to clear');
  });

  it('shows the normal label again a few seconds after clearing', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    button().click();
    await flush();
    await vi.advanceTimersByTimeAsync(3001);
    expect(button().textContent).toBe('Clear cache');
  });

  it('keeps the results and the normal label when clearing fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({ 'loc:a': {} });
    removeFails = true;
    button().click();
    button().click();
    await flush();
    expect(data.has('loc:a')).toBe(true);
    expect(button().textContent).toBe('Clear cache');
    expect(count()).toBe('Could not clear cached records');
    warn.mockRestore();
  });

  it('says so, and switches the button off, when the cached records cannot be read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({ 'loc:a': {} }, { readFails: true });
    expect(count()).toBe('Could not read cached records');
    expect(button().disabled).toBe(true);
    warn.mockRestore();
  });
});
