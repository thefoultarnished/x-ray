// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const DAY = 24 * 60 * 60 * 1000;

// The extension's own storage, counting how often everything is read at once.
const storage = new Map();
let readAllCount = 0;
let failReads = false;
const storageArea = {
  get: async (keys) => {
    if (failReads) throw new Error('storage unavailable');
    if (keys === null || keys === undefined) {
      readAllCount++;
      return Object.fromEntries(storage);
    }
    return Object.fromEntries(
      []
        .concat(keys)
        .filter((k) => storage.has(k))
        .map((k) => [k, storage.get(k)])
    );
  },
  set: async (items) => Object.entries(items).forEach(([k, v]) => storage.set(k, structuredClone(v))),
  remove: async (keys) => [].concat(keys).forEach((k) => storage.delete(k)),
};

const result = (daysAgo) => ({ loc: 'Japan', src: 'Web App', timestamp: Date.now() - daysAgo * DAY });
const savedKeys = () => [...storage.keys()].filter((k) => k.startsWith('loc:')).map((k) => k.slice(4));

// Opens X with the extension, the way a new page would, starting from what is already stored.
function openX() {
  delete require.cache[require.resolve('../src/content.js')];
  window.xrayStarted = false;
  require('../src/content.js');
}

beforeEach(() => {
  storage.clear();
  storage.set('movedOldResults', true);
  readAllCount = 0;
  failReads = false;
  globalThis.chrome = { runtime: { id: 'test' }, storage: { local: storageArea } };
  const local = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (local.has(k) ? local.get(k) : null),
      setItem: (k, v) => local.set(k, String(v)),
      removeItem: (k) => local.delete(k),
    },
  });
  globalThis.FLAG_IMAGES = require('../src/flags.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('tidying saved results', () => {
  it('forgets results older than 90 days and broken entries, and leaves other extension data alone', async () => {
    storage.set('loc:Ancient', result(90.01));
    storage.set('loc:Recent', result(89.99));
    storage.set('loc:Broken', { loc: 'Peru' });
    storage.set('someSetting', true);
    openX();

    await vi.waitFor(() => expect(savedKeys().sort()).toEqual(['Recent']));
    expect(storage.get('someSetting')).toBe(true);
    expect(storage.get('movedOldResults')).toBe(true);
  });

  it('keeps at most 10,000 results, dropping the oldest first', async () => {
    for (let i = 0; i < 10003; i++) {
      storage.set(`loc:acct${i}`, { loc: 'Japan', src: 'Web', timestamp: Date.now() - (i + 1) * 1000 });
    }
    openX();

    await vi.waitFor(() => expect(savedKeys()).toHaveLength(10000));
    expect(savedKeys()).toContain('acct0');
    expect(savedKeys()).toContain('acct9999');
    expect(savedKeys()).not.toContain('acct10000');
    expect(savedKeys()).not.toContain('acct10002');
  });

  it('removes saved results that are not plain text', async () => {
    storage.set('loc:BadSaved', { loc: 123, src: 'Web', timestamp: Date.now() });
    storage.set('loc:BadSource', { loc: 'Peru', src: ['x'], timestamp: Date.now() });
    storage.set('loc:GoodOne', result(1));
    openX();

    await vi.waitFor(() => expect(savedKeys()).toEqual(['GoodOne']));
  });

  it('keeps everything when nothing is old or broken', async () => {
    storage.set('loc:one', result(1));
    storage.set('loc:two', result(60));
    openX();
    await new Promise((r) => setTimeout(r, 30));

    expect(savedKeys().sort()).toEqual(['one', 'two']);
  });

  it('still starts and adds pins when the tidy-up cannot run', async () => {
    storage.set('loc:old', result(200));
    const remove = vi.spyOn(storageArea, 'remove').mockRejectedValue(new Error('cannot remove'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    openX();

    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML =
      '<div data-testid="User-Name"><a href="/still_works">x</a></div><div><div data-testid="caret"></div></div>';
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('button')).not.toBeNull());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[X-Ray]'), expect.any(Error));
    remove.mockRestore();
    warn.mockRestore();
  });
});

describe('saving a result', () => {
  it('does not read every saved result again', async () => {
    for (let i = 0; i < 50; i++) storage.set(`loc:acct${i}`, result(1));
    openX();
    await vi.waitFor(() => expect(readAllCount).toBe(1));

    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML =
      '<div data-testid="User-Name"><a href="/new_acct">x</a></div><div><div data-testid="caret"></div></div>';
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('button')).not.toBeNull());

    article.querySelector('button').onclick({ isTrusted: true, preventDefault() {}, stopPropagation() {} });
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://x.com',
        source: document.querySelector('iframe').contentWindow,
        data: { type: 'X_LOCATION_FOUND', handle: 'new_acct', location: 'Peru', source: 'Web App' },
      })
    );
    await vi.waitFor(() => expect(savedKeys()).toContain('new_acct'));
    expect(savedKeys()).toHaveLength(51);
    expect(readAllCount).toBe(1);
  });
});
