// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
let createFlag;
let createSourceContent;
let flagImages;
const DAY = 24 * 60 * 60 * 1000;

// Stand-in for chrome.storage.local, the extension's own storage.
const extensionStorage = new Map();
const storageListeners = [];
// What Chrome tells the page when saved results are removed (for example by the popup's clear button).
const removeSaved = (...handles) => {
  const changes = {};
  for (const handle of handles) {
    changes[`loc:${handle}`] = { oldValue: extensionStorage.get(`loc:${handle}`) };
    extensionStorage.delete(`loc:${handle}`);
  }
  storageListeners.forEach((fn) => fn(changes, 'local'));
};
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
  globalThis.chrome = {
    runtime: { id: 'test' },
    storage: {
      local: storageArea,
      sync: { get: async (defaults) => ({ ...defaults }) },
      onChanged: { addListener: (fn) => storageListeners.push(fn) },
    },
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
  // In Chrome flags.js loads right before content.js and shares its scope.
  globalThis.SAVED_PREFIX = require('../src/saved-results.js').SAVED_PREFIX;
  Object.assign(globalThis, require('../src/settings.js'));
  flagImages = globalThis.FLAG_IMAGES = require('../src/flags.js');
  ({ createFlag, createSourceContent } = require('../src/content.js'));
});

// jsdom marks every click it makes as untrusted, so this stands in for a real click or key press.
const userClick = (el) => el.onclick({ isTrusted: true, preventDefault() {}, stopPropagation() {} });

// Puts helper output into a container so assertions check what the user sees.
function render(node) {
  const el = document.createElement('div');
  el.append(node);
  return el;
}

// The flag picture shown (compared with flagImages.<code>), or 'globe' when there is none.
const flagPicture = (el) => el.querySelector('img.xray-flag')?.getAttribute('src') ?? 'globe';
const flagFor = (loc) => flagPicture(render(createFlag(loc)));

describe('createFlag', () => {
  it('shows the flag for a country name, ignoring case and accents', () => {
    expect(flagFor('Germany')).toBe(flagImages.de);
    expect(flagFor('JAPAN')).toBe(flagImages.jp);
    expect(flagFor('Türkiye')).toBe(flagImages.tr);
    expect(flagFor('turkiye')).toBe(flagImages.tr);
    expect(flagFor('Côte d’Ivoire')).toBe(flagImages.ci);
    expect(flagFor('St. Kitts & Nevis')).toBe(flagImages.kn);
    expect(flagFor('Saint Kitts and Nevis')).toBe(flagImages.kn);
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
      expect(flagFor(loc)).toBe(flagImages[code]);
    }
  });

  it('only matches the whole name, never part of it', () => {
    expect(flagFor('Belarus')).toBe(flagImages.by);
    expect(flagFor('Democratic Republic of the Congo')).toBe(flagImages.cd);
    expect(flagFor('Republic of the Congo')).toBe(flagImages.cg);
    expect(flagFor('Niger')).toBe(flagImages.ne);
    expect(flagFor('Nigeria')).toBe(flagImages.ng);
    expect(flagFor('South Sudan')).toBe(flagImages.ss);
  });

  it('understands older names and short forms', () => {
    expect(flagFor('Turkey')).toBe(flagImages.tr);
    expect(flagFor('Czech Republic')).toBe(flagImages.cz);
    expect(flagFor('Ivory Coast')).toBe(flagImages.ci);
    expect(flagFor('USA')).toBe(flagImages.us);
    expect(flagFor('UK')).toBe(flagImages.gb);
    expect(flagFor('England')).toBe(flagImages['gb-eng']);
  });

  it('shows the EU flag for Europe and the European Union', () => {
    expect(flagFor('Europe')).toBe(flagImages.eu);
    expect(flagFor('European Union')).toBe(flagImages.eu);
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
      expect(el.querySelector('.xray-globe svg')).not.toBeNull();
    }
  });

  it('puts the globe in a flag-sized chip for places that are not countries, never for a country', () => {
    for (const loc of ['South Asia', 'Atlantis', '', null]) {
      expect(render(createFlag(loc)).querySelector('.xray-chip svg')).not.toBeNull();
    }
    expect(render(createFlag('India')).querySelector('.xray-chip')).toBeNull();
    expect(render(createFlag('India')).querySelector('img.xray-flag')).not.toBeNull();
  });

  it('never turns a location with quotes or tags into page code', () => {
    const el = render(createFlag('Japan" data-injected="yes <b>x</b>'));
    expect(el.querySelector('[data-injected], b')).toBeNull();
  });

  it('shows the globe for names Chrome lists that are not countries with a flag', () => {
    for (const loc of ['Unknown Region', 'Ascension Island', 'Clipperton Island', 'Diego Garcia', 'Pseudo-Accents']) {
      expect(flagFor(loc)).toBe('globe');
    }
  });
});

describe('built-in flags', () => {
  const sources = (el) => [...el.querySelectorAll('img.xray-flag')].map((img) => img.getAttribute('src'));

  it('draws every flag from a picture inside the extension, never from a website', () => {
    const countries = ['Germany', 'Japan', 'England', 'Europe', 'USA', 'Côte d’Ivoire', 'Kosovo'];
    for (const country of countries) {
      const [src] = sources(render(createFlag(country)));
      expect(src).toMatch(/^data:image\/png;base64,/);
    }
    const store = sources(render(createSourceContent('United States App Store', 'India')));
    expect(store).toHaveLength(1);
    expect(store[0]).toMatch(/^data:image\/png;base64,/);
  });

  it('does not ask any other website to get ready for flags', () => {
    expect(document.head.querySelector('link[href*="flagcdn"]')).toBeNull();
    expect(document.documentElement.innerHTML).not.toContain('flagcdn.com');
  });

  it('has a real picture for every country name the extension understands', () => {
    const codes = new Set(Object.keys(flagImages));
    expect(codes.size).toBeGreaterThanOrEqual(250);
    for (const [code, src] of Object.entries(flagImages)) {
      expect(code).toMatch(/^[a-z]{2}(-[a-z]{3})?$/);
      const bytes = Buffer.from(src.replace('data:image/png;base64,', ''), 'base64');
      expect([...bytes.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
    }
    for (const code of ['gb-eng', 'gb-sct', 'gb-wls', 'gb-nir', 'eu', 'us', 'gb']) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it('gives every country Chrome can name its own flag, or the globe, never a broken picture', () => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const a of letters) {
      for (const b of letters) {
        const name = names.of(a + b);
        if (!name || name === a + b) continue;
        const [src] = sources(render(createFlag(name)));
        if (src) expect(Object.values(flagImages)).toContain(src);
      }
    }
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
    expect(el.querySelector('img.xray-flag')).toBeNull();
    expect(el.textContent).not.toMatch(/India/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows a store region once when it is the same as a region location', () => {
    const el = render(createSourceContent('South Asia App Store', 'South Asia'));
    expect(el.textContent).not.toMatch(/South Asia/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('ignores capitals and extra spaces when comparing regions', () => {
    const el = render(createSourceContent('south  asia Android', ' South Asia '));
    expect(el.textContent).not.toMatch(/south/i);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('still shows a store region that differs from the location', () => {
    expect(render(createSourceContent('South Asia App Store', 'India')).textContent).toContain('South Asia');
    expect(render(createSourceContent('South Asia App Store', 'Southeast Asia')).textContent).toContain('South Asia');
    expect(render(createSourceContent('South Asia App Store', '')).textContent).toContain('South Asia');
    expect(render(createSourceContent('South Asia App Store', null)).textContent).toContain('South Asia');
  });

  it('flags the store country when it differs from the location', () => {
    const el = render(createSourceContent('United States App Store', 'India'));
    expect(flagPicture(el)).toBe(flagImages.us);
    expect(el.textContent).not.toMatch(/United States/);
  });

  it('shows a one-word store country once, as a flag only', () => {
    const el = render(createSourceContent('Russia App Store', 'India'));
    expect(flagPicture(el)).toBe(flagImages.ru);
    expect(el.textContent).not.toMatch(/Russia/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('does not mistake a platform word for a country', () => {
    const el = render(createSourceContent('Android App', 'India'));
    expect(el.querySelector('img.xray-flag')).toBeNull();
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
function newPost(handle) {
  const article = document.createElement('article');
  article.dataset.testid = 'tweet';
  article.innerHTML = `<div data-testid="User-Name"><a href="/${handle}">${handle}</a></div><div><div data-testid="caret"></div></div>`;
  document.body.append(article);
  return article;
}

async function addPost(handle) {
  const article = newPost(handle);
  await vi.waitFor(() => expect(article.querySelector('.xray-pin')).not.toBeNull());
  return article.querySelector('.xray-pin');
}

// A post by an account that already has a result, which gets its pill straight away.
async function addKnownPost(handle) {
  const article = newPost(handle);
  await vi.waitFor(() => expect(article.querySelector('.xray-pill')).not.toBeNull());
  return article.querySelector('.xray-pill');
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
  // A frame scheduled under fake timers would be lost when real timers return, so let it run first.
  if (vi.isFakeTimers()) vi.advanceTimersByTime(20);
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
    userClick(pin);

    vi.advanceTimersByTime(9999);
    expect(state(pin)).toEqual({ cls: 'xray-pill loading', text: 'Locating...', clickable: false });

    vi.advanceTimersByTime(1);
    expect(state(pin)).toEqual({ cls: 'xray-pill unavailable', text: 'Not available', clickable: false });

    vi.advanceTimersByTime(2999);
    expect(state(pin).text).toBe('Not available');

    vi.advanceTimersByTime(1);
    expect(state(pin)).toEqual({ cls: 'xray-pin', text: '', clickable: true });
    expect(pin.querySelector('svg')).not.toBeNull();

    // The restored pin starts a new lookup.
    userClick(pin);
    expect(state(pin)).toEqual({ cls: 'xray-pill loading', text: 'Locating...', clickable: false });
    vi.advanceTimersByTime(13000);
  });

  it('shows the store country by its proper name in the info card', async () => {
    const pin = await addPost('store_acct');
    userClick(pin);
    found('store_acct', 'India', 'United States App Store');
    document.querySelector('[data-handle="store_acct"]').dispatchEvent(new MouseEvent('mouseenter'));

    const card = document.querySelector('.xray-hover-card').textContent;
    expect(card).toContain('United States · iOS');
    expect(card).not.toContain('United states');
  });

  it('makes the result pill hoverable right away', async () => {
    const pin = await addPost('fresh_acct');
    userClick(pin);
    found('fresh_acct', 'Japan', 'Web App');

    const pill = document.querySelector('[data-handle="fresh_acct"]');
    expect(state(pill)).toMatchObject({ cls: 'xray-pill', clickable: true });

    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('.xray-hover-card').textContent).toContain('Japan');
  });

  it('positions the hover card to the right of the pill', async () => {
    const pin = await addPost('pos_acct');
    userClick(pin);
    found('pos_acct', 'Canada', 'iOS');

    const pill = document.querySelector('[data-handle="pos_acct"]');
    vi.spyOn(pill, 'getBoundingClientRect').mockReturnValue({
      left: 120,
      right: 200,
      top: 60,
      bottom: 80,
      width: 80,
      height: 20,
    });

    pill.dispatchEvent(new MouseEvent('mouseenter'));
    const card = document.querySelector('.xray-hover-card');

    expect(card.style.left).toBe('208px');
    expect(card.classList.contains('pos-left')).toBe(false);
    expect(card.classList.contains('android-device')).toBe(false);
  });

  it('positions the hover card on the left if there is not enough space on the right', async () => {
    const pin = await addPost('edge_acct');
    userClick(pin);
    found('edge_acct', 'Brazil', 'Android App');

    const pill = document.querySelector('[data-handle="edge_acct"]');
    vi.spyOn(pill, 'getBoundingClientRect').mockReturnValue({
      left: 850,
      right: 950,
      top: 60,
      bottom: 80,
      width: 100,
      height: 20,
    });

    pill.dispatchEvent(new MouseEvent('mouseenter'));
    const card = document.querySelector('.xray-hover-card');

    expect(card.classList.contains('pos-left')).toBe(true);
    expect(card.classList.contains('android-device')).toBe(true);
    const cardWidth = card.offsetWidth || 210;
    expect(card.style.left).toBe(`${850 - cardWidth - 8}px`);
  });

  it('never shows Not available when X answers before the 10 seconds are up', async () => {
    const pin = await addPost('quick_acct');
    vi.useFakeTimers();
    userClick(pin);
    vi.advanceTimersByTime(9000);
    found('quick_acct', 'Kenya', 'Web App');
    vi.advanceTimersByTime(5000);

    const pill = document.querySelector('[data-handle="quick_acct"]');
    expect(pill.className).toBe('xray-pill');
    expect(pill.textContent).toContain('Kenya');
    expect(pill.textContent).not.toContain('Not available');
  });

  it('keeps Android results and later posts by the same account clickable', async () => {
    const pin = await addPost('droid_acct');
    userClick(pin);
    found('droid_acct', 'Brazil', 'Android App');
    expect(state(document.querySelector('[data-handle="droid_acct"]'))).toMatchObject({
      cls: 'xray-pill android-device',
      clickable: true,
    });

    // A new post by the same account is drawn straight from the saved result.
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = `<div data-testid="User-Name"><a href="/droid_acct">droid_acct</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('.xray-pill')).not.toBeNull());
    expect(state(article.querySelector('.xray-pill'))).toMatchObject({
      cls: 'xray-pill android-device',
      clickable: true,
    });
  });

  it('shows tags in a result as plain text in the pill and the info card', async () => {
    const pin = await addPost('evil_acct');
    userClick(pin);
    found('evil_acct', 'Japan" data-injected="yes', '&lt;u&gt;FAKE&lt;/u&gt; Web App');

    const pill = document.querySelector('[data-handle="evil_acct"]');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    const card = document.querySelector('.xray-hover-card');

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
    userClick(pin);
    vi.advanceTimersByTime(10000);

    found('late_acct', 'Japan', 'Web App');
    vi.advanceTimersByTime(3000);

    expect(state(pin)).toEqual({ cls: 'xray-pin', text: '', clickable: true });
    expect(saved()).not.toHaveProperty('late_acct');
  });

  it('keeps a result found for another post by the same account while Not available is showing', async () => {
    const first = await addPost('twice_acct');
    vi.useFakeTimers();
    userClick(first);
    vi.advanceTimersByTime(10000);
    expect(first.textContent).toBe('Not available');

    vi.useRealTimers();
    const second = await addPost('twice_acct');
    vi.useFakeTimers();
    userClick(second);
    found('twice_acct', 'Japan', 'Web App');
    vi.advanceTimersByTime(3000);

    for (const pill of [first, second]) expect(pill.textContent).toContain('Japan');
  });
});

describe('accounts that hide their info', () => {
  afterEach(removePosts);

  // X answered, and the account's About page holds no location and no app.
  const foundHidden = (handle, extra = {}) =>
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://x.com',
        source: lookupFrame(),
        data: { type: 'X_LOCATION_FOUND', handle, hidden: true, ...extra },
      })
    );

  it('shows Hidden in a result pill straight away, never Not available', async () => {
    const pin = await addPost('hide_a');
    userClick(pin);
    foundHidden('hide_a');
    expect(pin.className).toBe('xray-pill hidden-location');
    expect(pin.textContent.trim()).toBe('Hidden');
    expect(pin.getAttribute('aria-label')).toBe('Location: Hidden');
    expect(pin.querySelector('.xray-source')).toBeNull();
  });

  it('saves it like any other result, so the account is not asked for again', async () => {
    const pin = await addPost('hide_b');
    userClick(pin);
    foundHidden('hide_b');
    await settle();
    expect(saved().hide_b).toMatchObject({ loc: 'Hidden', src: '' });
    expect(saved().hide_b.timestamp).toBeGreaterThan(0);
  });

  it('shows Hidden on a later post by the same account, with no new lookup', async () => {
    userClick(await addPost('hide_c'));
    foundHidden('hide_c');
    const second = await addKnownPost('hide_c');
    expect(second.textContent.trim()).toBe('Hidden');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('shows the info card with Hidden as the place and Unknown as the platform', async () => {
    const pin = await addPost('hide_d');
    userClick(pin);
    foundHidden('hide_d');
    pin.onmouseenter();
    const card = document.querySelector('.xray-hover-card');
    expect(card.textContent).toContain('Hidden');
    expect(card.textContent).toContain('Unknown');
  });

  it('says out loud that the account is hidden', async () => {
    userClick(await addPost('hide_e'));
    foundHidden('hide_e');
    expect(document.querySelector('[role="status"]').textContent).toBe('@hide_e: Hidden');
  });

  it('ignores a location or app that comes with a hidden answer', async () => {
    const pin = await addPost('hide_f');
    userClick(pin);
    foundHidden('hide_f', { location: 'Peru', source: 'Web App' });
    expect(pin.textContent.trim()).toBe('Hidden');
  });

  it('gives the Hidden pill its own style and a lock instead of a flag or globe', async () => {
    const pin = await addPost('hide_style');
    userClick(pin);
    foundHidden('hide_style');
    expect(pin.className).toBe('xray-pill hidden-location');
    expect(pin.querySelector('.xray-lock svg rect')).not.toBeNull();
    expect(pin.querySelector('img.xray-flag')).toBeNull();
  });

  it('styles the info card the same way, and puts the normal style back for a normal result', async () => {
    const hiddenPin = await addPost('hide_card');
    userClick(hiddenPin);
    foundHidden('hide_card');
    hiddenPin.onmouseenter();
    const card = document.querySelector('.xray-hover-card');
    expect(card.classList.contains('hidden-location')).toBe(true);
    expect(card.querySelector('.xray-lock')).not.toBeNull();

    const normalPin = await addPost('hide_cardn');
    userClick(normalPin);
    found('hide_cardn', 'Peru', 'Web App');
    normalPin.onmouseenter();
    expect(card.classList.contains('hidden-location')).toBe(false);
    expect(card.querySelector('.xray-lock')).toBeNull();
    expect(normalPin.className).toBe('xray-pill');
  });

  it('keeps the normal style for a result that has an app, even if the place is called Hidden', async () => {
    const pin = await addPost('hide_named');
    userClick(pin);
    found('hide_named', 'Hidden', 'Web App');
    expect(pin.classList.contains('hidden-location')).toBe(false);
  });

  it('only counts hidden: true, never other values', async () => {
    const pin = await addPost('hide_g');
    userClick(pin);
    foundHidden('hide_g', { hidden: 'yes', location: 'Peru' });
    expect(pin.textContent.trim()).toBe('Peru');
  });

  it('still ignores a hidden answer about a different account', async () => {
    const pin = await addPost('hide_h');
    userClick(pin);
    foundHidden('someone_else');
    expect(pin.classList.contains('loading')).toBe(true);
    foundHidden('hide_h');
  });
});

describe('refreshing a result', () => {
  afterEach(() => {
    // Lets a lookup that is still running finish, so it cannot get in the way of the next test.
    const running = document
      .querySelector('iframe')
      ?.getAttribute('src')
      ?.match(/\/([A-Za-z0-9_]+)\/about/);
    if (running) found(running[1], 'Peru', 'Web App');
    removePosts();
  });

  const state = (el) => ({
    cls: el.className,
    text: el.textContent.trim(),
    clickable: el.style.pointerEvents !== 'none',
  });

  const resultFor = async (handle, location = 'Peru', source = 'Web App') => {
    const pin = await addPost(handle);
    userClick(pin);
    found(handle, location, source);
    return pin;
  };
  const click = (pill, over = {}) =>
    pill.onclick({ isTrusted: true, detail: 1, preventDefault() {}, stopPropagation() {}, ...over });
  const clickIcon = (pill) => click(pill, { target: pill.querySelector('.xray-refresh') });
  const frameSrc = () => document.querySelector('iframe')?.getAttribute('src') ?? '';

  it('puts a refresh icon at the end of every result pill, hidden ones too, and never on a pin', async () => {
    const pill = await resultFor('rf_icon');
    expect(pill.lastElementChild.className).toBe('xray-refresh');
    expect(pill.lastElementChild.getAttribute('aria-hidden')).toBe('true');
    expect(pill.querySelector('.xray-source')).not.toBeNull();

    const hidden = await addPost('rf_hidden');
    userClick(hidden);
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://x.com',
        source: lookupFrame(),
        data: { type: 'X_LOCATION_FOUND', handle: 'rf_hidden', hidden: true },
      })
    );
    expect(hidden.lastElementChild.className).toBe('xray-refresh');

    const pin = await addPost('rf_pin');
    expect(pin.querySelector('.xray-refresh')).toBeNull();
  });

  it('looks the account up again when the icon is clicked, keeping the pill out of reach meanwhile', async () => {
    const pill = await resultFor('rf_again');
    clickIcon(pill);
    expect(state(pill)).toMatchObject({ cls: 'xray-pill loading', text: 'Locating...', clickable: false });
    expect(frameSrc()).toContain('/rf_again/about');
  });

  it('shows the new result and saves it over the old one', async () => {
    const pill = await resultFor('rf_new', 'Peru', 'Web App');
    clickIcon(pill);
    found('rf_new', 'Chile', 'iPhone');
    await settle();
    expect(pill.textContent).toContain('Chile');
    expect(pill.textContent).not.toContain('Peru');
    expect(saved().rf_new).toMatchObject({ loc: 'Chile', src: 'iPhone' });
  });

  it('refreshes every post by the same account, with one lookup', async () => {
    const first = await resultFor('rf_many');
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = `<div data-testid="User-Name"><a href="/rf_many">rf_many</a></div><div><div data-testid="caret"></div></div>`;
    document.body.append(article);
    await vi.waitFor(() => expect(article.querySelector('.xray-pill')).not.toBeNull());
    const second = article.querySelector('.xray-pill');

    clickIcon(first);
    expect([first, second].map((pill) => pill.textContent.trim())).toEqual(['Locating...', 'Locating...']);
    found('rf_many', 'Chile', 'Web App');
    expect([first, second].every((pill) => pill.textContent.includes('Chile'))).toBe(true);
  });

  it('gives the old result back, not Not available, when no answer comes', async () => {
    const pill = await resultFor('rf_fail', 'Peru', 'Web App');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    clickIcon(pill);
    vi.advanceTimersByTime(10000);
    expect(pill.className).toBe('xray-pill');
    expect(pill.textContent).toContain('Peru');
    expect(pill.querySelector('.xray-refresh')).not.toBeNull();
    expect(document.querySelector('[role="status"]').textContent).toBe('Could not refresh @rf_fail');
    warn.mockRestore();
  });

  it('keeps the account refreshable after a failed refresh', async () => {
    const pill = await resultFor('rf_retry');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    clickIcon(pill);
    vi.advanceTimersByTime(10000);
    clickIcon(pill);
    expect(pill.textContent.trim()).toBe('Locating...');
    vi.advanceTimersByTime(10000);
    warn.mockRestore();
  });

  it('does nothing for a click on the rest of the pill', async () => {
    const pill = await resultFor('rf_body');
    click(pill, { target: pill.querySelector('.xray-source') });
    click(pill, { target: pill });
    expect(pill.className).toContain('xray-pill');
    expect(pill.classList.contains('loading')).toBe(false);
    expect(frameSrc()).toBe('');
  });

  it('refreshes on Enter or Space, which reach the pill as a click with no pointer', async () => {
    const pill = await resultFor('rf_key');
    click(pill, { detail: 0, target: pill });
    expect(pill.textContent.trim()).toBe('Locating...');
  });

  it('ignores a refresh click that a page script made up', async () => {
    const pill = await resultFor('rf_fake');
    pill.onclick({ isTrusted: false, detail: 0, target: pill.querySelector('.xray-refresh') });
    expect(pill.classList.contains('loading')).toBe(false);
  });

  it('allows one refresh every 2 seconds per account, and says so when it is too soon', async () => {
    const pill = await resultFor('rf_limit');
    vi.useFakeTimers();
    clickIcon(pill);
    found('rf_limit', 'Chile', 'Web App');
    vi.advanceTimersByTime(1999);
    clickIcon(pill);
    expect(pill.classList.contains('loading')).toBe(false);
    expect(document.querySelector('[role="status"]').textContent).toBe('@rf_limit was just refreshed');

    vi.advanceTimersByTime(1);
    clickIcon(pill);
    expect(pill.textContent.trim()).toBe('Locating...');
    vi.advanceTimersByTime(10000);
  });

  it('counts the wait for each account on its own', async () => {
    const one = await resultFor('rf_sep_a');
    const two = await resultFor('rf_sep_b');
    clickIcon(one);
    found('rf_sep_a', 'Chile', 'Web App');
    clickIcon(two);
    expect(two.textContent.trim()).toBe('Locating...');
  });

  it('closes the info card while it looks again', async () => {
    const pill = await resultFor('rf_card');
    pill.onmouseenter();
    clickIcon(pill);
    expect(document.querySelector('.xray-hover-card').classList.contains('show')).toBe(false);
  });
});

describe('answers that are not from the lookup', () => {
  afterEach(removePosts);

  const send = (data, source) =>
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://x.com', source, data }));

  it('ignores a fake result sent by the page itself', async () => {
    const pin = await addPost('target_acct');
    send({ type: 'X_LOCATION_FOUND', handle: 'target_acct', location: 'Antarctica', source: 'Fake App' }, window);

    expect(pin.className).toBe('xray-pin');
    await settle();
    expect(saved()).not.toHaveProperty('target_acct');
  });

  it('ignores an answer about a different account and still finishes the real lookup', async () => {
    const pin = await addPost('real_acct');
    userClick(pin);
    send({ type: 'X_LOCATION_FOUND', handle: 'nobody', location: 'X', source: 'X' }, lookupFrame());
    expect(pin.textContent).toBe('Locating...');
    await settle();
    expect(saved()).not.toHaveProperty('nobody');

    send({ type: 'X_LOCATION_FOUND', handle: 'real_acct', location: 'Kenya', source: 'Web App' }, lookupFrame());
    expect(pin.textContent).toContain('Kenya');
  });

  it('accepts the looked-up account written in different upper and lower case', async () => {
    const pin = await addPost('CaseAcct');
    userClick(pin);
    send({ type: 'X_LOCATION_FOUND', handle: 'caseacct', location: 'Chile', source: 'Web App' }, lookupFrame());

    expect(pin.textContent).toContain('Chile');
    await vi.waitFor(() => expect(saved()).toHaveProperty('caseacct'));
  });

  it('ignores account names that are not real X usernames, leaving the page alone', async () => {
    const pin = await addPost('odd_acct');
    userClick(pin);
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
    userClick(pin);
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
    await vi.waitFor(() => expect(article.querySelector('.xray-pill')?.textContent).toContain('Chile'));
  });

  it('keeps the date of older results when a new one is saved', async () => {
    const old = result(29);
    plant({ OldAcct: old });
    await lookUp('new_acct');

    expect(saved().OldAcct.timestamp).toBe(old.timestamp);
    expect(Date.now() - saved().new_acct.timestamp).toBeLessThan(1000);
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
      userClick(pin);
      found('after_reload', 'Kenya', 'Web App');
      expect(pin.textContent).toContain('Kenya');
      await settle();
      expect(saved()).not.toHaveProperty('after_reload');
    } finally {
      chrome.runtime.id = id;
    }
  });
});

describe('odd data from X', () => {
  afterEach(removePosts);

  async function answer(handle, location, source) {
    const pin = await addPost(handle);
    userClick(pin);
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

    await vi.waitFor(() => expect(fine.querySelector('.xray-pin')).not.toBeNull());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[X-Ray]'), expect.any(Error));
    warn.mockRestore();
  });
});

describe('checking posts as the page changes', () => {
  afterEach(removePosts);

  const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
  const pinsIn = (article) => article.querySelectorAll('button[data-handle]').length;

  it('gives every post in a big batch exactly one pin', async () => {
    const articles = [];
    for (let i = 0; i < 50; i++) articles.push(newPost(`batch_${i}`));
    await vi.waitFor(() => expect(articles.every((a) => pinsIn(a) === 1)).toBe(true));
    await nextFrame();
    await nextFrame();
    expect(articles.map(pinsIn).every((n) => n === 1)).toBe(true);
  });

  it('adds the pin when X fills in the menu button after the post appears', async () => {
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = '<div data-testid="User-Name"><a href="/late_menu">late_menu</a></div><div class="menu"></div>';
    document.body.append(article);
    await nextFrame();
    await nextFrame();
    expect(pinsIn(article)).toBe(0);

    const caret = document.createElement('div');
    caret.dataset.testid = 'caret';
    article.querySelector('.menu').append(caret);
    await vi.waitFor(() => expect(pinsIn(article)).toBe(1));
  });

  it('does not recheck older posts when something else on the page changes', async () => {
    const old = newPost('old_post');
    await vi.waitFor(() => expect(pinsIn(old)).toBe(1));
    // The pin itself is a change in the post, so let that last check finish before removing it.
    await nextFrame();
    await nextFrame();
    old.querySelector('button[data-handle]').remove();

    for (let i = 0; i < 20; i++) document.body.append(document.createElement('div'));
    await nextFrame();
    await nextFrame();
    expect(pinsIn(old)).toBe(0);

    const fresh = newPost('fresh_post');
    await vi.waitFor(() => expect(pinsIn(fresh)).toBe(1));
    expect(pinsIn(old)).toBe(0);
  });

  it('still adds pins to posts that are placed inside a new container', async () => {
    const wrapper = document.createElement('section');
    wrapper.append(newPost('wrapped_a'), newPost('wrapped_b'));
    document.body.append(wrapper);
    await vi.waitFor(() => expect(wrapper.querySelectorAll('button[data-handle]')).toHaveLength(2));
  });

  it('adds nothing for a post that has no author link', async () => {
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = '<div><div data-testid="caret"></div></div>';
    document.body.append(article);
    await nextFrame();
    await nextFrame();
    expect(pinsIn(article)).toBe(0);
  });
});

describe('accounts already being looked up', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removePosts();
  });

  const nextFrame = () => new Promise((r) => requestAnimationFrame(r));
  const state = (el) => ({ cls: el.className, text: el.textContent.trim() });

  // How many times the hidden frame was sent to this account's page.
  function watchLookups() {
    const loaded = [];
    const set = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src').set;
    vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(function (url) {
      loaded.push(url);
      return set.call(this, url);
    });
    return (handle) => loaded.filter((url) => url.endsWith(`/${handle}/about`)).length;
  }

  it('shows Locating... on a post that appears while its account is being looked up, then the result', async () => {
    const lookups = watchLookups();
    const first = await addPost('join_first');
    userClick(first);

    const later = newPost('join_first');
    await vi.waitFor(() => expect(later.querySelector('button')).not.toBeNull());
    const joined = later.querySelector('button');
    expect(state(joined)).toEqual({ cls: 'xray-pill loading', text: 'Locating...' });

    found('join_first', 'Peru', 'Web App');
    expect(joined.textContent).toContain('Peru');
    expect(first.textContent).toContain('Peru');
    expect(lookups('join_first')).toBe(1);
  });

  it('shows Queued... on a post that appears while its account is waiting its turn', async () => {
    const running = await addPost('join_run');
    const waiting = await addPost('join_wait');
    userClick(running);
    userClick(waiting);
    expect(waiting.textContent.trim()).toBe('Queued...');

    const later = newPost('join_wait');
    await vi.waitFor(() => expect(later.querySelector('button')).not.toBeNull());
    expect(later.querySelector('button').textContent.trim()).toBe('Queued...');

    vi.useFakeTimers();
    found('join_run', 'Peru', 'Web App');
    vi.advanceTimersByTime(500);
    expect(later.querySelector('button').textContent.trim()).toBe('Locating...');
    found('join_wait', 'Chile', 'Web App');
    expect(later.querySelector('button').textContent).toContain('Chile');
  });

  it('does not start a second lookup when a pin that came back is clicked during a new lookup of the same account', async () => {
    const lookups = watchLookups();
    const old = await addPost('join_again');
    vi.useFakeTimers();
    userClick(old);
    vi.advanceTimersByTime(10000);
    expect(old.className).toBe('xray-pill unavailable');

    // A new post by the same account starts a fresh lookup while the old pin is still resting.
    const fresh = newPost('join_again');
    // Frames run on the fake clock, so move it forward until the pin shows up.
    for (let i = 0; i < 10 && !fresh.querySelector('button'); i++) {
      await Promise.resolve();
      vi.advanceTimersByTime(20);
    }
    const freshPin = fresh.querySelector('button');
    userClick(freshPin);
    expect(lookups('join_again')).toBe(2);

    vi.advanceTimersByTime(3000);
    expect(old.className).toBe('xray-pin');
    userClick(old);
    expect(state(old)).toEqual({ cls: 'xray-pill loading', text: 'Locating...' });
    expect(lookups('join_again')).toBe(2);

    found('join_again', 'Peru', 'Web App');
    expect(old.textContent).toContain('Peru');
    expect(freshPin.textContent).toContain('Peru');
  });

  it('still looks up different accounts one at a time, in order', async () => {
    const lookups = watchLookups();
    const a = await addPost('order_a');
    const b = await addPost('order_b');
    userClick(a);
    userClick(b);
    expect(lookups('order_a')).toBe(1);
    expect(lookups('order_b')).toBe(0);

    vi.useFakeTimers();
    found('order_a', 'Peru', 'Web App');
    vi.advanceTimersByTime(500);
    expect(lookups('order_b')).toBe(1);
    found('order_b', 'Chile', 'Web App');
  });

  it('serves an account that already has a result straight from the saved result', async () => {
    const lookups = watchLookups();
    const first = await addPost('saved_join');
    userClick(first);
    found('saved_join', 'Peru', 'Web App');

    const again = newPost('saved_join');
    await nextFrame();
    await vi.waitFor(() => expect(again.querySelector('button')?.className).toBe('xray-pill'));
    expect(again.querySelector('button').textContent).toContain('Peru');
    expect(lookups('saved_join')).toBe(1);
  });
});

describe('links that are not account names', () => {
  afterEach(removePosts);

  const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

  // Sets the link with setAttribute, so names with quotes or slashes reach the extension as they are.
  function postWithLink(href) {
    const article = document.createElement('article');
    article.dataset.testid = 'tweet';
    article.innerHTML = '<div data-testid="User-Name"><a>name</a></div><div><div data-testid="caret"></div></div>';
    article.querySelector('a').setAttribute('href', href);
    document.body.append(article);
    return article;
  }

  it.each(['/some_user', '/A1', '/a', '/abcdefghijklmno', '/User_Name_9'])('gives %s a pin', async (href) => {
    const article = postWithLink(href);
    await vi.waitFor(() => expect(article.querySelectorAll('button')).toHaveLength(1));
    expect(article.querySelector('button').dataset.handle).toBe(href.slice(1).toLowerCase());
  });

  it.each([
    '/someone/status/123',
    '/someone/',
    '/some one',
    '/a"b',
    '/abcdefghijklmnop',
    '/home?x=1',
    '/#top',
    '/i/premium',
    '/',
    '',
  ])('gives no pin to the link "%s", and does not fail', async (href) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const article = postWithLink(href);
    await nextFrame();
    await nextFrame();
    expect(article.querySelectorAll('button')).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('still gives the next post its pin after a post with an odd link', async () => {
    const odd = postWithLink('/x/status/1');
    const fine = postWithLink('/fine_acct');
    await vi.waitFor(() => expect(fine.querySelectorAll('button')).toHaveLength(1));
    expect(odd.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('the same account written with different capitals', () => {
  afterEach(removePosts);

  function watchLookups() {
    const loaded = [];
    const set = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src').set;
    vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set').mockImplementation(function (url) {
      loaded.push(url);
      return set.call(this, url);
    });
    return () => loaded.filter((url) => url.endsWith('/about'));
  }

  it('shows an already looked up account as a result, whatever capitals the link uses', async () => {
    const first = await addPost('SpaceXtest');
    userClick(first);
    found('spacextest', 'United States', 'Web App');

    const second = await addKnownPost('SPACEXTEST');
    expect(second.textContent).toContain('United States');
    const third = await addKnownPost('spacextest');
    expect(third.textContent).toContain('United States');
  });

  it('looks the account up once, even when two posts spell it differently', async () => {
    const lookups = watchLookups();
    const first = await addPost('MixedCase');
    const second = await addPost('mixedcase');
    userClick(first);
    userClick(second);
    expect(lookups()).toHaveLength(1);

    found('mixedcase', 'Chile', 'Web App');
    expect(first.textContent).toContain('Chile');
    expect(second.textContent).toContain('Chile');
    vi.restoreAllMocks();
  });

  it('saves one result for the account, under the lowercase name', async () => {
    const pin = await addPost('SaveCase');
    userClick(pin);
    found('SaveCase', 'Peru', 'Web App');
    await vi.waitFor(() => expect(saved()).toHaveProperty('savecase'));
    expect(saved()).not.toHaveProperty('SaveCase');
  });

  it('still keeps different accounts apart', async () => {
    const a = await addPost('case_one');
    const b = await addPost('case_two');
    userClick(a);
    found('case_one', 'Peru', 'Web App');
    expect(b.className).toBe('xray-pin');
  });
});

describe('the 10 second limit of a lookup', () => {
  afterEach(removePosts);

  it('is cancelled once the lookup finishes, so it cannot cut a later lookup short', async () => {
    const first = await addPost('timer_one');
    const second = await addPost('timer_two');
    vi.useFakeTimers();
    userClick(first);
    vi.advanceTimersByTime(2000);
    found('timer_one', 'Peru', 'Web App');

    vi.advanceTimersByTime(500);
    userClick(second);
    // The first lookup's 10 seconds end here; the second one is still running.
    vi.advanceTimersByTime(7600);
    expect(second.textContent.trim()).toBe('Locating...');
    found('timer_two', 'Chile', 'Web App');
    expect(second.textContent).toContain('Chile');
  });

  it('still ends a lookup that gets no answer after its own 10 seconds', async () => {
    const pin = await addPost('timer_slow');
    vi.useFakeTimers();
    userClick(pin);
    vi.advanceTimersByTime(9999);
    expect(pin.textContent.trim()).toBe('Locating...');
    vi.advanceTimersByTime(1);
    expect(pin.textContent.trim()).toBe('Not available');
  });
});

describe('pin hint display', () => {
  const originalWidth = window.innerWidth;
  afterEach(() => {
    removePosts();
    window.innerWidth = originalWidth;
  });

  const hint = () => document.querySelector('.xray-tooltip');

  async function pinAt(handle, rect) {
    const pin = await addPost(handle);
    vi.spyOn(pin, 'getBoundingClientRect').mockReturnValue({ top: 60, bottom: 80, width: 20, height: 20, ...rect });
    return pin;
  }

  it('shows the hint under the pin when there is room', async () => {
    const pin = await pinAt('hint_room', { left: 100, right: 120 });
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    expect(hint().style.display).toBe('block');
    expect(hint().textContent).toBe('Get Location & App Store');
    expect(hint().style.left).toBe('100px');
    expect(hint().style.top).toBe('85px');
  });

  it('opens the hint above the pin when the window ends before the hint does', async () => {
    const pin = await pinAt('hint_bottom', { top: window.innerHeight - 30, bottom: window.innerHeight - 10 });
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    // The hint is 30 px tall without a real layout, plus a 5 px gap, above the pin's top edge.
    expect(parseFloat(hint().style.top)).toBe(window.innerHeight - 30 - 30 - 5);
  });

  it('keeps the hint under the pin when there is room below, or no room above either', async () => {
    const roomy = await pinAt('hint_below', { top: 100, bottom: 120 });
    roomy.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(hint().style.top)).toBe(125);

    const cramped = await pinAt('hint_cramped', { top: 5, bottom: window.innerHeight - 5 });
    cramped.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(hint().style.top)).toBe(window.innerHeight - 5 + 5);
  });

  it('keeps the hint inside the window when the pin is near the right edge', async () => {
    window.innerWidth = 300;
    const pin = await pinAt('hint_edge', { left: 280, right: 300 });
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(hint().style.left)).toBe(300 - 170 - 8);
  });

  it('keeps the hint off the left edge in a very small window', async () => {
    window.innerWidth = 100;
    const pin = await pinAt('hint_tiny', { left: 60, right: 80 });
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(hint().style.left)).toBe(8);
  });

  it('hides the hint when X removes the post it belongs to', async () => {
    const pin = await pinAt('hint_gone', { left: 100, right: 120 });
    pin.dispatchEvent(new FocusEvent('focus'));
    expect(hint().style.display).toBe('block');

    pin.closest('article').remove();
    await vi.waitFor(() => expect(hint().style.display).toBe('none'));
  });

  it('keeps the hint when a different post is removed', async () => {
    const pin = await pinAt('hint_stays', { left: 100, right: 120 });
    const other = await addPost('hint_other');
    pin.dispatchEvent(new FocusEvent('focus'));

    other.closest('article').remove();
    await settle();
    expect(hint().style.display).toBe('block');
  });

  it('hides the hint when the pointer leaves and when the pin is clicked', async () => {
    const pin = await pinAt('hint_leave', { left: 100, right: 120 });
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    pin.dispatchEvent(new MouseEvent('mouseleave'));
    expect(hint().style.display).toBe('none');

    pin.dispatchEvent(new MouseEvent('mouseenter'));
    userClick(pin);
    expect(hint().style.display).toBe('none');
    found('hint_leave', 'Peru', 'Web App');
  });
});

describe('forgetting saved results that were cleared', () => {
  afterEach(removePosts);

  const pillFor = (handle) => document.querySelector(`[data-handle="${handle}"]`);

  async function resultFor(handle) {
    userClick(await addPost(handle));
    found(handle, 'Peru', 'Web App');
    await vi.waitFor(() => expect(saved()[handle]).toBeDefined());
  }

  it('turns the pill back into a pin when its saved result is cleared', async () => {
    await resultFor('clear_one');
    expect(pillFor('clear_one').classList.contains('xray-pill')).toBe(true);
    removeSaved('clear_one');
    await vi.waitFor(() => expect(pillFor('clear_one').classList.contains('xray-pin')).toBe(true));
  });

  it('only turns back the accounts that were cleared', async () => {
    await resultFor('clear_a');
    await resultFor('clear_b');
    removeSaved('clear_a');
    await vi.waitFor(() => expect(pillFor('clear_a').classList.contains('xray-pin')).toBe(true));
    expect(pillFor('clear_b').classList.contains('xray-pill')).toBe(true);
  });

  it('lets the cleared account be looked up again', async () => {
    await resultFor('clear_again');
    removeSaved('clear_again');
    await vi.waitFor(() => expect(pillFor('clear_again').classList.contains('xray-pin')).toBe(true));
    userClick(pillFor('clear_again'));
    expect(pillFor('clear_again').textContent).toContain('Locating');
    found('clear_again', 'Peru', 'Web App');
  });

  it('closes the info card of a pill that was cleared', async () => {
    await resultFor('clear_card');
    pillFor('clear_card').dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(document.querySelector('.xray-hover-card').classList.contains('show')).toBe(true));
    removeSaved('clear_card');
    await vi.waitFor(() => expect(document.querySelector('.xray-hover-card').classList.contains('show')).toBe(false));
  });

  it('ignores changes that are not removed results', async () => {
    await resultFor('clear_keep');
    storageListeners.forEach((fn) => fn({ 'loc:clear_keep': { oldValue: {}, newValue: {} } }, 'local'));
    storageListeners.forEach((fn) => fn({ 'loc:clear_keep': { oldValue: {} } }, 'sync'));
    storageListeners.forEach((fn) => fn({ movedOldResults: { oldValue: true } }, 'local'));
    storageListeners.forEach((fn) => fn({ 'loc:bad name!': { oldValue: {} } }, 'local'));
    await settle();
    expect(pillFor('clear_keep').classList.contains('xray-pill')).toBe(true);
  });

  it('leaves a pill that is still looking something up', async () => {
    userClick(await addPost('clear_busy'));
    expect(pillFor('clear_busy').classList.contains('loading')).toBe(true);
    storageListeners.forEach((fn) => fn({ 'loc:clear_busy': { oldValue: {} } }, 'local'));
    await settle();
    expect(pillFor('clear_busy').classList.contains('loading')).toBe(true);
    found('clear_busy', 'Peru', 'Web App');
  });

  it('turns both spellings back into a pin when the popup clears them together', async () => {
    await resultFor('clear_both');
    extensionStorage.set('loc:Clear_Both', { loc: 'Peru', src: 'Web App', timestamp: Date.now() });
    removeSaved('clear_both', 'Clear_Both');
    await vi.waitFor(() => expect(pillFor('clear_both').classList.contains('xray-pin')).toBe(true));
  });

  it('keeps the result when another spelling of the account is still saved', async () => {
    await resultFor('clear_spell');
    extensionStorage.set('loc:Clear_Spell', { loc: 'Peru', src: 'Web App', timestamp: Date.now() });
    removeSaved('clear_spell');
    await settle();
    await settle();
    expect(pillFor('clear_spell').classList.contains('xray-pill')).toBe(true);
    extensionStorage.delete('loc:Clear_Spell');
  });

  it('does nothing, and does not throw, when the extension was reloaded', async () => {
    await resultFor('clear_stale');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    chrome.runtime.id = undefined;
    removeSaved('clear_stale');
    await settle();
    chrome.runtime.id = 'test';
    expect(pillFor('clear_stale').classList.contains('xray-pill')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does nothing when no post is on the page', () => {
    expect(() => removeSaved('nobody_here')).not.toThrow();
  });
});

describe('closing the hint and the card when leaving the tab', () => {
  afterEach(removePosts);

  const card = () => document.querySelector('.xray-hover-card');
  const hint = () => document.querySelector('.xray-tooltip');
  const setHidden = (value) => Object.defineProperty(document, 'hidden', { configurable: true, value });

  async function hoverPill(handle) {
    userClick(await addPost(handle));
    found(handle, 'Peru', 'Web App');
    document.querySelector(`[data-handle="${handle}"]`).dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(true));
  }

  it('closes the card when the tab is switched away', async () => {
    await hoverPill('tab_card');
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    setHidden(false);
    expect(card().classList.contains('show')).toBe(false);
  });

  it('closes the card when the window loses focus', async () => {
    await hoverPill('blur_card');
    window.dispatchEvent(new Event('blur'));
    expect(card().classList.contains('show')).toBe(false);
  });

  it('closes the pin hint when the tab is switched away', async () => {
    const pin = await addPost('tab_hint');
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    expect(hint().style.display).toBe('block');
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    setHidden(false);
    expect(hint().style.display).toBe('none');
  });

  it('lets go of a focused pill when the tab is switched away, so coming back does not reopen the card', async () => {
    userClick(await addPost('tab_focus'));
    found('tab_focus', 'Peru', 'Web App');
    const pill = document.querySelector('[data-handle="tab_focus"]');
    pill.focus();
    expect(document.activeElement).toBe(pill);
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    setHidden(false);
    expect(document.activeElement).not.toBe(pill);
  });

  it('leaves a button of the page itself focused even if it has a data-handle', () => {
    const own = document.createElement('button');
    own.dataset.handle = 'page_owned';
    document.body.append(own);
    own.focus();
    window.dispatchEvent(new Event('blur'));
    expect(document.activeElement).toBe(own);
    own.remove();
  });

  it('leaves focus on other elements alone when the tab is switched away', async () => {
    const input = document.createElement('input');
    document.body.append(input);
    input.focus();
    window.dispatchEvent(new Event('blur'));
    expect(document.activeElement).toBe(input);
    input.remove();
  });

  it('keeps the card when the tab becomes visible again', async () => {
    await hoverPill('tab_back');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(card().classList.contains('show')).toBe(true);
  });
});

describe('closing the hint and the card with Escape', () => {
  afterEach(removePosts);

  const card = () => document.querySelector('.xray-hover-card');
  const hint = () => document.querySelector('.xray-tooltip');
  const press = (el, key) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };

  async function shownPill(handle) {
    const pin = await addPost(handle);
    userClick(pin);
    found(handle, 'Peru', 'Web App');
    pin.dispatchEvent(new FocusEvent('focus'));
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(true));
    return pin;
  }

  it('hides the info card when Escape is pressed on the focused pill', async () => {
    const pill = await shownPill('esc_card');
    press(pill, 'Escape');
    expect(card().classList.contains('show')).toBe(false);
  });

  it('hides the pin hint when Escape is pressed on the focused pin', async () => {
    const pin = await addPost('esc_hint');
    pin.dispatchEvent(new FocusEvent('focus'));
    expect(hint().style.display).toBe('block');

    press(pin, 'Escape');
    expect(hint().style.display).toBe('none');
  });

  it('leaves the card and the hint alone for other keys', async () => {
    const pill = await shownPill('esc_other');
    for (const key of ['Enter', 'Tab', 'a', ' ', 'ArrowDown']) press(pill, key);
    expect(card().classList.contains('show')).toBe(true);

    const pin = await addPost('esc_other_pin');
    pin.dispatchEvent(new FocusEvent('focus'));
    press(pin, 'Tab');
    expect(hint().style.display).toBe('block');
  });

  it('does nothing, and does not fail, when Escape is pressed with nothing showing', async () => {
    const pin = await addPost('esc_none');
    expect(() => press(pin, 'Escape')).not.toThrow();
    expect(hint().style.display).not.toBe('block');
  });

  it('shows the card again when the pill gets focus again after Escape', async () => {
    const pill = await shownPill('esc_again');
    press(pill, 'Escape');
    pill.dispatchEvent(new FocusEvent('blur'));
    pill.dispatchEvent(new FocusEvent('focus'));
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(true));
  });

  it('does not stop the Escape key from reaching X', async () => {
    const pill = await shownPill('esc_pass');
    const event = press(pill, 'Escape');
    expect(event.defaultPrevented).toBe(false);

    const pin = await addPost('esc_pass_pin');
    expect(press(pin, 'Escape').defaultPrevented).toBe(false);
  });
});

describe('pin hint on a pin that turned into a pill', () => {
  afterEach(removePosts);

  const hint = () => document.querySelector('.xray-tooltip');
  const enter = (el) => el.dispatchEvent(new MouseEvent('mouseenter'));
  const focus = (el) => el.dispatchEvent(new FocusEvent('focus'));

  it('does not show the pin hint when focus or the pointer reaches a loading pill', async () => {
    const pin = await addPost('hint_loading');
    enter(pin);
    userClick(pin);
    expect(hint().style.display).toBe('none');

    focus(pin);
    expect(hint().style.display).toBe('none');
    enter(pin);
    expect(hint().style.display).toBe('none');
    found('hint_loading', 'Peru', 'Web App');
  });

  it('does not show the pin hint on a Not available pill, but shows it again once the pin is back', async () => {
    const pin = await addPost('hint_unavail');
    vi.useFakeTimers();
    userClick(pin);
    vi.advanceTimersByTime(10000);
    expect(pin.className).toBe('xray-pill unavailable');

    focus(pin);
    expect(hint().style.display).toBe('none');

    vi.advanceTimersByTime(3000);
    expect(pin.className).toBe('xray-pin');
    focus(pin);
    expect(hint().style.display).toBe('block');
  });

  it('hides the hint of a second pin by the same account when its lookup starts', async () => {
    const first = await addPost('hint_same');
    const second = await addPost('hint_same');
    enter(second);
    expect(hint().style.display).toBe('block');

    userClick(first);
    expect(second.className).toBe('xray-pill loading');
    expect(hint().style.display).toBe('none');
    found('hint_same', 'Peru', 'Web App');
  });

  it('still shows the hint on a normal pin and hides it again when focus leaves', async () => {
    const pin = await addPost('hint_normal');
    focus(pin);
    expect(hint().style.display).toBe('block');
    pin.dispatchEvent(new FocusEvent('blur'));
    expect(hint().style.display).toBe('none');
  });
});

describe('info card display', () => {
  const originalWidth = window.innerWidth;
  afterEach(() => {
    removePosts();
    window.innerWidth = originalWidth;
  });

  const card = () => document.querySelector('.xray-hover-card');
  const rows = () => [...card().querySelectorAll('.xray-hover-value')].map((el) => el.textContent.trim());

  async function resultPill(handle, location, source, rect) {
    const pin = await addPost(handle);
    userClick(pin);
    found(handle, location, source);
    if (rect)
      vi.spyOn(pin, 'getBoundingClientRect').mockReturnValue({ top: 60, bottom: 80, width: 80, height: 20, ...rect });
    return pin;
  }

  it('shows just Unknown for the platform when there is no app info, with no stray dot', async () => {
    const pill = await resultPill('card_noapp', 'Peru', '');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Unknown']);
    expect(card().textContent).not.toContain('·');
  });

  it('still shows the store country and platform when there is app info', async () => {
    const pill = await resultPill('card_app', 'Peru', 'United States App Store');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'United States · iOS']);

    const unnamed = await resultPill('card_app_only', 'Peru', 'Android App');
    unnamed.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Unknown · Android']);
  });

  it('names a store region that is not a country, the same in the pill and the info card', async () => {
    const pill = await resultPill('card_region', 'Europe', 'South Asia App Store');
    expect(pill.textContent).toContain('South Asia');

    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Europe', 'South Asia · iOS']);
    expect(card().querySelectorAll('.xray-hover-value')[1].querySelector('img')).toBeNull();
  });

  it('names other store regions and keeps the platform from the app text', async () => {
    const android = await resultPill('card_reg_andr', 'Kenya', 'Latin America Play Store');
    expect(android.textContent).toContain('Latin America');
    android.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Kenya', 'Latin America · Android']);
  });

  it('still shows a country store by its flag and name, and Unknown when an iOS app names no store', async () => {
    const country = await resultPill('card_country', 'Peru', 'Japan App Store');
    country.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Japan · iOS']);
    expect(card().querySelectorAll('.xray-hover-value')[1].querySelector('img.xray-flag')).not.toBeNull();

    const none = await resultPill('card_none', 'Peru', 'Twitter for iPhone');
    none.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Unknown · iOS']);
  });

  it('shows the location of the account as the platform country for the web app', async () => {
    const pill = await resultPill('card_web', 'Peru', 'Web App');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Peru · Web']);
    const platform = card().querySelectorAll('.xray-hover-value')[1];
    expect(platform.querySelector('img.xray-flag').getAttribute('src')).toBe(flagImages.pe);
  });

  it('also uses the location for a web app that X names with extra words', async () => {
    const plain = await resultPill('card_web_two', 'India', 'Web');
    plain.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['India', 'India · Web']);

    const twitter = await resultPill('card_web_three', 'Japan', 'Twitter Web App');
    twitter.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Japan', 'Japan · Web']);
  });

  it('shows the globe with the location for a web account whose location has no flag', async () => {
    const pill = await resultPill('card_web_reg', 'North America', 'Web App');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['North America', 'North America · Web']);
    const platform = card().querySelectorAll('.xray-hover-value')[1];
    expect(platform.querySelector('img')).toBeNull();
    expect(platform.querySelector('.xray-globe')).not.toBeNull();
    expect(platform.querySelector('.xray-chip')).not.toBeNull();
    expect(card().querySelectorAll('.xray-hover-value')[0].querySelector('.xray-chip')).not.toBeNull();
  });

  it('still shows Unknown for a web account that has no location', async () => {
    const pill = await resultPill('card_web_none', '', 'Web App');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Unknown', 'Unknown · Web']);
  });

  it('keeps the store country for iOS and Android, and a store region over the location', async () => {
    const ios = await resultPill('card_ios_keep', 'Peru', 'Japan App Store');
    ios.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Japan · iOS']);

    const android = await resultPill('card_and_keep', 'Peru', 'Android App');
    android.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Peru', 'Unknown · Android']);

    const region = await resultPill('card_reg_keep', 'Europe', 'South Asia App Store');
    region.dispatchEvent(new MouseEvent('mouseenter'));
    expect(rows()).toEqual(['Europe', 'South Asia · iOS']);
  });

  it('keeps the card inside the window when neither side has enough room', async () => {
    window.innerWidth = 300;
    const pill = await resultPill('card_narrow', 'Peru', 'iOS', { left: 100, right: 200 });
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(card().style.left)).toBe(300 - 210 - 8);
  });

  it('keeps the card off the left edge in a very small window', async () => {
    window.innerWidth = 200;
    const pill = await resultPill('card_tiny', 'Peru', 'iOS', { left: 20, right: 100 });
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(parseFloat(card().style.left)).toBe(8);
  });

  it('keeps the normal side-by-side placement when there is room', async () => {
    const pill = await resultPill('card_room', 'Peru', 'iOS', { left: 120, right: 200 });
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    expect(card().style.left).toBe('208px');
    expect(card().classList.contains('pos-left')).toBe(false);
  });

  it('hides the card when X removes the post it belongs to', async () => {
    const pill = await resultPill('card_gone', 'Peru', 'iOS');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(true));

    pill.closest('article').remove();
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(false));
  });

  it('keeps the card for a pill that is still on the page when other posts go away', async () => {
    const stays = await resultPill('card_stays', 'Peru', 'iOS');
    const other = await addPost('card_other');
    stays.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(card().classList.contains('show')).toBe(true));

    other.closest('article').remove();
    await settle();
    expect(card().classList.contains('show')).toBe(true);
  });

  it('does not show the card after the pointer already left', async () => {
    const pill = await resultPill('card_quick', 'Peru', 'iOS');
    pill.dispatchEvent(new MouseEvent('mouseenter'));
    pill.dispatchEvent(new MouseEvent('mouseleave'));
    await new Promise((r) => requestAnimationFrame(r));
    expect(card().classList.contains('show')).toBe(false);
  });
});

describe('account names that match built-in object names', () => {
  afterEach(removePosts);

  it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf'])(
    'gives @%s a pin, looks it up and shows the real result',
    async (handle) => {
      const pin = await addPost(handle);
      expect(pin.className).toBe('xray-pin');

      userClick(pin);
      expect(pin.className).toBe('xray-pill loading');
      found(handle, 'Peru', 'Web App');

      expect(pin.className).toBe('xray-pill');
      expect(pin.textContent).toContain('Peru');
      expect(pin.textContent).not.toContain('Unknown Loc');
    }
  );

  it('remembers a result for an account named __proto__ without touching other accounts', async () => {
    const pin = await addPost('__proto__');
    userClick(pin);
    found('__proto__', 'Chile', 'Web App');

    const again = await addKnownPost('__proto__');
    expect(again.textContent).toContain('Chile');

    const other = await addPost('plain_acct');
    expect(other.className).toBe('xray-pin');
    expect({}.loc).toBeUndefined();
  });

  it('still shows a saved result straight away for normal accounts', async () => {
    const pin = await addPost('normal_first');
    userClick(pin);
    found('normal_first', 'Japan', 'iOS');

    const again = await addKnownPost('normal_first');
    expect(again.className).toBe('xray-pill');
    expect(again.textContent).toContain('Japan');
  });
});

describe('the hidden lookup frame', () => {
  afterEach(removePosts);

  const frame = () => document.querySelector('iframe');

  it('is removed once an answer arrives and nothing else is waiting', async () => {
    const pin = await addPost('frame_done');
    userClick(pin);
    expect(frame()).not.toBeNull();

    found('frame_done', 'Peru', 'Web App');
    expect(frame()).toBeNull();
    expect(pin.textContent).toContain('Peru');
  });

  it('stays while other lookups are waiting, then goes after the last one', async () => {
    const first = await addPost('frame_a');
    const second = await addPost('frame_b');
    vi.useFakeTimers();
    userClick(first);
    userClick(second);

    found('frame_a', 'Peru', 'Web App');
    expect(frame()).not.toBeNull();

    vi.advanceTimersByTime(500);
    expect(frame().getAttribute('src')).toContain('/frame_b/about');
    found('frame_b', 'Chile', 'Web App');
    expect(frame()).toBeNull();
    expect(second.textContent).toContain('Chile');
  });

  it('is removed when X does not answer in time', async () => {
    const pin = await addPost('frame_slow');
    vi.useFakeTimers();
    userClick(pin);
    vi.advanceTimersByTime(10000);

    expect(pin.textContent.trim()).toBe('Not available');
    expect(frame()).toBeNull();
  });

  it('is made again for the next lookup', async () => {
    const first = await addPost('frame_one');
    userClick(first);
    found('frame_one', 'Peru', 'Web App');
    expect(frame()).toBeNull();

    const second = await addPost('frame_two');
    userClick(second);
    expect(frame().getAttribute('src')).toContain('/frame_two/about');
    found('frame_two', 'Chile', 'Web App');
    expect(second.textContent).toContain('Chile');
  });

  it('ignores a late answer from a frame that was already removed', async () => {
    const pin = await addPost('frame_late');
    vi.useFakeTimers();
    userClick(pin);
    const oldFrame = lookupFrame();
    vi.advanceTimersByTime(10000);
    expect(frame()).toBeNull();

    found('frame_late', 'Peru', 'Web App', oldFrame);
    expect(pin.textContent.trim()).toBe('Not available');
  });
});

describe('clicks made by page scripts', () => {
  afterEach(removePosts);

  // What a script on the page can send; the browser marks it as not coming from the user.
  const fakeClick = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  const state = (el) => ({ cls: el.className, text: el.textContent.trim() });
  // The page the hidden lookup frame was last sent to.
  const lookedUp = () => document.querySelector('iframe')?.getAttribute('src') ?? '';

  it('starts a lookup for a real click on the pin', async () => {
    const pin = await addPost('real_click');
    userClick(pin);
    expect(state(pin)).toEqual({ cls: 'xray-pill loading', text: 'Locating...' });
    found('real_click', 'Peru', 'Web App');
  });

  it('ignores a click or key press that a script makes up on the pin', async () => {
    const pin = await addPost('fake_click');
    fakeClick(pin);
    pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(state(pin)).toEqual({ cls: 'xray-pin', text: '' });
    expect(lookedUp()).not.toContain('fake_click');
  });

  it('leaves every pin alone when a script clicks all of them', async () => {
    const pins = [await addPost('fake_a'), await addPost('fake_b'), await addPost('fake_c')];
    document.querySelectorAll('button[data-handle]').forEach((b) => fakeClick(b));
    pins.forEach((pin) => expect(pin.className).toBe('xray-pin'));
    expect(lookedUp()).not.toMatch(/fake_[abc]/);
  });

  it('keeps a real click on a result pill from reaching X, and changes nothing', async () => {
    const pin = await addPost('click_pill');
    userClick(pin);
    found('click_pill', 'Chile', 'Web App');
    const before = pin.textContent;

    const event = { isTrusted: true, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    pin.onclick(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(pin.className).toBe('xray-pill');
    expect(pin.textContent).toBe(before);
  });

  it('ignores a script click on a result pill', async () => {
    const pin = await addPost('fake_pill');
    userClick(pin);
    found('fake_pill', 'Chile', 'Web App');

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    pin.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(pin.className).toBe('xray-pill');
  });
});

describe('keyboard and screen reader use', () => {
  afterEach(removePosts);

  const label = (el) => el.getAttribute('aria-label');
  const spoken = () => document.querySelector('[role="status"]').textContent;

  it('makes the pin a real button with a name, so Tab, Enter and Space work', async () => {
    const pin = await addPost('kbd_pin');
    expect(pin.tagName).toBe('BUTTON');
    expect(pin.type).toBe('button');
    expect(label(pin)).toBe('Get Location & App Store');
  });

  it('keeps the result pill a named button that says what it holds', async () => {
    const pin = await addPost('kbd_result');
    userClick(pin);
    found('kbd_result', 'Chile', 'Twitter for iPhone');

    const pill = document.querySelector('[data-handle="kbd_result"]');
    expect(pill).toBe(pin);
    expect(pill.tagName).toBe('BUTTON');
    expect(label(pill)).toBe('Location: Chile, iPhone');
  });

  it('names a result with no location or app plainly', async () => {
    const pin = await addPost('kbd_unknown');
    userClick(pin);
    found('kbd_unknown', '', '');
    expect(label(pin)).toBe('Location: Unknown');
  });

  it('keeps the name in step with each state and gives the pin back its name', async () => {
    const pin = await addPost('kbd_states');
    vi.useFakeTimers();
    userClick(pin);
    expect(label(pin)).toBe('Locating...');

    vi.advanceTimersByTime(10000);
    expect(label(pin)).toBe('Not available');

    vi.advanceTimersByTime(3000);
    expect(label(pin)).toBe('Get Location & App Store');
  });

  it('says out loud when a lookup starts, finishes or fails', async () => {
    const pin = await addPost('kbd_voice');
    userClick(pin);
    expect(spoken()).toBe('Looking up @kbd_voice');

    found('kbd_voice', 'Peru', 'Android App');
    expect(spoken()).toBe('@kbd_voice: Peru, Android');

    const slow = await addPost('kbd_voice_slow');
    vi.useFakeTimers();
    userClick(slow);
    vi.advanceTimersByTime(10000);
    expect(spoken()).toBe('Not available for @kbd_voice_slow');
  });

  it('does not start a second lookup when Enter or Space reaches a pill that is already looking up', async () => {
    const pin = await addPost('kbd_twice');
    userClick(pin);
    expect(pin.textContent.trim()).toBe('Locating...');

    userClick(pin);
    expect(pin.textContent.trim()).toBe('Locating...');
    expect(pin.className).toBe('xray-pill loading');

    // Finishes the lookup so the next test starts with an empty queue.
    found('kbd_twice', 'Spain', 'Web App');
    expect(pin.className).toBe('xray-pill');
  });

  it('shows the info card when the pill gets keyboard focus and hides it when focus leaves', async () => {
    const pin = await addPost('kbd_focus');
    userClick(pin);
    found('kbd_focus', 'Canada', 'iOS');

    const pill = document.querySelector('[data-handle="kbd_focus"]');
    pill.dispatchEvent(new FocusEvent('focus'));
    // An earlier test may have left the card open, so wait for this pill's details.
    await vi.waitFor(() => {
      const card = document.querySelector('.xray-hover-card');
      expect(card.classList.contains('show')).toBe(true);
      expect(card.textContent).toContain('Canada');
    });

    pill.dispatchEvent(new FocusEvent('blur'));
    expect(document.querySelector('.xray-hover-card').classList.contains('show')).toBe(false);
  });

  it('shows the pin hint on keyboard focus and hides it when focus leaves', async () => {
    const pin = await addPost('kbd_hint');
    pin.dispatchEvent(new FocusEvent('focus'));
    expect(document.querySelector('.xray-tooltip').style.display).toBe('block');

    pin.dispatchEvent(new FocusEvent('blur'));
    expect(document.querySelector('.xray-tooltip').style.display).toBe('none');
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

describe('auto reveal', () => {
  // The real timer, for things the page does in its own time (the fake clock does not move it).
  const realSetTimeout = setTimeout;
  const realWait = (ms) => new Promise((resolve) => realSetTimeout(resolve, ms));
  const observers = [];
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(el) {
      this.targets.add(el);
    }
    disconnect() {
      this.targets.clear();
    }
  }

  // Each test gets a clock later than the one before, so times kept from earlier tests are in the past.
  let clock = Date.now();
  const startClock = () => {
    clock += 10_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(clock);
  };
  const setSetting = (values) =>
    storageListeners.forEach((fn) =>
      fn(Object.fromEntries(Object.entries(values).map(([k, newValue]) => [k, { newValue }])), 'sync')
    );
  const turnOn = (delaySec = 2) => setSetting({ autoReveal: true, autoDelaySec: delaySec });
  const setVisible = (el, isIntersecting = true) => observers.at(-1).callback([{ target: el, isIntersecting }]);
  // Several pins reported by the browser in one go.
  const setAllVisible = (els) => observers.at(-1).callback(els.map((target) => ({ target, isIntersecting: true })));
  const frameSrc = () => document.querySelector('iframe')?.getAttribute('src') ?? '';
  // The account being looked up right now, or '' when none is (a waiting frame is blank).
  const lookingUp = () => frameSrc().match(/[/]([A-Za-z0-9_]+)[/]about/)?.[1] ?? '';
  const setHidden = (value) => Object.defineProperty(document, 'hidden', { configurable: true, value });
  const middleAt = (el, centre) =>
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: centre - 10, bottom: centre + 10 });
  const spoken = () => document.querySelector('[role="status"]').textContent;

  beforeAll(() => {
    globalThis.IntersectionObserver = FakeIntersectionObserver;
  });
  afterEach(() => {
    setHidden(false);
    setSetting({ autoReveal: false });
    // Lets a lookup that is still running finish, so it cannot get in the way of the next test.
    const running = frameSrc().match(/\/([A-Za-z0-9_]+)\/about/);
    if (running) found(running[1], 'Peru', 'Web App');
    removePosts();
  });

  it('does nothing while the setting is off', async () => {
    const before = observers.length;
    await addPost('auto_off');
    expect(observers.length).toBe(before);
    expect(lookingUp()).toBe('');
  });

  it('looks up a pin that is on screen once it is switched on', async () => {
    const pin = await addPost('auto_on');
    startClock();
    turnOn();
    setVisible(pin);
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_on/about');
    expect(pin.classList.contains('loading')).toBe(true);
  });

  it('also watches pins that appear after it was switched on', async () => {
    startClock();
    turnOn();
    const article = newPost('auto_later');
    await realWait(50);
    await vi.advanceTimersByTimeAsync(50);
    const pin = article.querySelector('.xray-pin');
    setVisible(pin);
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_later/about');
  });

  it('leaves a pin alone while it is not on screen, and while it is only scrolled past', async () => {
    const away = await addPost('auto_away');
    const passed = await addPost('auto_passed');
    startClock();
    turnOn();
    setVisible(passed);
    setVisible(passed, false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');
    expect(away.className).toBe('xray-pin');
    expect(passed.className).toBe('xray-pin');
  });

  it('asks for the account at the top of the screen first', async () => {
    const top = await addPost('auto_top');
    const middle = await addPost('auto_middle');
    middleAt(top, 50);
    middleAt(middle, window.innerHeight / 2 + 20);
    startClock();
    turnOn();
    setAllVisible([middle, top]);
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_top/about');
  });

  it('waits the chosen time after a lookup before the next one', async () => {
    const first = await addPost('auto_first');
    const second = await addPost('auto_second');
    middleAt(first, 300);
    middleAt(second, window.innerHeight / 2);
    startClock();
    turnOn(5);
    setVisible(first);
    setVisible(second);
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_first/about');

    found('auto_first', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(4900);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(100);
    expect(frameSrc()).toContain('/auto_second/about');
  });

  it('uses a new delay as soon as the setting changes', async () => {
    const first = await addPost('auto_d1');
    const second = await addPost('auto_d2');
    middleAt(first, 300);
    middleAt(second, window.innerHeight / 2);
    startClock();
    turnOn(10);
    setVisible(first);
    setVisible(second);
    await vi.advanceTimersByTimeAsync(0);
    found('auto_d1', 'Peru', 'Web App');
    setSetting({ autoDelaySec: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(frameSrc()).toContain('/auto_d2/about');
  });

  it('ignores a delay that is not one of the choices', async () => {
    const first = await addPost('auto_bad1');
    const second = await addPost('auto_bad2');
    middleAt(first, 300);
    middleAt(second, window.innerHeight / 2);
    startClock();
    turnOn(2);
    setVisible(first);
    setVisible(second);
    await vi.advanceTimersByTimeAsync(0);
    found('auto_bad1', 'Peru', 'Web App');
    setSetting({ autoDelaySec: 1 });
    await vi.advanceTimersByTimeAsync(4900);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(100);
    expect(frameSrc()).toContain('/auto_bad2/about');
  });

  it('does one lookup for an account that has several pins on screen', async () => {
    const one = await addPost('auto_twin');
    const other = document.createElement('article');
    other.dataset.testid = 'tweet';
    other.innerHTML =
      '<div data-testid="User-Name"><a href="/auto_twin">x</a></div><div><div data-testid="caret"></div></div>';
    document.body.append(other);
    await vi.waitFor(() => expect(other.querySelector('.xray-pin')).not.toBeNull());
    const two = other.querySelector('.xray-pin');
    startClock();
    turnOn();
    setVisible(one);
    setVisible(two);
    await vi.advanceTimersByTimeAsync(0);
    expect(one.classList.contains('loading')).toBe(true);
    expect(two.classList.contains('loading')).toBe(true);
    found('auto_twin', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(20000);
    expect(lookingUp()).toBe('');
    expect(one.classList.contains('xray-pill')).toBe(true);
    expect(two.classList.contains('xray-pill')).toBe(true);
  });

  it('never asks again for an account that gave no answer', async () => {
    const pin = await addPost('auto_silent');
    startClock();
    turnOn();
    setVisible(pin);
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_silent/about');
    await vi.advanceTimersByTimeAsync(10000);
    expect(pin.textContent).toContain('Not available');
    await vi.advanceTimersByTimeAsync(60000);
    expect(pin.className).toBe('xray-pin');
    expect(lookingUp()).toBe('');
  });

  it('waits while the tab is hidden and goes on when it is visible again', async () => {
    const pin = await addPost('auto_hidden');
    startClock();
    setHidden(true);
    turnOn();
    setVisible(pin);
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(frameSrc()).toContain('/auto_hidden/about');
  });

  it('stops when it is switched off', async () => {
    const pin = await addPost('auto_stop');
    startClock();
    turnOn();
    setVisible(pin);
    setSetting({ autoReveal: false });
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');
    expect(pin.className).toBe('xray-pin');
  });

  it('still starts a lookup at once when the user clicks a pin', async () => {
    const pin = await addPost('auto_manual');
    startClock();
    turnOn(10);
    userClick(pin);
    expect(frameSrc()).toContain('/auto_manual/about');
    expect(spoken()).toBe('Looking up @auto_manual');
    found('auto_manual', 'Peru', 'Web App');
  });

  it('does not tell screen readers about every automatic lookup', async () => {
    const pin = await addPost('auto_quiet');
    startClock();
    turnOn();
    const before = spoken();
    setVisible(pin);
    await vi.advanceTimersByTimeAsync(0);
    found('auto_quiet', 'Peru', 'Web App');
    expect(pin.classList.contains('xray-pill')).toBe(true);
    expect(spoken()).toBe(before);
  });

  const labelOf = (pin) => pin.textContent.trim();

  it('marks every pin on screen Queued and looks them up one by one', async () => {
    const pins = [];
    for (const name of ['q_near', 'q_mid', 'q_far']) pins.push(await addPost(name));
    middleAt(pins[0], window.innerHeight / 2);
    middleAt(pins[1], window.innerHeight / 2 + 100);
    middleAt(pins[2], window.innerHeight / 2 + 200);
    startClock();
    turnOn(3);
    setAllVisible(pins);
    await vi.advanceTimersByTimeAsync(0);
    expect(pins.map(labelOf)).toEqual(['Locating...', 'Queued...', 'Queued...']);

    found('q_near', 'Peru', 'Web App');
    expect(labelOf(pins[1])).toBe('Locating...');
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(3000);
    expect(lookingUp()).toBe('q_mid');
    expect(labelOf(pins[2])).toBe('Queued...');

    found('q_mid', 'Chile', 'Web App');
    await vi.advanceTimersByTimeAsync(3000);
    expect(lookingUp()).toBe('q_far');
  });

  it('adds a pin that scrolls into view to the end of the line', async () => {
    const first = await addPost('q_late_a');
    const second = await addPost('q_late_b');
    startClock();
    turnOn(2);
    setVisible(first);
    await vi.advanceTimersByTimeAsync(0);
    setVisible(second);
    expect(labelOf(second)).toBe('Queued...');
  });

  it('gives a queued pin back once its post is neither on screen nor next to it', async () => {
    const first = await addPost('q_gone_a');
    await addPost('q_gone_x');
    await addPost('q_gone_y');
    const second = await addPost('q_gone_b');
    middleAt(first, window.innerHeight / 2);
    middleAt(second, window.innerHeight / 2 + 100);
    startClock();
    turnOn(2);
    setAllVisible([first, second]);
    await vi.advanceTimersByTimeAsync(0);
    expect(labelOf(second)).toBe('Queued...');

    setVisible(second, false);
    expect(second.className).toBe('xray-pin');
    found('q_gone_a', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(5000);
    expect(lookingUp()).toBe('q_gone_x');
  });

  it('stops the running lookup when its post is scrolled away, and looks up the new view after a short wait', async () => {
    const [a, , , , z] = await postsOf('scr_a', 'scr_f1', 'scr_f2', 'scr_f3', 'scr_z');
    startClock();
    turnOn(10);
    setVisible(a);
    await vi.advanceTimersByTimeAsync(0);
    expect(labelOf(a)).toBe('Locating...');
    const oldFrame = lookupFrame();

    setVisible(a, false);
    expect(a.className).toBe('xray-pin');
    setVisible(z);
    expect(labelOf(z)).toBe('Locating...');
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(499);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(1);
    expect(lookingUp()).toBe('scr_z');

    // The cancelled lookup can still answer later; that answer is ignored.
    found('scr_a', 'Peru', 'Web App', oldFrame);
    expect(a.className).toBe('xray-pin');
    expect(lookingUp()).toBe('scr_z');
  });

  it('also looks up the new view after a short wait when the old view was only waiting out the delay', async () => {
    const [a, b, , , z] = await postsOf('wd_a', 'wd_b', 'wd_f2', 'wd_f3', 'wd_z');
    startClock();
    turnOn(10);
    setVisible(a);
    await vi.advanceTimersByTimeAsync(0);
    found('wd_a', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(600);
    expect(labelOf(b)).toBe('Locating...');
    expect(lookingUp()).toBe('');

    setVisible(a, false);
    expect(b.className).toBe('xray-pin');
    setVisible(z);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(500);
    expect(lookingUp()).toBe('wd_z');
  });

  it('keeps the chosen delay when scrolling only a little, even if the post up next is left behind', async () => {
    const pins = await postsOf('ds_1', 'ds_2', 'ds_3', 'ds_4', 'ds_5', 'ds_6', 'ds_7', 'ds_8');
    startClock();
    turnOn(10);
    setAllVisible([pins[0], pins[1]]);
    await vi.advanceTimersByTimeAsync(0);
    found('ds_1', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(600);
    expect(labelOf(pins[1])).toBe('Locating...');

    // Two posts down: the post up next is out of range, but the new view still overlaps the old one.
    observers.at(-1).callback([
      { target: pins[0], isIntersecting: false },
      { target: pins[1], isIntersecting: false },
      { target: pins[4], isIntersecting: true },
      { target: pins[5], isIntersecting: true },
    ]);
    expect(pins[1].className).toBe('xray-pin');
    expect(labelOf(pins[4])).toBe('Locating...');
    await vi.advanceTimersByTimeAsync(8000);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(1500);
    expect(lookingUp()).toBe('ds_5');
  });

  it('sends no request for posts a fast scroll only passes, just for the one it stops on', async () => {
    const pins = await postsOf('fs_1', 'fs_2', 'fs_3', 'fs_4', 'fs_5', 'fs_6', 'fs_7', 'fs_8', 'fs_9');
    startClock();
    turnOn(10);
    setVisible(pins[0]);
    await vi.advanceTimersByTimeAsync(0);
    expect(lookingUp()).toBe('fs_1');

    // Each step lands on a new post before the wait is over, so the wait starts again.
    for (const [from, to] of [
      [0, 3],
      [3, 5],
      [5, 8],
    ]) {
      setVisible(pins[from], false);
      setVisible(pins[to]);
      expect(lookingUp()).toBe('');
      await vi.advanceTimersByTimeAsync(300);
    }
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(200);
    expect(lookingUp()).toBe('fs_9');
  });

  it('gives back the queued pins of the old view and queues the new view, first one Locating', async () => {
    const pins = await postsOf('scv_1', 'scv_2', 'scv_3', 'scv_4', 'scv_5', 'scv_6', 'scv_7', 'scv_8');
    startClock();
    turnOn(10);
    setVisible(pins[0]);
    await vi.advanceTimersByTimeAsync(0);
    expect(pins.map(labelOf).slice(0, 3)).toEqual(['Locating...', 'Queued...', 'Queued...']);

    setVisible(pins[0], false);
    setAllVisible([pins[6], pins[7]]);
    expect(pins.slice(0, 3).map((pin) => pin.className)).toEqual(['xray-pin', 'xray-pin', 'xray-pin']);
    expect(pins.slice(4).map(labelOf)).toEqual(['Queued...', 'Queued...', 'Locating...', 'Queued...']);
  });

  it('keeps the running lookup while its post is still next to the screen', async () => {
    const [a, b, c] = await postsOf('kp_a', 'kp_b', 'kp_c');
    startClock();
    turnOn(10);
    setVisible(a);
    await vi.advanceTimersByTimeAsync(0);
    // The browser reports both changes in one go.
    observers.at(-1).callback([
      { target: a, isIntersecting: false },
      { target: b, isIntersecting: true },
    ]);
    expect(lookingUp()).toBe('kp_a');
    expect(labelOf(a)).toBe('Locating...');
    expect(labelOf(c)).toBe('Queued...');
  });

  it('does not stop a lookup the user asked for when its post is scrolled away', async () => {
    const [a, , , , z] = await postsOf('mn_a', 'mn_f1', 'mn_f2', 'mn_f3', 'mn_z');
    startClock();
    turnOn(10);
    userClick(a);
    expect(lookingUp()).toBe('mn_a');
    setVisible(z);
    expect(lookingUp()).toBe('mn_a');
    expect(labelOf(a)).toBe('Locating...');
  });

  it('lets a lookup the user asked for go ahead of the queued ones', async () => {
    const first = await addPost('q_user_a');
    const second = await addPost('q_user_b');
    await addPost('q_user_x');
    await addPost('q_user_y');
    const manual = await addPost('q_user_c');
    middleAt(first, window.innerHeight / 2);
    middleAt(second, window.innerHeight / 2 + 100);
    startClock();
    turnOn(10);
    setAllVisible([first, second]);
    await vi.advanceTimersByTimeAsync(0);
    expect(lookingUp()).toBe('q_user_a');

    userClick(manual);
    expect(labelOf(manual)).toBe('Queued...');
    found('q_user_a', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(600);
    expect(lookingUp()).toBe('q_user_c');
    expect(labelOf(second)).toBe('Queued...');
  });

  it('gives every queued pin back when it is switched off', async () => {
    const first = await addPost('q_off_a');
    const second = await addPost('q_off_b');
    startClock();
    turnOn(2);
    setAllVisible([first, second]);
    await vi.advanceTimersByTimeAsync(0);
    setSetting({ autoReveal: false });
    expect(second.className).toBe('xray-pin');
    await vi.advanceTimersByTimeAsync(60000);
    expect(second.className).toBe('xray-pin');
  });

  it('keeps at most 20 lookups in line', async () => {
    const pins = [];
    for (let i = 0; i < 25; i++) pins.push(await addPost(`q_many_${i}`));
    startClock();
    turnOn(2);
    setAllVisible(pins);
    await vi.advanceTimersByTimeAsync(0);
    expect(pins.filter((pin) => pin.classList.contains('loading')).length).toBe(20);
  });

  it('does not queue anything while the tab is hidden, and queues the visible pins when it is back', async () => {
    const pin = await addPost('q_hidden');
    startClock();
    setHidden(true);
    turnOn();
    setVisible(pin);
    expect(pin.className).toBe('xray-pin');
    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(pin.classList.contains('loading')).toBe(true);
  });

  async function resolved(handle) {
    const pin = await addPost(handle);
    userClick(pin);
    found(handle, 'Peru', 'Web App');
    return pin;
  }

  async function postsOf(...names) {
    const pins = [];
    for (const name of names) pins.push(await addPost(name));
    return pins;
  }

  it('also queues the two posts just below and just above the ones on screen', async () => {
    const pins = await postsOf('nb_1', 'nb_2', 'nb_3', 'nb_4', 'nb_5', 'nb_6', 'nb_7');
    startClock();
    turnOn(2);
    setVisible(pins[3]);
    await vi.advanceTimersByTimeAsync(0);
    expect(pins.map(labelOf)).toEqual(['', 'Queued...', 'Queued...', 'Locating...', 'Queued...', 'Queued...', '']);
    expect(pins[0].className).toBe('xray-pin');
    expect(pins[6].className).toBe('xray-pin');
  });

  it('looks up the nearest posts first: below, then above, then one further each way', async () => {
    const pins = await postsOf('nbo_1', 'nbo_2', 'nbo_3', 'nbo_4', 'nbo_5');
    startClock();
    turnOn(2);
    setVisible(pins[2]);
    await vi.advanceTimersByTimeAsync(0);
    for (const name of ['nbo_3', 'nbo_4', 'nbo_2', 'nbo_5', 'nbo_1']) {
      expect(lookingUp()).toBe(name);
      found(name, 'Peru', 'Web App');
      await vi.advanceTimersByTimeAsync(2000);
    }
    expect(lookingUp()).toBe('');
  });

  it('stops after two posts each way, even when those lookups have finished', async () => {
    const pins = await postsOf('nbs_1', 'nbs_2', 'nbs_3', 'nbs_4', 'nbs_5', 'nbs_6', 'nbs_7');
    startClock();
    turnOn(2);
    setVisible(pins[3]);
    await vi.advanceTimersByTimeAsync(0);
    for (const name of ['nbs_4', 'nbs_5', 'nbs_3', 'nbs_6', 'nbs_2']) {
      expect(lookingUp()).toBe(name);
      found(name, 'Peru', 'Web App');
      await vi.advanceTimersByTimeAsync(2000);
    }
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');
    expect(pins[0].className).toBe('xray-pin');
    expect(pins[6].className).toBe('xray-pin');
  });

  it('does nothing extra for a next post whose account already has a result', async () => {
    const visible = await addPost('nbk_vis');
    await resolved('nbk_known');
    const far = await addPost('nbk_far');
    startClock();
    turnOn(2);
    setVisible(visible);
    await vi.advanceTimersByTimeAsync(0);
    expect(lookingUp()).toBe('nbk_vis');
    found('nbk_vis', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');
    expect(far.className).toBe('xray-pin');
  });

  it('counts a post that already has a result as on screen, so the range is exact', async () => {
    const above = await addPost('nbr_above');
    const known = await resolved('nbr_known');
    const below = await addPost('nbr_below');
    startClock();
    turnOn(2);
    setVisible(known);
    await vi.advanceTimersByTimeAsync(0);
    expect(above.classList.contains('loading')).toBe(true);
    expect(below.classList.contains('loading')).toBe(true);
  });

  it('queues nothing next to a post when no post is on screen', async () => {
    const pins = await postsOf('nbn_1', 'nbn_2', 'nbn_3');
    startClock();
    turnOn(2);
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');
    expect(pins.map((pin) => pin.className)).toEqual(['xray-pin', 'xray-pin', 'xray-pin']);
  });

  it('looks up the post at the top of the screen first, then the ones below it', async () => {
    const [top, middle, bottom] = await postsOf('ord_top', 'ord_mid', 'ord_bottom');
    middleAt(top, 80);
    middleAt(middle, window.innerHeight / 2);
    middleAt(bottom, window.innerHeight - 60);
    startClock();
    turnOn(2);
    // The browser can report them in any order.
    setAllVisible([bottom, middle, top]);
    await vi.advanceTimersByTimeAsync(0);
    expect(lookingUp()).toBe('ord_top');
    found('ord_top', 'Peru', 'Web App');
    await vi.advanceTimersByTimeAsync(2000);
    expect(lookingUp()).toBe('ord_mid');
    found('ord_mid', 'Chile', 'Web App');
    await vi.advanceTimersByTimeAsync(2000);
    expect(lookingUp()).toBe('ord_bottom');
  });

  it('puts the post at the top of the screen next in line, even when it was reported after the others', async () => {
    const pins = await postsOf('srt_1', 'srt_2', 'srt_3', 'srt_4', 'srt_5', 'srt_6');
    middleAt(pins[2], 100);
    middleAt(pins[3], 400);
    startClock();
    turnOn(5);
    // The browser reports the lower post first, then the one above it.
    setVisible(pins[3]);
    await vi.advanceTimersByTimeAsync(0);
    expect(lookingUp()).toBe('srt_4');
    setVisible(pins[2]);
    found('srt_4', 'Peru', 'Web App');

    expect(pins.map(labelOf)).toEqual(['Queued...', 'Queued...', 'Locating...', 'Peru', 'Queued...', 'Queued...']);
    await vi.advanceTimersByTimeAsync(5000);
    expect(lookingUp()).toBe('srt_3');
    found('srt_3', 'Chile', 'Web App');
    await vi.advanceTimersByTimeAsync(5000);
    // Then the post below, then the one above.
    expect(lookingUp()).toBe('srt_5');
  });

  it('keeps a lookup the user asked for ahead of the sorted ones', async () => {
    const pins = await postsOf('srm_1', 'srm_2', 'srm_3', 'srm_4', 'srm_5', 'srm_6', 'srm_7');
    middleAt(pins[2], 100);
    middleAt(pins[3], 400);
    startClock();
    turnOn(5);
    setVisible(pins[3]);
    await vi.advanceTimersByTimeAsync(0);
    userClick(pins[6]);
    setVisible(pins[2]);
    found('srm_4', 'Peru', 'Web App');
    expect(labelOf(pins[6])).toBe('Queued...');
    await vi.advanceTimersByTimeAsync(600);
    expect(lookingUp()).toBe('srm_7');
  });

  it('says Locating on the next pill as soon as one is revealed, and sends its request after the cooldown', async () => {
    const [a, b, c] = await postsOf('lab_a', 'lab_b', 'lab_c');
    middleAt(a, 100);
    middleAt(b, 300);
    middleAt(c, 500);
    startClock();
    turnOn(5);
    setAllVisible([a, b, c]);
    await vi.advanceTimersByTimeAsync(0);
    expect([a, b, c].map(labelOf)).toEqual(['Locating...', 'Queued...', 'Queued...']);

    found('lab_a', 'Peru', 'Web App');
    expect(labelOf(b)).toBe('Locating...');
    expect(labelOf(c)).toBe('Queued...');
    expect(lookingUp()).toBe('');

    await vi.advanceTimersByTimeAsync(4900);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(100);
    expect(lookingUp()).toBe('lab_b');

    found('lab_b', 'Chile', 'Web App');
    expect(labelOf(c)).toBe('Locating...');
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(5000);
    expect(lookingUp()).toBe('lab_c');
  });

  it('also says Locating on the next pill when a lookup gets no answer', async () => {
    // A good answer first, so failures from earlier tests do not count towards a pause.
    await resolved('lab_reset');
    const [a, b] = await postsOf('lab_slow', 'lab_next');
    middleAt(a, 100);
    middleAt(b, 300);
    startClock();
    turnOn(5);
    setAllVisible([a, b]);
    await vi.advanceTimersByTimeAsync(0);
    expect(labelOf(b)).toBe('Queued...');
    await vi.advanceTimersByTimeAsync(10000);
    expect(labelOf(a)).toBe('Not available');
    expect(labelOf(b)).toBe('Locating...');
    await vi.advanceTimersByTimeAsync(5000);
    expect(lookingUp()).toBe('lab_next');
  });

  it('keeps a pin that is not next in line on Queued', async () => {
    const [a, b, c] = await postsOf('lab2_a', 'lab2_b', 'lab2_c');
    middleAt(a, 100);
    middleAt(b, 300);
    middleAt(c, 500);
    startClock();
    turnOn(2);
    setAllVisible([a, b, c]);
    await vi.advanceTimersByTimeAsync(0);
    expect(labelOf(b)).toBe('Queued...');
    expect(labelOf(c)).toBe('Queued...');
  });

  it('pauses for five minutes after five lookups in a row get no answer', async () => {
    const pins = [];
    for (let i = 1; i <= 7; i++) pins.push(await addPost(`auto_pause_${i}`));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    startClock();
    turnOn(2);
    // A good answer first, so earlier tests' failures do not count.
    setVisible(pins[0]);
    await vi.advanceTimersByTimeAsync(0);
    found('auto_pause_1', 'Peru', 'Web App');
    pins.slice(1).forEach((pin) => setVisible(pin));

    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(12000);
    await vi.advanceTimersByTimeAsync(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Auto reveal paused'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(lookingUp()).toBe('');

    // The pause ends five minutes after the fifth failure, which was 60 seconds in.
    await vi.advanceTimersByTimeAsync(238000);
    expect(lookingUp()).toBe('');
    await vi.advanceTimersByTimeAsync(4000);
    expect(frameSrc()).toContain('/auto_pause_7/about');
    warn.mockRestore();
  });
});
