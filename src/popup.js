const LINKS = {
  support: 'https://ko-fi.com/thefoultarnished',
  // Bundled page, opened in a tab so the click doesn't navigate the popup itself.
  whatsNew: chrome.runtime.getURL('changelog.html'),
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

const CLEAR_LABEL = 'Clear';
const CONFIRM_LABEL = 'Click again';
const CLEARED_LABEL = 'Cleared';
const CLEAR_FAILED_LABEL = 'Try again';
const CONFIRM_MS = 3000;

const clearSaved = document.getElementById('clearSaved');
const cacheInfo = document.getElementById('cacheInfo');
let cachedCount = 0;
let confirmTimer = null;
let isConfirming = false;

function showIdle() {
  clearSaved.textContent = CLEAR_LABEL;
  cacheInfo.textContent = `Cached records: ${cachedCount}. Clearing them means those accounts are looked up again.`;
}

async function refreshCount() {
  try {
    cachedCount = await countSavedResults(chrome.storage.local);
    clearSaved.disabled = cachedCount === 0;
    showIdle();
  } catch (err) {
    console.warn('[X-Ray] Could not read cached records:', err);
    cacheInfo.textContent = 'Could not read cached records.';
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
  stopConfirming();
  try {
    await clearSavedResults(chrome.storage.local);
    cachedCount = 0;
    clearSaved.disabled = true;
    showIdle();
    clearSaved.textContent = CLEARED_LABEL;
  } catch (err) {
    console.warn('[X-Ray] Could not clear cached records:', err);
    clearSaved.textContent = CLEAR_FAILED_LABEL;
    cacheInfo.textContent = 'Could not clear cached records.';
  }
  // Back to the normal label with a fresh count, unless the user already started clearing again.
  setTimeout(() => {
    if (!isConfirming) refreshCount();
  }, CONFIRM_MS);
});

refreshCount();

const autoReveal = document.getElementById('autoReveal');
const autoDelay = document.getElementById('autoDelay');
const delayCard = document.getElementById('delayCard');

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
  delayCard.hidden = !autoReveal.checked;
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
