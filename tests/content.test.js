// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
let createFlag;
let createSourceContent;
const DAY = 24 * 60 * 60 * 1000;

// Stand-in for chrome.storage.local, the extension's own storage.
const extensionStorage = new Map();
const storageArea = {
  get: async (keys) => {
    if (keys === null || keys === undefined) return Object.fromEntries(extensionStorage);
    return Object.fromEntries(
      []
        .concat(keys)
        .filter((k) => extensionStorage.has(k))
        .map((k) => [k, extensionStorage.get(k)])
    );
  },
  set: async (items) => Object.entries(items).forEach(([k, v]) => extensionStorage.set(k, structuredClone(v))),
  remove: async (keys) => [].concat(keys).forEach((k) => extensionStorage.delete(k)),
};

beforeAll(() => {
  // content.js asks for parser.js's URL as soon as it loads.
  globalThis.chrome = {
    runtime: { id: 'test', getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: storageArea },
  };
  // Node's own localStorage replaces jsdom's and doesn't work without a file, so use a simple one.
  const store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  });
  // Results saved by version 1.5 and older, inside x.com's own storage.
  localStorage.setItem(
    'x_location_cache',
    JSON.stringify({
      MovedAcct: { loc: 'Chile', src: 'Web App', timestamp: Date.now() - 10 * DAY },
      ExpiredAcct: { loc: 'Peru', src: 'Web App', timestamp: Date.now() - 100 * DAY },
      'not a name!': { loc: 'Peru', src: 'Web App', timestamp: Date.now() },
    })
  );
  ({ createFlag, createSourceContent } = require('../src/content.js'));
});

// Puts helper output into a container so assertions check what the user sees.
function render(node) {
  const el = document.createElement('div');
  el.append(node);
  return el;
}

const flagCode = (el) =>
  el
    .querySelector('img.flag-img')
    ?.getAttribute('src')
    .match(/w40\/([\w-]+)\.png$/)[1] ?? 'globe';
const flagFor = (loc) => flagCode(render(createFlag(loc)));

describe('createFlag', () => {
  it('shows the flag for a country name, ignoring case and accents', () => {
    expect(flagFor('Germany')).toBe('de');
    expect(flagFor('JAPAN')).toBe('jp');
    expect(flagFor('Türkiye')).toBe('tr');
    expect(flagFor('turkiye')).toBe('tr');
    expect(flagFor('Côte d’Ivoire')).toBe('ci');
    expect(flagFor('St. Kitts & Nevis')).toBe('kn');
    expect(flagFor('Saint Kitts and Nevis')).toBe('kn');
  });

  it('knows countries the old list was missing', () => {
    for (const [loc, code] of [
      ['Canada', 'ca'],
      ['Mexico', 'mx'],
      ['Cuba', 'cu'],
      ['Jamaica', 'jm'],
      ['Panama', 'pa'],
      ['Costa Rica', 'cr'],
    ]) {
      expect(flagFor(loc)).toBe(code);
    }
  });

  it('only matches the whole name, never part of it', () => {
    expect(flagFor('Belarus')).toBe('by');
    expect(flagFor('Democratic Republic of the Congo')).toBe('cd');
    expect(flagFor('Republic of the Congo')).toBe('cg');
    expect(flagFor('Niger')).toBe('ne');
    expect(flagFor('Nigeria')).toBe('ng');
    expect(flagFor('South Sudan')).toBe('ss');
  });

  it('understands older names and short forms', () => {
    expect(flagFor('Turkey')).toBe('tr');
    expect(flagFor('Czech Republic')).toBe('cz');
    expect(flagFor('Ivory Coast')).toBe('ci');
    expect(flagFor('USA')).toBe('us');
    expect(flagFor('UK')).toBe('gb');
    expect(flagFor('England')).toBe('gb-eng');
  });

  it('shows the EU flag for Europe and the European Union', () => {
    expect(flagFor('Europe')).toBe('eu');
    expect(flagFor('European Union')).toBe('eu');
  });

  it('shows the globe for regions, unknown places and missing locations', () => {
    for (const loc of [
      'North America',
      'Australasia',
      'South Asia',
      'London, England',
      'Atlantis',
      '',
      null,
      undefined,
    ]) {
      const el = render(createFlag(loc));
      expect(el.querySelector('img')).toBeNull();
      expect(el.querySelector('.globe-icon svg')).not.toBeNull();
    }
  });

  it('never turns a location with quotes or tags into page code', () => {
    const el = render(createFlag('Japan" data-injected="yes <b>x</b>'));
    expect(el.querySelector('[data-injected], b')).toBeNull();
  });
});

describe('createSourceContent', () => {
  it('returns Unknown when there is no source', () => {
    expect(render(createSourceContent(null, 'India')).textContent).toBe('Unknown');
    expect(render(createSourceContent('', 'India')).textContent).toBe('Unknown');
  });

  it('replaces the platform name with its icon', () => {
    const iphone = render(createSourceContent('Twitter for iPhone', null));
    expect(iphone.querySelectorAll('svg')).toHaveLength(1);
    expect(iphone.textContent).not.toMatch(/Twitter for|iPhone/);

    for (const source of ['Android App', 'Web App']) {
      const el = render(createSourceContent(source, null));
      expect(el.querySelectorAll('svg')).toHaveLength(1);
      expect(el.textContent.trim()).toBe('');
    }
  });

  it('does not repeat the location already shown in the pill', () => {
    const el = render(createSourceContent('India App Store', 'India'));
    expect(el.querySelector('img.flag-img')).toBeNull();
    expect(el.textContent).not.toMatch(/India/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('flags the store country when it differs from the location', () => {
    const el = render(createSourceContent('United States App Store', 'India'));
    expect(flagCode(el)).toBe('us');
    expect(el.textContent).not.toMatch(/United States/);
  });

  it('shows a one-word store country once, as a flag only', () => {
    const el = render(createSourceContent('Russia App Store', 'India'));
    expect(flagCode(el)).toBe('ru');
    expect(el.textContent).not.toMatch(/Russia/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('does not mistake a platform word for a country', () => {
    const el = render(createSourceContent('Android App', 'India'));
    expect(el.querySelector('img.flag-img')).toBeNull();
  });

  it('handles locations containing regex characters', () => {
    expect(() => createSourceContent('Web App', 'C++ (test) [x]')).not.toThrow();
    expect(render(createSourceContent('Web App', 'C++ (test) [x]')).querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows tags hidden in the app name as plain text, never as page elements', () => {
    const el = render(createSourceContent('&lt;u style="color:red"&gt;FAKE&lt;/u&gt; Web App', null));
    expect(el.querySelector('u')).toBeNull();
    expect(el.textContent).toContain('<u style="color:red">FAKE</u>');
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('keeps only the text of the HTML link X sends as the app name', () => {
    const el = render(createSourceContent('<a href="https://evil.example" onclick="x()">Twitter for iPhone</a>', null));
    expect(el.querySelector('a')).toBeNull();
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });
});

// Adds a post the way X renders it and waits for the extension to add its pin.
async function addPost(handle) {
  const article = document.createElement('article');
  article.dataset.testid = 'tweet';
  article.innerHTML = `<div data-testid="User-Name"><a href="/${handle}">${handle}</a></div><div><div data-testid="caret"></div></div>`;
  document.body.append(article);
  await vi.waitFor(() => expect(article.querySelector('.loc-btn')).not.toBeNull());
  return article.querySelector('.loc-btn');
}

const lookupFrame = () => document.querySelector('iframe')?.contentWindow;

// What parser.js sends from the hidden lookup page when X's About page answers.
const found = (handle, location, source, from = lookupFrame()) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://x.com',
      source: from,
      data: { type: 'X_LOCATION_FOUND', handle, location, source },
    })
  );

// Saved results by account name, read from the extension's own storage.
const saved = () =>
  Object.fromEntries(
    [...extensionStorage].filter(([k]) => k.startsWith('loc:')).map(([k, v]) => [k.slice('loc:'.length), v])
  );

// Lets pending saves finish before checking that nothing was saved.
const settle = () => new Promise((r) => setTimeout(r, 0));

const removePosts = () => {
  vi.useRealTimers();
  document.querySelectorAll('article').forEach((a) => a.remove());
};

describe('pin lookups', () => {
  afterEach(removePosts);

  const state = (el) => ({
    cls: el.className,
    text: el.textContent.trim(),
    clickable: el.style.pointerEvents !== 'none',
  });

  it('keeps Locating for 10 seconds, shows Not available for 3 seconds, then the pin again', async () => {
    const pin = await addPost('slow_acct');
    vi.useFakeTimers();
    pin.click();

    vi.advanceTimersByTime(9999);
    expect(state(pin)).toEqual({ cls: 'loc-pill loading', text: 'Locating...', clickable: false });

    vi.advanceTimersByTime(1);
    expect(state(pin)).toEqual({ cls: 'loc-pill unavailable', text: 'Not available', clickable: false });

    vi.advanceTimersByTime(2999);
    expect(state(pin).text).toBe('Not available');

    vi.advanceTimersByTime(1);
    expect(state(pin)).toEqual({ cls: 'loc-btn', text: '', clickable: true });
    expect(pin.querySelector('svg')).not.toBeNull();

    // The restored pin starts a new lookup.
    pin.click();
    expect(state(pin)).toEqual({ cls: 'loc-pill loading', text: 'Locating...', clickable: false });
    vi.advanceTimersByTime(13000);
  });

  it('shows the store country by its proper name in the info card', async () => {
    const pin = await addPost('store_acct');
    pin.click();
    found('store_acct', 'India', 'United States App Store');
    document.querySelector('[data-handle="store_acct"]').dispatchEvent(new MouseEvent('mouseenter'));

    const card = document.getElementById('loc-hover-card').textContent;
    expect(card).toContain('United States · iOS');
    expect(card).not.toContain('United states');
  });

  it('makes the result pill hoverable and copyable right away', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const pin = await addPost('fresh_acct');
    pin.click();
    found('fresh_acct', 'Japan', 'Web App');

    const pill = document.querySelector('[data-handle="fresh_acct"]');
    expect(state(pill)).toMatchObject({ cls: 'loc-pill', clickable: true });

    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.getElementById('loc-hover-card').textContent).toContain('Japan');

    pill.click();
    expect(writeText).toHaveBeenCalledWith('Japan (Web App)');
    expect(pill.textContent).toContain('Copied!');
  });

  it('never shows Not available when X answers before the 10 seconds are up', async () => {
    const pin = await addPost('quick_acct');
    vi.useFakeTimers();
    pin.click();
    vi.advanceTimersByTime(9000);
    found('quick_acct', 'Kenya', 'Web App');
    vi.advanceTimersByTime(5000);

    const pill = document.querySelector('[data-handle="quick_acct"]');
    expect(pill.className).toBe('loc-pill');
    expect(pill.textContent).toContain('Kenya');
    expect(pill.textContent).not.toContain('Not available');
  });

  it('keeps Android results and later posts by the same account clickable', async () => {
    const pin = await addPost('droid_acct');
    pin.click();
    found('droid_acct', 'Brazil', 'Android App');
    expect(state(document.querySelector('[data-handle="droid_acct"]'))).toMatchObject({
      cls: 'loc-pill android-device',
      clickable: true,
    });

    // A new post by the same account is drawn straight from the saved result.
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = `<div data-testid="User-Name"><a href="/droid_acct">droid_acct</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('.loc-pill')).not.toBeNull());
    expect(state(article.querySelector('.loc-pill'))).toMatchObject({
      cls: 'loc-pill android-device',
      clickable: true,
    });
  });

  it('shows tags in a result as plain text in the pill and the info card', async () => {
    const pin = await addPost('evil_acct');
    pin.click();
    found('evil_acct', 'Japan" data-injected="yes', '&lt;u&gt;FAKE&lt;/u&gt; Web App');

    const pill = document.querySelector('[data-handle="evil_acct"]');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    const card = document.getElementById('loc-hover-card');

    for (const el of [pill, card]) {
      expect(el.querySelector('u, [data-injected]')).toBeNull();
    }
    expect(pill.textContent).toContain('Japan" data-injected="yes');
    expect(pill.textContent).toContain('<u>FAKE</u>');
    expect(card.textContent).toContain('Japan" data-injected="yes');
  });

  it('ignores an answer that arrives after the 10 seconds are up', async () => {
    const pin = await addPost('late_acct');
    vi.useFakeTimers();
    pin.click();
    vi.advanceTimersByTime(10000);

    found('late_acct', 'Japan', 'Web App');
    vi.advanceTimersByTime(3000);

    expect(state(pin)).toEqual({ cls: 'loc-btn', text: '', clickable: true });
    expect(saved()).not.toHaveProperty('late_acct');
  });

  it('keeps a result found for another post by the same account while Not available is showing', async () => {
    const first = await addPost('twice_acct');
    vi.useFakeTimers();
    first.click();
    vi.advanceTimersByTime(10000);
    expect(first.textContent).toBe('Not available');

    vi.useRealTimers();
    const second = await addPost('twice_acct');
    vi.useFakeTimers();
    second.click();
    found('twice_acct', 'Japan', 'Web App');
    vi.advanceTimersByTime(3000);

    for (const pill of [first, second]) expect(pill.textContent).toContain('Japan');
  });
});

describe('answers that are not from the lookup', () => {
  afterEach(removePosts);

  const send = (data, source) =>
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.com', source, data }));

  it('ignores a fake result sent by the page itself', async () => {
    const pin = await addPost('target_acct');
    send({ type: 'X_LOCATION_FOUND', handle: 'target_acct', location: 'Antarctica', source: 'Fake App' }, window);

    expect(pin.className).toBe('loc-btn');
    await settle();
    expect(saved()).not.toHaveProperty('target_acct');
  });

  it('ignores an answer about a different account and still finishes the real lookup', async () => {
    const pin = await addPost('real_acct');
    pin.click();
    send({ type: 'X_LOCATION_FOUND', handle: 'nobody', location: 'X', source: 'X' }, lookupFrame());
    expect(pin.textContent).toBe('Locating...');
    await settle();
    expect(saved()).not.toHaveProperty('nobody');

    send({ type: 'X_LOCATION_FOUND', handle: 'real_acct', location: 'Kenya', source: 'Web App' }, lookupFrame());
    expect(pin.textContent).toContain('Kenya');
  });

  it('accepts the looked-up account written in different upper and lower case', async () => {
    const pin = await addPost('CaseAcct');
    pin.click();
    send({ type: 'X_LOCATION_FOUND', handle: 'caseacct', location: 'Chile', source: 'Web App' }, lookupFrame());

    expect(pin.textContent).toContain('Chile');
    await vi.waitFor(() => expect(saved()).toHaveProperty('CaseAcct'));
  });

  it('ignores account names that are not real X usernames, leaving the page alone', async () => {
    const pin = await addPost('odd_acct');
    pin.click();
    const other = document.createElement('div');
    other.className = 'unrelated';
    document.body.append(other);

    for (const handle of ['"], div, [x="', '', 42, 'a'.repeat(16)]) {
      send({ type: 'X_LOCATION_FOUND', handle, location: 'X', source: 'X' }, lookupFrame());
    }

    expect(other.className).toBe('unrelated');
    expect(pin.textContent).toBe('Locating...');
    send({ type: 'X_LOCATION_FOUND', handle: 'odd_acct', location: 'Peru', source: 'Web App' }, lookupFrame());
    other.remove();
  });
});

describe('saved results', () => {
  afterEach(removePosts);

  // Replaces all saved results in the extension's storage, leaving any other extension data alone.
  const plant = (entries) => {
    for (const k of [...extensionStorage.keys()]) if (k.startsWith('loc:')) extensionStorage.delete(k);
    for (const [h, e] of Object.entries(entries)) extensionStorage.set(`loc:${h}`, e);
  };
  const result = (daysAgo) => ({ loc: 'Japan', src: 'Web App', timestamp: Date.now() - daysAgo * DAY });

  async function lookUp(handle) {
    const pin = await addPost(handle);
    pin.click();
    found(handle, 'Kenya', 'Web App');
    await vi.waitFor(() => expect(saved()).toHaveProperty(handle));
    await settle();
  }

  it('moves results saved by older versions out of x.com storage, keeping their dates', async () => {
    expect(localStorage.getItem('x_location_cache')).toBeNull();
    expect(saved().MovedAcct).toMatchObject({ loc: 'Chile', src: 'Web App' });
    expect(Math.round((Date.now() - saved().MovedAcct.timestamp) / DAY)).toBe(10);
    expect(saved()).not.toHaveProperty('ExpiredAcct');
    expect(saved()).not.toHaveProperty('not a name!');

    // A post by a moved account shows its location right away, without a pin.
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = `<div data-testid="User-Name"><a href="/MovedAcct">m</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('.loc-pill')?.textContent).toContain('Chile'));
  });

  it('keeps the date of older results when a new one is saved', async () => {
    const old = result(29);
    plant({ OldAcct: old });
    await lookUp('new_acct');

    expect(saved().OldAcct.timestamp).toBe(old.timestamp);
    expect(Date.now() - saved().new_acct.timestamp).toBeLessThan(1000);
  });

  it('forgets results older than 90 days and broken entries, and leaves other extension data alone', async () => {
    plant({ Ancient: result(90.01), Recent: result(89.99), Broken: { loc: 'Peru' } });
    extensionStorage.set('someSetting', true);
    await lookUp('fresh_save');

    expect(Object.keys(saved()).sort()).toEqual(['Recent', 'fresh_save']);
    expect(extensionStorage.get('someSetting')).toBe(true);
    extensionStorage.delete('someSetting');
  });

  it('keeps at most 10,000 results, dropping the oldest first', async () => {
    const many = {};
    for (let i = 0; i < 10000; i++)
      many[`acct${i}`] = { loc: 'Japan', src: 'Web', timestamp: Date.now() - (i + 1) * 1000 };
    plant(many);
    await lookUp('newest');

    const after = saved();
    expect(Object.keys(after)).toHaveLength(10000);
    expect(after).toHaveProperty('newest');
    expect(after).toHaveProperty('acct0');
    expect(after).not.toHaveProperty('acct9999');
  });

  it('keeps results another X tab saved in the meantime', async () => {
    plant({});
    await lookUp('tab_one');
    // Another tab saves its own result.
    extensionStorage.set('loc:tab_two', result(0));
    await lookUp('tab_one_again');

    expect(Object.keys(saved()).sort()).toEqual(['tab_one', 'tab_one_again', 'tab_two']);
  });

  it('never puts results back into x.com storage', async () => {
    await lookUp('private_acct');
    expect(localStorage.getItem('x_location_cache')).toBeNull();
  });

  it('still shows results quietly when the extension was reloaded and storage is gone', async () => {
    const id = chrome.runtime.id;
    chrome.runtime.id = undefined;
    try {
      const pin = await addPost('after_reload');
      pin.click();
      found('after_reload', 'Kenya', 'Web App');
      expect(pin.textContent).toContain('Kenya');
      await settle();
      expect(saved()).not.toHaveProperty('after_reload');
    } finally {
      chrome.runtime.id = id;
    }
  });

  it('removes a saved result that is not plain text at the next save', async () => {
    extensionStorage.set('loc:BadSaved', { loc: 123, src: 'Web', timestamp: Date.now() });
    extensionStorage.set('loc:BadSource', { loc: 'Peru', src: ['x'], timestamp: Date.now() });
    await lookUp('cleanup_trigger');

    expect(saved()).not.toHaveProperty('BadSaved');
    expect(saved()).not.toHaveProperty('BadSource');
  });
});

describe('odd data from X', () => {
  afterEach(removePosts);

  async function answer(handle, location, source) {
    const pin = await addPost(handle);
    pin.click();
    found(handle, location, source);
    await vi.waitFor(() => expect(saved()).toHaveProperty(handle));
    return document.querySelector(`[data-handle="${handle}"]`);
  }

  it('treats a location that is not text as missing', async () => {
    const pill = await answer('number_loc', 123, { app: 'x' });
    expect(pill.textContent.trim()).toBe('Unknown Loc');
    expect(saved().number_loc).toMatchObject({ loc: '', src: '' });
  });

  it('accepts text up to 100 characters and treats longer text as missing', async () => {
    const ok = await answer('len_ok', 'A'.repeat(100), 'Web App');
    expect(ok.textContent).toContain('A'.repeat(100));

    const long = await answer('len_long', 'B'.repeat(101), 'Web App');
    expect(long.textContent).not.toContain('B');
    expect(long.textContent).toContain('Unknown Loc');
  });

  it('still adds pins to other posts when one post fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = document.createElement('article');
    broken.dataset.testid = 'tweet';
    broken.querySelector = () => {
      throw new Error('post X-Ray cannot read');
    };
    const fine = document.createElement('article');
    fine.dataset.testid = 'tweet';
    fine.innerHTML = `<div data-testid="User-Name"><a href="/fine_acct">f</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(broken, fine);

    await vi.waitFor(() => expect(fine.querySelector('.loc-btn')).not.toBeNull());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[X-Ray]'), expect.any(Error));
    warn.mockRestore();
  });
});

describe('loading content.js again', () => {
  // Kept last: it loads content.js a second time, the way a new X page would after the move.
  it('deletes data planted in the old x.com storage later instead of importing it', async () => {
    localStorage.setItem(
      'x_location_cache',
      JSON.stringify({ PlantedAcct: { loc: 'Antarctica', src: 'Fake App', timestamp: Date.now() } })
    );
    delete require.cache[require.resolve('../src/content.js')];
    require('../src/content.js');

    await vi.waitFor(() => expect(localStorage.getItem('x_location_cache')).toBeNull());
    await settle();
    expect(saved()).not.toHaveProperty('PlantedAcct');
  });
});
