// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const html = readFileSync(require.resolve('../src/popup.html'), 'utf8');
const { countSavedResults, clearSavedResults } = require('../src/saved-results.js');

let data;
let removeFails;
let syncData;
let syncFails;
const flush = () => vi.advanceTimersByTimeAsync(0);
const button = () => document.getElementById('clearSaved');

async function openPopup(values, { readFails = false, sync = {}, syncReadFails = false } = {}) {
  data = new Map(Object.entries(values));
  removeFails = false;
  syncData = new Map(Object.entries(sync));
  syncFails = false;
  document.body.replaceChildren(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
  globalThis.countSavedResults = countSavedResults;
  globalThis.clearSavedResults = clearSavedResults;
  Object.assign(globalThis, require('../src/settings.js'));
  globalThis.chrome = {
    runtime: { getURL: (p) => p, getManifest: () => ({ version: '9.9' }) },
    tabs: { create: async () => {} },
    storage: {
      sync: {
        get: async (defaults) => {
          if (syncReadFails) throw new Error('storage failed');
          return { ...defaults, ...Object.fromEntries(syncData) };
        },
        set: async (values) => {
          if (syncFails) throw new Error('storage failed');
          Object.entries(values).forEach(([k, v]) => syncData.set(k, v));
        },
      },
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

describe('the clear cache section', () => {
  const info = () => document.getElementById('cacheInfo').textContent;

  it('shows how many cached records there are, with a small description', async () => {
    await openPopup({ 'loc:a': {}, 'loc:b': {}, other: 1 });
    expect(info()).toContain('Cached records: 2');
    expect(info()).toContain('looked up again');
    expect(button().textContent).toBe('Clear');
    expect(button().disabled).toBe(false);
  });

  it('is switched off when nothing is saved', async () => {
    await openPopup({ other: 1 });
    expect(info()).toContain('Cached records: 0');
    expect(button().disabled).toBe(true);
  });

  it('has the label on the left and the button on the right', async () => {
    await openPopup({});
    const row = document.querySelector('#cacheCard .card-row');
    expect(row.firstElementChild.textContent).toBe('Clear cache');
    expect(row.lastElementChild).toBe(button());
    expect(document.getElementById('cacheCard').contains(document.getElementById('cacheInfo'))).toBe(true);
  });

  it('asks for a second click first and clears nothing yet', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    await flush();
    expect(button().textContent).toBe('Click again');
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
    expect(button().disabled).toBe(true);
    expect(info()).toContain('Cached records: 0');
  });

  it('goes back to the first step when the second click comes too late', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    await vi.advanceTimersByTimeAsync(3001);
    expect(button().textContent).toBe('Clear');
    expect(button().classList.contains('confirming')).toBe(false);
    button().click();
    await flush();
    expect(data.has('loc:a')).toBe(true);
    expect(button().textContent).toBe('Click again');
  });

  it('shows the normal label again a few seconds after clearing', async () => {
    await openPopup({ 'loc:a': {} });
    button().click();
    button().click();
    await flush();
    await vi.advanceTimersByTimeAsync(3001);
    expect(button().textContent).toBe('Clear');
    expect(button().disabled).toBe(true);
  });

  it('keeps the records and says so when clearing fails, then offers the button again', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({ 'loc:a': {} });
    removeFails = true;
    button().click();
    button().click();
    await flush();
    expect(data.has('loc:a')).toBe(true);
    expect(button().textContent).toBe('Try again');
    expect(button().disabled).toBe(false);
    expect(info()).toBe('Could not clear cached records.');
    await vi.advanceTimersByTimeAsync(3001);
    expect(button().textContent).toBe('Clear');
    expect(info()).toContain('Cached records: 1');
    warn.mockRestore();
  });

  it('says so, and switches the button off, when the cached records cannot be read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({ 'loc:a': {} }, { readFails: true });
    expect(info()).toBe('Could not read cached records.');
    expect(button().disabled).toBe(true);
    warn.mockRestore();
  });
});

describe('the auto reveal controls', () => {
  const toggle = () => document.getElementById('autoReveal');
  const delay = () => document.getElementById('autoDelay');
  const choose = async (value) => {
    delay().value = value;
    delay().dispatchEvent(new Event('change'));
    await flush();
  };
  const flip = async () => {
    toggle().checked = !toggle().checked;
    toggle().dispatchEvent(new Event('change'));
    await flush();
  };

  it('starts switched off with the 5 second choice, and the delay cannot be changed yet', async () => {
    await openPopup({});
    expect(toggle().checked).toBe(false);
    expect(delay().value).toBe('5');
    expect(delay().disabled).toBe(true);
  });

  it('offers only the allowed delays', async () => {
    await openPopup({});
    expect([...delay().options].map((o) => o.value)).toEqual(['2', '3', '5', '10']);
  });

  it('names the card Auto Reveal Location, with a short subtitle', async () => {
    await openPopup({});
    expect(document.getElementById('autoTitle').textContent).toBe('Auto Reveal Location');
    expect(document.getElementById('autoInfo').textContent).toBe('Auto reveal location while scrolling X.');
  });

  it('shows the warning on its own line, below the description', async () => {
    await openPopup({});
    const info = document.getElementById('autoInfo');
    const warning = document.getElementById('autoWarning');
    expect(info.textContent).not.toContain('rate limit');
    expect(warning.textContent.trim()).toBe(
      'Warning - X may rate limit or flag your account for this. Use it at your own risk.'
    );
    expect(warning.classList.contains('warning')).toBe(true);
    expect(info.compareDocumentPosition(warning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toggle().getAttribute('aria-describedby')).toBe('autoInfo autoWarning');
  });

  it('shows the stored settings', async () => {
    await openPopup({}, { sync: { autoReveal: true, autoDelaySec: 10 } });
    expect(toggle().checked).toBe(true);
    expect(delay().value).toBe('10');
    expect(delay().disabled).toBe(false);
  });

  it('shows the defaults for stored values that make no sense', async () => {
    await openPopup({}, { sync: { autoReveal: 'yes', autoDelaySec: 7 } });
    expect(toggle().checked).toBe(false);
    expect(delay().value).toBe('5');
  });

  it('saves the switch and lets the delay be changed once it is on', async () => {
    await openPopup({});
    await flip();
    expect(syncData.get('autoReveal')).toBe(true);
    expect(delay().disabled).toBe(false);
    await flip();
    expect(syncData.get('autoReveal')).toBe(false);
    expect(delay().disabled).toBe(true);
  });

  it('saves the delay that was chosen', async () => {
    await openPopup({});
    await flip();
    await choose('2');
    expect(syncData.get('autoDelaySec')).toBe(2);
  });

  it('shows what is really saved when saving fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({});
    syncFails = true;
    await flip();
    expect(syncData.has('autoReveal')).toBe(false);
    expect(toggle().checked).toBe(false);
    expect(delay().disabled).toBe(true);
    warn.mockRestore();
  });

  it('shows the defaults when the settings cannot be read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({}, { syncReadFails: true });
    expect(toggle().checked).toBe(false);
    expect(delay().value).toBe('5');
    warn.mockRestore();
  });
});

describe('the support button and links', () => {
  // Closing the popup would close the test window, so it is only recorded.
  beforeEach(() => {
    vi.spyOn(window, 'close').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('opens the Ko-fi page in a new tab', async () => {
    await openPopup({});
    const created = [];
    chrome.tabs.create = async (tab) => created.push(tab);
    document.getElementById('support').click();
    await flush();
    expect(created).toEqual([{ url: 'https://ko-fi.com/thefoultarnished' }]);
    expect(window.close).toHaveBeenCalled();
  });

  it('has no Open X button, and the support link is not in the header any more', async () => {
    await openPopup({});
    expect(document.getElementById('openX')).toBeNull();
    expect(document.querySelector('header #support')).toBeNull();
    expect(document.getElementById('support').getAttribute('rel')).toContain('noopener');
  });

  it('asks about supporting development above the footer, with the button next to it', async () => {
    await openPopup({});
    const row = document.querySelector('.support-row');
    expect(row.firstElementChild.textContent).toBe('Want to support development?');
    expect(row.lastElementChild).toBe(document.getElementById('support'));
    const footer = document.querySelector('footer');
    expect(row.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(row.nextElementSibling).toBe(footer);
  });

  it('shows a drawn coffee cup icon in the button, with no emoji', async () => {
    await openPopup({});
    const button = document.getElementById('support');
    const icon = button.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(button.textContent.trim()).toBe('Support');
    expect(button.textContent).not.toMatch(/[☀-➿\u{1F300}-\u{1FAFF}]/u);
  });

  it('shows the name with the tagline below, and the version on the right of the header', async () => {
    await openPopup({});
    const title = document.querySelector('header h1');
    expect(title.textContent.trim()).toBe('X-Ray');
    const version = document.getElementById('appVersion');
    expect(version.textContent).toBe('v9.9');
    expect(document.querySelector('header').lastElementChild.contains(version)).toBe(true);
    expect(title.contains(version)).toBe(false);
    const tagline = document.querySelector('header .tagline');
    expect(tagline.textContent).toBe('for Twitter (X)');
    expect(title.compareDocumentPosition(tagline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.contains(tagline)).toBe(false);
  });

  it('warns and stays open when the tab cannot be opened', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({});
    chrome.tabs.create = async () => {
      throw new Error('blocked');
    };
    document.getElementById('support').click();
    await flush();
    expect(warn).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('the popup layout', () => {
  beforeEach(() => {
    vi.spyOn(window, 'close').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('has no intro note about tracking', async () => {
    await openPopup({});
    expect(document.querySelector('.note')).toBeNull();
    expect(document.body.textContent).not.toContain('No tracking');
  });

  it('keeps the version in the header as plain text, not a link', async () => {
    await openPopup({});
    const version = document.getElementById('appVersion');
    expect(version.tagName).toBe('SPAN');
    expect(version.closest('a')).toBeNull();
  });

  it("puts a What's New link right below the version number", async () => {
    await openPopup({});
    const version = document.getElementById('appVersion');
    const link = document.getElementById('whatsNew');
    expect(link.tagName).toBe('A');
    expect(link.textContent).toBe("What's New");
    expect(link.getAttribute('href')).toBe('changelog.html');
    expect(version.nextElementSibling).toBe(link);
    expect(version.parentElement).toBe(link.parentElement);
    expect(document.querySelector('header').contains(link)).toBe(true);
  });

  it("opens the changelog from What's New and closes the popup", async () => {
    await openPopup({});
    const created = [];
    chrome.tabs.create = async (tab) => created.push(tab);
    document.getElementById('whatsNew').click();
    await flush();
    expect(created).toEqual([{ url: 'changelog.html' }]);
    expect(window.close).toHaveBeenCalled();
  });

  it("warns and stays open when What's New cannot open the changelog", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await openPopup({});
    chrome.tabs.create = async () => {
      throw new Error('blocked');
    };
    document.getElementById('whatsNew').click();
    await flush();
    expect(warn).toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('gives the wait choice and clear cache a card each, like Auto reveal', async () => {
    await openPopup({});
    const cards = [...document.querySelectorAll('main > .card')].map((card) => card.id);
    expect(cards).toEqual(['autoCard', 'delayCard', 'cacheCard']);
    expect(document.getElementById('autoCard').contains(document.getElementById('autoDelay'))).toBe(false);
  });

  it('has the wait label on the left, the dropdown on the right and a description below', async () => {
    await openPopup({});
    const row = document.querySelector('#delayCard .card-row');
    expect(row.firstElementChild.textContent).toBe('Auto Lookup Cooldown');
    expect(row.lastElementChild).toBe(document.getElementById('autoDelay'));
    const note = document.getElementById('delayInfo');
    expect(note.textContent).toBe('Time period between lookups to prevent rate limiting');
    expect(document.getElementById('autoDelay').getAttribute('aria-describedby')).toBe('delayInfo');
  });

  it('hides the cooldown card while auto reveal is off and shows it when it is on', async () => {
    await openPopup({});
    const card = document.getElementById('delayCard');
    const toggle = document.getElementById('autoReveal');
    const flip = async () => {
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
      await flush();
    };
    expect(card.hidden).toBe(true);
    await flip();
    expect(card.hidden).toBe(false);
    await flip();
    expect(card.hidden).toBe(true);
  });

  it('shows the cooldown card right away when auto reveal was already on', async () => {
    await openPopup({}, { sync: { autoReveal: true, autoDelaySec: 3 } });
    expect(document.getElementById('delayCard').hidden).toBe(false);
    expect(document.getElementById('autoDelay').value).toBe('3');
  });

  it('puts a small warning icon in front of the yellow warning, hidden from screen readers', async () => {
    await openPopup({});
    const warning = document.getElementById('autoWarning');
    const icon = warning.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(warning.firstElementChild).toBe(icon);
    expect(warning.textContent.trim()).toBe(
      'Warning - X may rate limit or flag your account for this. Use it at your own risk.'
    );
  });

  it('shows the footer text', async () => {
    await openPopup({});
    expect(document.querySelector('footer').textContent.trim()).toBe('Not affiliated with X');
  });
});
