const LINKS = {
  support: 'https://ko-fi.com/thefoultarnished',
  // Bundled page, opened in a tab so the click doesn't navigate the popup itself.
  appVersion: chrome.runtime.getURL('changelog.html'),
};

for (const [id, url] of Object.entries(LINKS)) {
  document.getElementById(id).addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await chrome.tabs.create({ url });
      window.close();
    } catch (err) {
      console.warn('[X-Ray] Could not open tab:', err);
    }
  });
}

document.getElementById('appVersion').textContent = `v${chrome.runtime.getManifest().version}`;

const CLEAR_LABEL = 'Clear cache';
const CONFIRM_LABEL = 'Click again to clear';
const CLEARED_LABEL = 'Cleared';
const CONFIRM_MS = 3000;

const savedCount = document.getElementById('savedCount');
const clearSaved = document.getElementById('clearSaved');
let confirmTimer = null;
let isConfirming = false;

async function showSavedCount() {
  try {
    const count = await countSavedResults(chrome.storage.local);
    savedCount.textContent = `Cached Records: ${count}`;
    clearSaved.disabled = count === 0;
  } catch (err) {
    console.warn('[X-Ray] Could not read cached records:', err);
    savedCount.textContent = 'Could not read cached records';
    clearSaved.disabled = true;
  }
}

function stopConfirming() {
  clearTimeout(confirmTimer);
  isConfirming = false;
  clearSaved.classList.remove('confirming');
  clearSaved.textContent = CLEAR_LABEL;
}

clearSaved.addEventListener('click', async () => {
  // A first click only asks; the second one, within a few seconds, clears.
  if (!isConfirming) {
    isConfirming = true;
    clearSaved.classList.add('confirming');
    clearSaved.textContent = CONFIRM_LABEL;
    confirmTimer = setTimeout(stopConfirming, CONFIRM_MS);
    return;
  }
  clearTimeout(confirmTimer);
  isConfirming = false;
  clearSaved.classList.remove('confirming');
  try {
    await clearSavedResults(chrome.storage.local);
    clearSaved.textContent = CLEARED_LABEL;
    setTimeout(() => {
      clearSaved.textContent = CLEAR_LABEL;
    }, CONFIRM_MS);
  } catch (err) {
    console.warn('[X-Ray] Could not clear cached records:', err);
    clearSaved.textContent = CLEAR_LABEL;
    savedCount.textContent = 'Could not clear cached records';
    return;
  }
  showSavedCount();
});

showSavedCount();

const autoReveal = document.getElementById('autoReveal');
const autoDelay = document.getElementById('autoDelay');
const autoDelayRow = document.getElementById('autoDelayRow');

for (const seconds of AUTO_DELAY_OPTIONS) {
  const option = document.createElement('option');
  option.value = String(seconds);
  option.textContent = `${seconds} seconds`;
  autoDelay.append(option);
}

function showSettings(raw) {
  const settings = normalizeSettings(raw);
  autoReveal.checked = settings[SETTINGS.AUTO_REVEAL];
  autoDelay.value = String(settings[SETTINGS.AUTO_DELAY_SEC]);
  autoDelay.disabled = !autoReveal.checked;
  autoDelayRow.classList.toggle('off', !autoReveal.checked);
}

async function loadSettings() {
  try {
    showSettings(await chrome.storage.sync.get(SETTING_DEFAULTS));
  } catch (err) {
    console.warn('[X-Ray] Could not read settings:', err);
    showSettings(SETTING_DEFAULTS);
  }
}

async function saveSettings() {
  const settings = normalizeSettings({
    [SETTINGS.AUTO_REVEAL]: autoReveal.checked,
    [SETTINGS.AUTO_DELAY_SEC]: autoDelay.value,
  });
  showSettings(settings);
  try {
    await chrome.storage.sync.set(settings);
  } catch (err) {
    console.warn('[X-Ray] Could not save settings:', err);
    // Show what is really stored, so the switch never claims something that was not saved.
    await loadSettings();
  }
}

autoReveal.addEventListener('change', saveSettings);
autoDelay.addEventListener('change', saveSettings);
loadSettings();
