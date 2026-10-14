// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
let getFlagHtml;
let cleanSource;

beforeAll(() => {
  // content.js asks for parser.js's URL as soon as it loads.
  globalThis.chrome = { runtime: { getURL: (path) => `chrome-extension://test/${path}` } };
  ({ getFlagHtml, cleanSource } = require('../src/content.js'));
});

// Renders helper output so assertions check what the user sees, not markup strings.
function render(html) {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

const flagCode = (el) =>
  el
    .querySelector('img.flag-img')
    ?.getAttribute('src')
    .match(/w40\/(\w+)\.png$/)[1];

describe('getFlagHtml', () => {
  it('shows the flag for a country name, ignoring case', () => {
    expect(flagCode(render(getFlagHtml('Germany')))).toBe('de');
    expect(flagCode(render(getFlagHtml('JAPAN')))).toBe('jp');
  });

  it('finds a known place inside a longer location', () => {
    expect(flagCode(render(getFlagHtml('London, England')))).toBe('gb');
  });

  it('prefers the longer name when one country name contains another', () => {
    expect(flagCode(render(getFlagHtml('South Sudan')))).toBe('ss');
    expect(flagCode(render(getFlagHtml('Nigeria')))).toBe('ng');
    expect(flagCode(render(getFlagHtml('Niger')))).toBe('ne');
    expect(flagCode(render(getFlagHtml('Papua New Guinea')))).toBe('pg');
  });

  it('shows the globe for unknown or missing locations', () => {
    for (const loc of ['Atlantis', '', null, undefined]) {
      const el = render(getFlagHtml(loc));
      expect(el.querySelector('img')).toBeNull();
      expect(el.querySelector('.globe-icon svg')).not.toBeNull();
    }
  });
});

describe('cleanSource', () => {
  it('returns Unknown when there is no source', () => {
    expect(cleanSource(null, 'India')).toBe('Unknown');
    expect(cleanSource('', 'India')).toBe('Unknown');
  });

  it('replaces the platform name with its icon', () => {
    const iphone = render(cleanSource('Twitter for iPhone', null));
    expect(iphone.querySelectorAll('svg')).toHaveLength(1);
    expect(iphone.textContent).not.toMatch(/Twitter for|iPhone/);

    for (const source of ['Android App', 'Web App']) {
      const el = render(cleanSource(source, null));
      expect(el.querySelectorAll('svg')).toHaveLength(1);
      expect(el.textContent.trim()).toBe('');
    }
  });

  it('does not repeat the location already shown in the pill', () => {
    const el = render(cleanSource('India App Store', 'India'));
    expect(el.querySelector('img.flag-img')).toBeNull();
    expect(el.textContent).not.toMatch(/India/);
    expect(el.querySelectorAll('svg')).toHaveLength(1);
  });

  it('flags the store country when it differs from the location', () => {
    const el = render(cleanSource('United States App Store', 'India'));
    expect(flagCode(el)).toBe('us');
    expect(el.textContent).not.toMatch(/United States/);
  });

  it('handles locations containing regex characters', () => {
    expect(() => cleanSource('Web App', 'C++ (test) [x]')).not.toThrow();
    expect(render(cleanSource('Web App', 'C++ (test) [x]')).querySelectorAll('svg')).toHaveLength(1);
  });
});

describe('pin lookups', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('article').forEach((a) => a.remove());
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

  const state = (el) => ({
    cls: el.className,
    text: el.textContent.trim(),
    clickable: el.style.pointerEvents !== 'none',
  });

  // What parser.js sends when X's About page answers.
  const found = (handle, location, source) =>
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://x.com',
        data: { type: 'X_LOCATION_FOUND', handle, location, source },
      })
    );

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

  it('keeps a result that arrives while Not available is showing', async () => {
    const pin = await addPost('late_acct');
    vi.useFakeTimers();
    pin.click();
    vi.advanceTimersByTime(10000);

    found('late_acct', 'Japan', 'Web App');
    vi.advanceTimersByTime(3000);

    const pill = document.querySelector('[data-handle="late_acct"]');
    expect(pill.className).toBe('loc-pill');
    expect(pill.textContent).toContain('Japan');
  });
});
