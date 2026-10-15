import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { SETTINGS, AUTO_DELAY_OPTIONS, SETTING_DEFAULTS, normalizeSettings } = require('../src/settings.js');

describe('the delay choices', () => {
  it('never allow lookups faster than every 2 seconds', () => {
    expect(Math.min(...AUTO_DELAY_OPTIONS)).toBeGreaterThanOrEqual(2);
  });

  it('include the default', () => {
    expect(AUTO_DELAY_OPTIONS).toContain(SETTING_DEFAULTS[SETTINGS.AUTO_DELAY_SEC]);
  });
});

describe('default settings', () => {
  it('start with auto reveal off', () => {
    expect(SETTING_DEFAULTS[SETTINGS.AUTO_REVEAL]).toBe(false);
  });
});

describe('normalizeSettings', () => {
  it('keeps good values', () => {
    expect(normalizeSettings({ autoReveal: true, autoDelaySec: 3 })).toEqual({ autoReveal: true, autoDelaySec: 3 });
  });

  it('gives the defaults for nothing at all', () => {
    for (const nothing of [undefined, null, {}, 'text', 5]) {
      expect(normalizeSettings(nothing)).toEqual(SETTING_DEFAULTS);
    }
  });

  it('turns auto reveal on only for a real true', () => {
    for (const value of ['true', 1, 'yes', {}, [], null, undefined, false]) {
      expect(normalizeSettings({ autoReveal: value }).autoReveal).toBe(false);
    }
    expect(normalizeSettings({ autoReveal: true }).autoReveal).toBe(true);
  });

  it('accepts a delay stored as text, since a form gives text', () => {
    expect(normalizeSettings({ autoDelaySec: '10' }).autoDelaySec).toBe(10);
  });

  it('falls back to the default for a delay that is not a choice', () => {
    for (const value of [0, 1, 1.5, 4, 11, -2, 'abc', '', null, NaN, Infinity, [], {}]) {
      expect(normalizeSettings({ autoDelaySec: value }).autoDelaySec).toBe(SETTING_DEFAULTS[SETTINGS.AUTO_DELAY_SEC]);
    }
  });

  it('ignores other stored values', () => {
    expect(normalizeSettings({ autoReveal: true, other: 1 })).toEqual({ autoReveal: true, autoDelaySec: 5 });
  });
});
