// @vitest-environment jsdom
import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

// Elements a script on X could add before X-Ray starts, using the names X-Ray used to look for.
const PLANTED = `
  <div id="x-tooltip">page tooltip</div>
  <div id="loc-hover-card">page card</div>
  <div id="xray-tooltip">page tooltip</div>
  <div id="xray-hover-card">page card</div>
`;

beforeAll(async () => {
  document.body.innerHTML = PLANTED;
  globalThis.chrome = {
    runtime: { id: 'test', getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: { get: async () => ({}), set: async () => {}, remove: async () => {} } },
  };
  const store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
  });
  globalThis.FLAG_IMAGES = require('../src/flags.js');
  require('../src/content.js');
  // Saved results load first, then the extension starts.
  await new Promise((r) => setTimeout(r, 20));
});

// jsdom marks every click it makes as untrusted, so this stands in for a real click or key press.
const userClick = (el) => el.onclick({ isTrusted: true, preventDefault() {}, stopPropagation() {} });

function addPost(handle, parent = document.body) {
  const article = document.createElement('article');
  article.dataset.testid = 'tweet';
  article.innerHTML = `<div data-testid="User-Name"><a href="/${handle}">${handle}</a></div><div><div data-testid="caret"></div></div>`;
  parent.append(article);
  return article;
}

const lookupFrame = () => document.querySelector('iframe')?.contentWindow;
const found = (handle, location, source) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: 'https://x.com',
      source: lookupFrame(),
      data: { type: 'X_LOCATION_FOUND', handle, location, source },
    })
  );

describe('page elements with the same names as the extension', () => {
  it('still adds a pin to every post when the page already has elements named like the extension', async () => {
    const article = addPost('planted_acct');
    await new Promise((r) => setTimeout(r, 20));
    expect(article.querySelectorAll('button')).toHaveLength(1);
  });

  it('adds its pin even when the post already has elements called pin or pill', async () => {
    const article = addPost('lookalike_acct');
    article.querySelector('div').classList.add('loc-btn', 'loc-pill');
    await new Promise((r) => setTimeout(r, 20));
    expect(article.querySelectorAll('button')).toHaveLength(1);
  });

  it('shows its own info card and leaves the page elements untouched', async () => {
    const article = addPost('card_acct');
    await new Promise((r) => setTimeout(r, 20));
    const pin = article.querySelector('button');
    userClick(pin);
    found('card_acct', 'Canada', 'iOS');
    pin.dispatchEvent(new MouseEvent('mouseenter'));

    expect(document.querySelector('.xray-hover-card').textContent).toContain('Canada');
    for (const id of ['loc-hover-card', 'xray-hover-card']) {
      expect(document.getElementById(id).textContent).toBe('page card');
    }
    for (const id of ['x-tooltip', 'xray-tooltip']) {
      expect(document.getElementById(id).textContent).toBe('page tooltip');
    }
  });

  it('shows the info card again if a page script removes it', async () => {
    const pin = document.querySelector('button[data-handle="card_acct"]');
    document.querySelector('.xray-hover-card').remove();
    pin.dispatchEvent(new MouseEvent('mouseenter'));
    expect(document.querySelector('.xray-hover-card').textContent).toContain('Canada');
  });

  it('starts only once even when the script is loaded a second time', async () => {
    delete require.cache[require.resolve('../src/content.js')];
    require('../src/content.js');
    await new Promise((r) => setTimeout(r, 20));
    expect(document.querySelectorAll('.xray-tooltip')).toHaveLength(1);
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);
  });
});
