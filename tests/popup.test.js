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
const count = () => document.getElementById('savedCount').textContent;

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

  it('shows the warning about rate limits', async () => {
    await openPopup({});
    expect(document.getElementById('autoWarning').textContent).toContain('rate limit');
    expect(toggle().getAttribute('aria-describedby')).toBe('autoWarning');
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

  it('is the only link besides the version tag, and has no Open X button', async () => {
    await openPopup({});
    expect(document.getElementById('openX')).toBeNull();
    expect(document.querySelector('header #support')).not.toBeNull();
    expect(document.getElementById('support').getAttribute('rel')).toContain('noopener');
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

  it('opens the What is new page from the version tag', async () => {
    await openPopup({});
    const created = [];
    chrome.tabs.create = async (tab) => created.push(tab);
    document.getElementById('appVersion').click();
    await flush();
    expect(created).toEqual([{ url: 'changelog.html' }]);
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
