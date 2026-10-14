// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';

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
