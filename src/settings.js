// Settings kept in chrome.storage.sync. Shared by the popup (where they are changed) and content.js.
const SETTINGS = {
  AUTO_REVEAL: 'autoReveal',
  AUTO_DELAY_SEC: 'autoDelaySec',
};

// Seconds to wait between automatic lookups. Never less than 2, so X is not hit too fast.
const AUTO_DELAY_OPTIONS = [2, 3, 5, 10];

const SETTING_DEFAULTS = {
  [SETTINGS.AUTO_REVEAL]: false,
  [SETTINGS.AUTO_DELAY_SEC]: 5,
};

// Stored values can be missing or wrong (older version, hand edits), so each one is checked.
function normalizeSettings(raw) {
  const stored = raw && typeof raw === 'object' ? raw : {};
  const delay = Number(stored[SETTINGS.AUTO_DELAY_SEC]);
  return {
    [SETTINGS.AUTO_REVEAL]: stored[SETTINGS.AUTO_REVEAL] === true,
    [SETTINGS.AUTO_DELAY_SEC]: AUTO_DELAY_OPTIONS.includes(delay) ? delay : SETTING_DEFAULTS[SETTINGS.AUTO_DELAY_SEC],
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SETTINGS, AUTO_DELAY_OPTIONS, SETTING_DEFAULTS, normalizeSettings };
}
