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
  remove: async (keys) => {
    const changes = {};
    for (const k of [].concat(keys)) {
      changes[k] = { oldValue: storage.get(k) };
      storage.delete(k);
    }
    storageListeners.forEach((fn) => fn(changes, 'local'));
  },
};

const storageListeners = [];
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
  storageListeners.length = 0;
  globalThis.chrome = {
    runtime: { id: 'test' },
    storage: { local: storageArea, onChanged: { addListener: (fn) => storageListeners.push(fn) } },
  };
  const local = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (local.has(k) ? local.get(k) : null),
      setItem: (k, v) => local.set(k, String(v)),
      removeItem: (k) => local.delete(k),
    },
  });
  globalThis.SAVED_PREFIX = require('../src/saved-results.js').SAVED_PREFIX;
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

describe('starting up', () => {
  it('reads the saved results once, with no separate read for the moved-results flag', async () => {
    const get = vi.spyOn(storageArea, 'get');
    storage.set('loc:one', result(1));
    openX();
    await vi.waitFor(() => expect(readAllCount).toBe(1));
    await new Promise((r) => setTimeout(r, 30));

    expect(get).toHaveBeenCalledTimes(1);
    get.mockRestore();
  });

  it('after moving results saved by an older version, reads again so they show at once', async () => {
    storage.delete('movedOldResults');
    localStorage.setItem(
      'x_location_cache',
      JSON.stringify({ OldOne: { loc: 'Chile', src: 'Web App', timestamp: Date.now() - DAY } })
    );
    openX();

    await vi.waitFor(() => expect(storage.get('movedOldResults')).toBe(true));
    expect(savedKeys()).toContain('OldOne');
    await vi.waitFor(() => expect(readAllCount).toBe(2));
  });

  it('keeps the newest result when the same account was saved under different capitals', async () => {
    storage.set('loc:SameAcct', { loc: 'Peru', src: 'Web', timestamp: Date.now() - 5 * DAY });
    storage.set('loc:sameacct', { loc: 'Chile', src: 'Web', timestamp: Date.now() - 1 * DAY });
    openX();

    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML =
      '<div data-testid="User-Name"><a href="/SameAcct">x</a></div><div><div data-testid="caret"></div></div>';
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('button')?.textContent).toContain('Chile'));
  });
});

describe('older spellings of an account', () => {
  // What Chrome tells every open tab when the tidy-up (or another tab) removes a saved result.
  const removeSaved = (key) => {
    const oldValue = storage.get(key);
    storage.delete(key);
    storageListeners.forEach((fn) => fn({ [key]: { oldValue } }, 'local'));
  };

  async function pillFor(handle) {
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = `<div data-testid="User-Name"><a href="/${handle}">x</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('button')?.textContent).toContain('Chile'));
    return article;
  }

  it('keeps the result on the page when only the older spelling is removed', async () => {
    storage.set('loc:sameacct', { loc: 'Chile', src: 'Web', timestamp: Date.now() - 1 * DAY });
    storage.set('loc:SameAcct', { loc: 'Peru', src: 'Web', timestamp: Date.now() - 5 * DAY });
    openX();
    const article = await pillFor('SameAcct');
    removeSaved('loc:SameAcct');
    await new Promise((r) => setTimeout(r, 20));
    expect(article.querySelector('button').className).toContain('xray-pill');
    expect(article.querySelector('button').textContent).toContain('Chile');
  });

  it('turns the result back into a pin once no spelling is saved', async () => {
    storage.set('loc:sameacct', { loc: 'Chile', src: 'Web', timestamp: Date.now() - 1 * DAY });
    openX();
    const article = await pillFor('SameAcct');
    removeSaved('loc:sameacct');
    await vi.waitFor(() => expect(article.querySelector('button').className).toContain('xray-pin'));
  });

  it('removes the older capitals from storage and keeps the newest one', async () => {
    storage.set('loc:SameAcct', { loc: 'Peru', src: 'Web', timestamp: Date.now() - 5 * DAY });
    storage.set('loc:sameacct', { loc: 'Chile', src: 'Web', timestamp: Date.now() - 1 * DAY });
    openX();
    await vi.waitFor(() => expect(storage.has('loc:SameAcct')).toBe(false));
    expect(storage.get('loc:sameacct').loc).toBe('Chile');
  });

  it('keeps the newest spelling even when it has capitals', async () => {
    storage.set('loc:other', { loc: 'Peru', src: 'Web', timestamp: Date.now() - 5 * DAY });
    storage.set('loc:Other', { loc: 'Chile', src: 'Web', timestamp: Date.now() - 1 * DAY });
    openX();
    await vi.waitFor(() => expect(storage.has('loc:other')).toBe(false));
    expect(storage.get('loc:Other').loc).toBe('Chile');
  });

  it('keeps different accounts that only look alike', async () => {
    storage.set('loc:acct_a', result(1));
    storage.set('loc:acct_b', result(2));
    storage.set('loc:acct', result(3));
    openX();
    await vi.waitFor(() => expect(readAllCount).toBe(1));
    await new Promise((r) => setTimeout(r, 20));
    expect([...storage.keys()].filter((k) => k.startsWith('loc:')).sort()).toEqual([
      'loc:acct',
      'loc:acct_a',
      'loc:acct_b',
    ]);
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
