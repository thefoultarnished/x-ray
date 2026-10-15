// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

// Tests run from the project root (npm test).
const source = readFileSync(join(process.cwd(), 'src', 'inject-parser.js'), 'utf8');
const getURL = (path) => `chrome-extension://test/${path}`;

// Runs the script the way Chrome does: inside the given page's own window.
function runIn(win) {
  win.chrome = { runtime: { getURL } };
  win.eval(source);
}

const scriptsIn = (win) => [...win.document.querySelectorAll('script')].map((el) => el.getAttribute('src'));

describe('inject-parser.js', () => {
  afterEach(() => {
    document.querySelectorAll('iframe').forEach((frame) => frame.remove());
    document.querySelectorAll('script').forEach((el) => el.remove());
  });

  it('adds parser.js to a frame, such as the hidden lookup frame', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    runIn(frame.contentWindow);

    expect(scriptsIn(frame.contentWindow)).toEqual(['chrome-extension://test/parser.js']);
  });

  it('removes the script tag again once it has loaded', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    runIn(frame.contentWindow);

    const tag = frame.contentWindow.document.querySelector('script');
    tag.onload();
    expect(scriptsIn(frame.contentWindow)).toEqual([]);
  });

  it('adds nothing to the top page, which does not need parser.js', () => {
    runIn(window);
    expect(scriptsIn(window)).toEqual([]);
  });

  it('works in a frame whose page has no head yet, as at the start of loading', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentWindow.document;
    doc.head?.remove();
    runIn(frame.contentWindow);

    expect(scriptsIn(frame.contentWindow)).toEqual(['chrome-extension://test/parser.js']);
  });
});
