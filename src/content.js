const ICONS = {
  PIN: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17.5px; height:17.5px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  GLOBE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13.5px; height:13.5px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
};

const PLATFORM_ICONS = {
  APPLE: `<svg viewBox="0 0 384 512" fill="currentColor" style="width:11.5px; height:13.5px; display:inline-block; vertical-align:middle;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 43.3-25.6 63.7 26.2 1.3 52.6-6.2 69.5-26.1z"></path></svg>`,
  ANDROID: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style="width:13.5px; height:13.5px; display:inline-block; vertical-align:middle;"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"></path></svg>`,
  WEB: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13.5px; height:13.5px; display:inline-block; vertical-align:middle;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
};

// Checked before Chrome's own list: names X may word differently, short forms and older names.
const EXTRA_COUNTRY_NAMES = {
  usa: 'us',
  'united states of america': 'us',
  uk: 'gb',
  'great britain': 'gb',
  britain: 'gb',
  england: 'gb-eng',
  scotland: 'gb-sct',
  wales: 'gb-wls',
  'northern ireland': 'gb-nir',
  europe: 'eu',
  'democratic republic of the congo': 'cd',
  'dr congo': 'cd',
  drc: 'cd',
  'republic of the congo': 'cg',
  congo: 'cg',
  'hong kong': 'hk',
  macau: 'mo',
  macao: 'mo',
  palestine: 'ps',
  'state of palestine': 'ps',
  uae: 'ae',
  turkey: 'tr',
  'czech republic': 'cz',
  swaziland: 'sz',
  burma: 'mm',
  'ivory coast': 'ci',
  macedonia: 'mk',
  bosnia: 'ba',
  'sao tome': 'st',
  holland: 'nl',
  'the netherlands': 'nl',
  'russian federation': 'ru',
  korea: 'kr',
  'republic of korea': 'kr',
  'east timor': 'tl',
  'cabo verde': 'cv',
  'viet nam': 'vn',
  'holy see': 'va',
  vatican: 'va',
  'the bahamas': 'bs',
  'the gambia': 'gm',
};

// "Türkiye", "turkiye" and "St. Kitts & Nevis" / "Saint Kitts and Nevis" compare equal.
function normalizeName(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\bst\.?\s/g, 'saint ')
    .replace(/[’'.]/g, '')
    .replace(/[-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Every country Chrome knows by its English name, plus EXTRA_COUNTRY_NAMES on top.
// Codes with no built-in flag (Chrome also lists non-countries like "Unknown Region") are left out.
function buildCountryCodes() {
  const codes = new Map();
  if (typeof Intl.DisplayNames === 'function') {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const a of letters) {
      for (const b of letters) {
        const code = a + b;
        if (!FLAG_IMAGES[code.toLowerCase()]) continue;
        const name = names.of(code);
        // Skips unknown codes and outdated ones Chrome maps to a current code (UK -> GB).
        if (!name || name === code || new Intl.Locale(`und-${code}`).region !== code) continue;
        codes.set(normalizeName(name), code.toLowerCase());
      }
    }
  }
  for (const [name, code] of Object.entries(EXTRA_COUNTRY_NAMES)) {
    if (FLAG_IMAGES[code]) codes.set(normalizeName(name), code);
  }
  return codes;
}

const COUNTRY_CODES = buildCountryCodes();
const unknownPlaces = new Set();

function countryCode(name) {
  if (typeof name !== 'string' || !name.trim()) return null;
  const code = COUNTRY_CODES.get(normalizeName(name)) ?? null;
  if (!code && !unknownPlaces.has(name)) {
    unknownPlaces.add(name);
    console.debug(`[X-Ray] No flag for "${name}"`);
  }
  return code;
}

// "United States App Store" -> { code: 'us', name: 'United States', rest: 'App Store' }
function splitLeadingCountry(text) {
  const words = text.split(/\s+/).filter(Boolean);
  for (let n = words.length; n > 0; n--) {
    const name = words.slice(0, n).join(' ');
    const code = COUNTRY_CODES.get(normalizeName(name));
    if (code) return { code, name, rest: words.slice(n).join(' ') };
  }
  return { code: null, name: '', rest: text };
}

// X sends the app name as HTML; keep only its text.
function htmlText(source) {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  return (doc.body.textContent || '').trim();
}

// Shorter still, for the pill and card: no "Twitter for " and no trailing " App".
function sourceText(source) {
  return htmlText(source)
    .replace(/Twitter for /gi, '')
    .replace(/ App$/i, '')
    .trim();
}

// Only for the extension's own fixed icon markup, never for text from X or the cache.
function createIcon(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup;
  return template.content.firstElementChild;
}

function createGlobe() {
  const globe = document.createElement('span');
  globe.className = 'xray-globe';
  globe.append(createIcon(ICONS.GLOBE));
  return globe;
}

function createFlagImage(code, alt) {
  const img = document.createElement('img');
  img.src = FLAG_IMAGES[code];
  img.className = 'xray-flag';
  img.alt = alt;
  img.loading = 'eager';
  return img;
}

function createFlag(locText) {
  const code = countryCode(locText);
  return code ? createFlagImage(code, locText) : createGlobe();
}

// Capturing group so split() keeps the platform names between the text parts.
const PLATFORM_WORDS = /(iPhone|iPad|iOS|App Store|Android|Play Store|Web)/i;

// What is left of the app text once the platform words are taken out: "South Asia" for "South Asia App Store".
function regionText(text) {
  return text
    .split(PLATFORM_WORDS)
    .filter((_, i) => i % 2 === 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function platformIcon(word) {
  if (/^(iPhone|iPad|iOS|App Store)$/i.test(word)) return PLATFORM_ICONS.APPLE;
  if (/^(Android|Play Store)$/i.test(word)) return PLATFORM_ICONS.ANDROID;
  return PLATFORM_ICONS.WEB;
}

function createSourceContent(source, location) {
  const content = document.createDocumentFragment();
  if (!source) {
    content.append('Unknown');
    return content;
  }

  const { code, name, rest } = splitLeadingCountry(sourceText(source));
  // The store's country is left out when it is the location the pill already shows.
  if (code && code !== countryCode(location)) content.append(createFlagImage(code, name));
  rest.split(PLATFORM_WORDS).forEach((part, i) => {
    if (i % 2) content.append(createIcon(platformIcon(part)));
    else if (part.trim()) content.append(part.trim());
  });
  if (!content.hasChildNodes()) content.append('Unknown');
  return content;
}

// "Chile, iPhone": what a screen reader says for a result.
function describeResult(location, source) {
  const app = source ? sourceText(source) : '';
  return app ? `${location || 'Unknown'}, ${app}` : location || 'Unknown';
}

function renderPill(btn, location, source) {
  const isAndroid = Boolean(source) && /android|play store/i.test(source);
  btn.className = isAndroid ? 'xray-pill android-device' : 'xray-pill';
  btn.setAttribute('aria-label', `Location: ${describeResult(location, source)}`);
  // Clears the click block left over from the loading state.
  btn.style.pointerEvents = '';
  btn.replaceChildren(createFlag(location), location || 'Unknown Loc');
  if (source) {
    const sourceText = document.createElement('span');
    sourceText.className = 'xray-source';
    sourceText.append(createSourceContent(source, location));
    btn.append(sourceText);
  }

  // Replaces the pin's lookup click, and keeps a click on the pill from reaching X (it would open the profile).
  btn.onclick = (e) => {
    if (!e.isTrusted) return;
    e.preventDefault();
    e.stopPropagation();
  };
  btn.onmouseenter = btn.onfocus = () => showHoverCard(btn, location, source);
  btn.onmouseleave = btn.onblur = () => hideHoverCard();
  // Lets keyboard users dismiss the card without leaving the pill. The event is left alone for X.
  btn.onkeydown = (e) => {
    if (e.key === 'Escape') hideHoverCard();
  };
}

// A Map, because a plain object already has entries like "constructor" that real account names can match.
const locationMap = new Map();
const PIN_LABEL = 'Get Location & App Store';
let liveRegion = null;

// One hidden line that screen readers read out, updated in place.
function announce(text) {
  if (liveRegion) liveRegion.textContent = text;
}
let scraperFrame = null;
let busyHandle = null;
// The 10 second limit of the lookup that is running now.
let lookupTimer = null;
const LOADING_TEXT = 'Locating...';
const QUEUED_TEXT = 'Queued...';
const NOT_AVAILABLE_TEXT = 'Not available';
const LOOKUP_TIMEOUT_MS = 10000;
const NOT_AVAILABLE_MS = 3000;
// Pause before the next queued lookup starts.
const NEXT_LOOKUP_DELAY_MS = 500;
// Where versions up to 1.5 kept results: inside x.com's own storage, readable by X.
const OLD_CACHE_KEY = 'x_location_cache';
// Set once the old results were moved, so anything planted there later is never imported.
const MOVED_OLD_RESULTS_KEY = 'movedOldResults';
const CACHE_DURATION = 90 * 24 * 60 * 60 * 1000;
const MAX_SAVED_RESULTS = 10000;
const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

const MAX_TEXT_LENGTH = 100;
// Locations and app names must be short text; anything else from X or storage counts as missing.
const isText = (value) => value == null || (typeof value === 'string' && value.length <= MAX_TEXT_LENGTH);
const asText = (value) => (typeof value === 'string' && value.length <= MAX_TEXT_LENGTH ? value : '');

const isUsable = (entry, now) =>
  Boolean(entry) && now - entry.timestamp < CACHE_DURATION && isText(entry.loc) && isText(entry.src);

// After the extension is updated or reloaded, this old tab can no longer reach its storage.
function savedStore() {
  return chrome.runtime?.id ? chrome.storage.local : null;
}

async function moveOldSavedResults(store, now) {
  let old = null;
  try {
    old = JSON.parse(localStorage.getItem(OLD_CACHE_KEY));
  } catch {
    // Unreadable old data is simply dropped below.
  }
  const moved = {};
  if (old && typeof old === 'object') {
    for (const [handle, entry] of Object.entries(old)) {
      if (HANDLE_PATTERN.test(handle) && isUsable(entry, now)) {
        moved[SAVED_PREFIX + handle] = { loc: entry.loc, src: entry.src, timestamp: entry.timestamp };
      }
    }
  }
  // Never overwrite a result that is already in the extension's storage.
  const existing = await store.get(Object.keys(moved));
  for (const key of Object.keys(existing)) delete moved[key];
  if (Object.keys(moved).length) await store.set(moved);
}

async function loadSavedResults() {
  const now = Date.now();
  try {
    const store = savedStore();
    if (!store) return;
    let everything = await store.get(null);
    if (!everything[MOVED_OLD_RESULTS_KEY]) {
      await moveOldSavedResults(store, now);
      await store.set({ [MOVED_OLD_RESULTS_KEY]: true });
      // Read again, once, so the moved results are included.
      everything = await store.get(null);
    }
    localStorage.removeItem(OLD_CACHE_KEY);
    const saved = Object.entries(everything).filter(([key]) => key.startsWith(SAVED_PREFIX));
    // Oldest first, so when results saved under different capitals meet, the newest one wins.
    const usable = saved.filter(([, entry]) => isUsable(entry, now)).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (const [key, entry] of usable) {
      locationMap.set(key.slice(SAVED_PREFIX.length).toLowerCase(), { loc: entry.loc, src: entry.src });
    }
    // Not waited for, so tidying a big list never delays the first pins.
    pruneSavedResults(store, saved, now).catch((e) => console.warn('[X-Ray] Could not tidy saved locations:', e));
  } catch (e) {
    console.warn('[X-Ray] Could not read saved locations:', e);
  }
}

// Drops results older than 90 days, older spellings of an account saved under different capitals and,
// beyond 10,000, the oldest ones. Other extension data is left alone.
// Done once when the page loads, from the list already read, so a save never rereads everything.
async function pruneSavedResults(store, saved, now) {
  const usable = saved.filter(([, entry]) => isUsable(entry, now)).sort((a, b) => b[1].timestamp - a[1].timestamp);
  const newestSpelling = new Set();
  const kept = [];
  const olderSpellings = [];
  for (const item of usable) {
    const handle = item[0].slice(SAVED_PREFIX.length).toLowerCase();
    if (newestSpelling.has(handle)) olderSpellings.push(item);
    else {
      newestSpelling.add(handle);
      kept.push(item);
    }
  }
  const drop = [
    ...saved.filter(([, entry]) => !isUsable(entry, now)),
    ...olderSpellings,
    ...kept.slice(MAX_SAVED_RESULTS),
  ];
  if (drop.length) await store.remove(drop.map(([key]) => key));
}

async function saveToCache(handle, loc, src) {
  locationMap.set(handle, { loc, src });
  const now = Date.now();
  try {
    const store = savedStore();
    if (!store) return;
    // One entry per account, so two X tabs saving at once never overwrite each other.
    await store.set({ [SAVED_PREFIX + handle]: { loc, src, timestamp: now } });
  } catch (e) {
    console.warn('[X-Ray] Could not save location:', e);
  }
}

// Only answers from our own hidden lookup page, about the account being looked up, are trusted.
function isLookupAnswer(event) {
  if (event.origin !== 'https://x.com' && event.origin !== 'https://twitter.com') return false;
  if (!scraperFrame || event.source !== scraperFrame.contentWindow) return false;
  const data = event.data;
  if (!data || data.type !== 'X_LOCATION_FOUND') return false;
  return (
    typeof data.handle === 'string' &&
    HANDLE_PATTERN.test(data.handle) &&
    busyHandle !== null &&
    data.handle.toLowerCase() === busyHandle.toLowerCase()
  );
}

window.addEventListener('message', (event) => {
  if (!isLookupAnswer(event)) return;
  // Use the name as written on the page, so the pills for this account are found.
  const handle = busyHandle;
  const location = asText(event.data.location);
  const source = asText(event.data.source);

  saveToCache(handle, location, source);
  updateToLocationText(handle, location, source);
  noteLookupResult(true, handle);
  if (!autoHandles.has(handle)) announce(`@${handle}: ${describeResult(location, source)}`);
  autoHandles.delete(handle);

  finishLookup();
  setTimeout(processQueue, NEXT_LOOKUP_DELAY_MS);
});

// Marks the lookup as done, then removes the hidden frame unless more lookups are waiting.
// ---- Auto reveal: looks up the accounts on screen by itself, one at a time ----
// Failed lookups in a row before auto reveal pauses; X most likely started limiting us.
const AUTO_FAILURES_BEFORE_PAUSE = 5;
const AUTO_PAUSE_MS = 5 * 60 * 1000;
// Most automatic lookups in line at once, counting the one running.
const AUTO_QUEUE_MAX = 20;
let autoReveal = SETTING_DEFAULTS[SETTINGS.AUTO_REVEAL];
let autoDelayMs = SETTING_DEFAULTS[SETTINGS.AUTO_DELAY_SEC] * 1000;
let autoTimer = null;
let autoPausedUntil = 0;
let lastLookupEnd = 0;
let failureStreak = 0;
let pinObserver = null;
// Pins that are on screen right now.
const visiblePins = new Set();
// Accounts that got no answer this page load; auto reveal never asks for them again.
const unavailableHandles = new Set();
// Accounts auto reveal asked for, so screen readers are not told about every one.
const autoHandles = new Set();

async function loadSettings() {
  try {
    const store = chrome.runtime?.id ? chrome.storage.sync : null;
    if (!store) return;
    applySettings(await store.get(SETTING_DEFAULTS));
  } catch (e) {
    console.warn('[X-Ray] Could not read settings:', e);
  }
}

function applySettings(raw) {
  const settings = normalizeSettings(raw);
  autoReveal = settings[SETTINGS.AUTO_REVEAL];
  autoDelayMs = settings[SETTINGS.AUTO_DELAY_SEC] * 1000;
}

function onSettingsChanged(changes, area) {
  if (area !== 'sync' || !(SETTINGS.AUTO_REVEAL in changes || SETTINGS.AUTO_DELAY_SEC in changes)) return;
  const current = { [SETTINGS.AUTO_REVEAL]: autoReveal, [SETTINGS.AUTO_DELAY_SEC]: autoDelayMs / 1000 };
  for (const key of Object.keys(current)) if (key in changes) current[key] = changes[key].newValue;
  applySettings(current);
  // A wait planned with the old delay is replaced by one with the new delay.
  clearTimeout(autoTimer);
  autoTimer = null;
  syncAutoReveal();
}

// Starts or stops watching pins to match the setting.
function syncAutoReveal() {
  if (!autoReveal) {
    clearTimeout(autoTimer);
    autoTimer = null;
    pinObserver?.disconnect();
    pinObserver = null;
    visiblePins.clear();
    dropAutoQueued();
    return;
  }
  if (typeof IntersectionObserver === 'undefined') {
    console.warn('[X-Ray] Auto reveal needs IntersectionObserver, which this browser does not have.');
    return;
  }
  document.querySelectorAll('.xray-pin, .xray-pill').forEach(observePin);
  refreshAuto();
}

function observePin(btn) {
  if (!pinObserver) {
    pinObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visiblePins.add(entry.target);
        else visiblePins.delete(entry.target);
      }
      refreshAuto();
    });
  }
  pinObserver.observe(btn);
}

// True when nothing stops this account from being asked for.
const isFreeToAsk = (handle) => !locationMap.has(handle) && !unavailableHandles.has(handle) && !loadingTextFor(handle);

// The post just above and the one just below the posts on screen, so their result is ready by the time you
// scroll to them. Only the next post counts, never further, so lookups cannot creep down the feed.
function neighbourButtons() {
  const all = [...document.querySelectorAll('.xray-pin, .xray-pill')];
  const seen = all.flatMap((btn, index) => (visiblePins.has(btn) ? [index] : []));
  if (seen.length === 0) return [];
  return [all[seen.at(-1) + 1], all[seen[0] - 1]].filter(Boolean);
}

// The accounts still to be asked for: the pins on screen from the top down, then the neighbours.
function autoCandidates() {
  const tops = new Map();
  for (const btn of visiblePins) {
    if (!btn.isConnected || !btn.classList.contains('xray-pin')) continue;
    const handle = btn.dataset.handle;
    if (!isFreeToAsk(handle)) continue;
    const top = btn.getBoundingClientRect().top;
    if (top < (tops.get(handle) ?? Infinity)) tops.set(handle, top);
  }
  const onScreen = [...tops].sort((a, b) => a[1] - b[1]).map(([handle]) => handle);
  const neighbours = neighbourButtons()
    .filter((btn) => btn.classList.contains('xray-pin') && isFreeToAsk(btn.dataset.handle))
    .map((btn) => btn.dataset.handle);
  return [...new Set([...onScreen, ...neighbours])];
}

const isAutoQueued = (handle) => autoHandles.has(handle) && requestQueueSet.has(handle);

// Puts every pin on screen, and the next post each way, in line right away, so they all say "Queued..." and are looked up one by one.
function queueVisibleAuto() {
  if (!autoReveal || document.hidden || Date.now() < autoPausedUntil) return;
  // The one being looked up counts too.
  let room = AUTO_QUEUE_MAX - requestQueue.filter(isAutoQueued).length - (autoHandles.has(busyHandle) ? 1 : 0);
  for (const handle of autoCandidates()) {
    if (room-- <= 0) break;
    queueRequest(handle, { auto: true });
  }
}

function refreshAuto() {
  queueVisibleAuto();
  scheduleAuto();
}

// True when an automatic lookup may not start yet: the chosen wait or a pause is running, or the tab is hidden.
function autoMustWait() {
  return !autoReveal || document.hidden || Date.now() < Math.max(lastLookupEnd + autoDelayMs, autoPausedUntil);
}

// An account is still wanted while its post is on screen or is the next one above or below.
const isWanted = (handle) =>
  [...visiblePins, ...neighbourButtons()].some((btn) => btn.isConnected && btn.dataset.handle === handle);

// Takes an automatic lookup out of line and gives its pins back.
function dropAutoQueued(handle) {
  const handles = handle ? [handle] : requestQueue.filter(isAutoQueued);
  for (const queued of handles) {
    const index = requestQueue.indexOf(queued);
    if (index !== -1) requestQueue.splice(index, 1);
    requestQueueSet.delete(queued);
    autoHandles.delete(queued);
    document.querySelectorAll(`.xray-pill.loading[data-handle="${queued}"]`).forEach(restorePin);
  }
}

// One timer at most. It waits out the chosen delay after the last lookup, and any pause.
function scheduleAuto() {
  if (!autoReveal || autoTimer || document.hidden) return;
  const now = Date.now();
  const wait = Math.max(lastLookupEnd + autoDelayMs - now, autoPausedUntil - now, 0);
  autoTimer = setTimeout(autoStep, wait);
}

function autoStep() {
  autoTimer = null;
  if (!autoReveal || document.hidden) return;
  queueVisibleAuto();
  processQueue();
}

// Counts answers and failures. Many failures in a row pause auto reveal, since X may be limiting us.
function noteLookupResult(ok, handle) {
  if (ok) {
    failureStreak = 0;
    return;
  }
  unavailableHandles.add(handle);
  failureStreak++;
  if (autoReveal && failureStreak >= AUTO_FAILURES_BEFORE_PAUSE) {
    failureStreak = 0;
    autoPausedUntil = Date.now() + AUTO_PAUSE_MS;
    dropAutoQueued();
    console.warn(`[X-Ray] Auto reveal paused for ${AUTO_PAUSE_MS / 60000} minutes: lookups keep failing.`);
    announce('Auto reveal paused because lookups keep failing');
  }
}

function finishLookup() {
  clearTimeout(lookupTimer);
  busyHandle = null;
  isProcessingQueue = false;
  lastLookupEnd = Date.now();
  // The next automatic lookup says so at once, even though it still waits out the cooldown.
  const next = requestQueue[0];
  if (next && autoHandles.has(next)) setLoadingText(next, LOADING_TEXT);
  scheduleAuto();
  if (!scraperFrame) return;
  if (requestQueue.length === 0) {
    scraperFrame.remove();
    scraperFrame = null;
  } else {
    scraperFrame.src = 'about:blank';
  }
}

function updateToLocationText(handle, location, source) {
  document
    .querySelectorAll(`.xray-pin[data-handle="${handle}"], .xray-pill[data-handle="${handle}"]`)
    .forEach((btn) => renderPill(btn, location, source));

  hideTooltip();
}

function getScraperFrame() {
  if (scraperFrame) return scraperFrame;
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '1px',
    height: '1px',
    border: 'none',
    visibility: 'hidden',
  });
  document.body.appendChild(iframe);
  scraperFrame = iframe;
  return iframe;
}

const requestQueue = [];
const requestQueueSet = new Set();
let isProcessingQueue = false;

// Turns a pin into a pill that says it is waiting for a result.
function showLoading(btn, text) {
  btn.style.transition = 'none';
  btn.replaceChildren();
  btn.className = 'xray-pill loading';
  btn.setAttribute('aria-label', text);
  btn.style.pointerEvents = 'none';
  btn.offsetHeight;
  btn.style.transition = '';

  const loadingText = document.createElement('span');
  loadingText.className = 'loading-text';
  loadingText.textContent = text;
  loadingText.setAttribute('data-text', text);

  btn.append(createGlobe(), loadingText);
}

// What a pin for this account should say right now, or null when no lookup for it is running or waiting.
function loadingTextFor(handle) {
  if (busyHandle === handle) return LOADING_TEXT;
  return requestQueueSet.has(handle) ? QUEUED_TEXT : null;
}

function queueRequest(handle, { auto = false } = {}) {
  if (locationMap.has(handle)) return;
  if (auto) autoHandles.add(handle);

  // A second pin for an account already being looked up joins that lookup instead of starting another.
  const inProgress = loadingTextFor(handle);
  // An automatic lookup waits for its turn, so its pins say "Queued..." until it starts.
  const isFirst = !isProcessingQueue && requestQueue.every((queued) => autoHandles.has(queued));
  const initialText = inProgress ?? (isFirst && !auto ? LOADING_TEXT : QUEUED_TEXT);

  document.querySelectorAll(`.xray-pin[data-handle="${handle}"]`).forEach((btn) => showLoading(btn, initialText));

  if (!autoHandles.has(handle)) announce(`Looking up @${handle}`);
  if (inProgress) return;
  // A lookup the user asked for goes ahead of the automatic ones.
  const firstAuto = requestQueue.findIndex((queued) => autoHandles.has(queued));
  if (auto || firstAuto === -1) requestQueue.push(handle);
  else requestQueue.splice(firstAuto, 0, handle);
  requestQueueSet.add(handle);
  processQueue();
}

function processQueue() {
  if (isProcessingQueue) return;
  // Automatic lookups whose posts are no longer on screen or next to it are given up before their turn.
  while (requestQueue.length && isAutoQueued(requestQueue[0]) && !isWanted(requestQueue[0])) {
    dropAutoQueued(requestQueue[0]);
  }
  if (requestQueue.length === 0) return;

  const handle = requestQueue[0];
  if (autoHandles.has(handle) && autoMustWait()) {
    setLoadingText(handle, LOADING_TEXT);
    scheduleAuto();
    return;
  }

  isProcessingQueue = true;
  requestQueue.shift();
  requestQueueSet.delete(handle);
  loadAboutPage(handle);
}

function setLoadingText(handle, text) {
  document.querySelectorAll(`.xray-pill.loading[data-handle="${handle}"]`).forEach((pill) => {
    const label = pill.querySelector('.loading-text');
    label.textContent = text;
    label.setAttribute('data-text', text);
    pill.setAttribute('aria-label', text);
  });
}

function loadAboutPage(handle) {
  busyHandle = handle;

  setLoadingText(handle, LOADING_TEXT);

  const iframe = getScraperFrame();

  iframe.src = `${window.location.origin}/${handle}/about`;

  lookupTimer = setTimeout(() => {
    console.warn(`[X-Ray] No location data for @${handle} after ${LOOKUP_TIMEOUT_MS / 1000}s`);
    document.querySelectorAll(`.xray-pill.loading[data-handle="${handle}"]`).forEach(showNotAvailable);
    if (!autoHandles.has(handle)) announce(`Not available for @${handle}`);
    autoHandles.delete(handle);
    noteLookupResult(false, handle);
    finishLookup();
    processQueue();
  }, LOOKUP_TIMEOUT_MS);
}

// The pill keeps its original pin click handler, so restoring the class and icon makes it clickable again.
function showNotAvailable(btn) {
  btn.className = 'xray-pill unavailable';
  btn.setAttribute('aria-label', NOT_AVAILABLE_TEXT);
  btn.textContent = NOT_AVAILABLE_TEXT;
  setTimeout(() => {
    // A late result may have replaced the pill meanwhile; leave that alone.
    if (!btn.isConnected || !btn.classList.contains('unavailable')) return;
    restorePin(btn);
  }, NOT_AVAILABLE_MS);
}

function restorePin(btn) {
  btn.className = 'xray-pin';
  btn.setAttribute('aria-label', PIN_LABEL);
  btn.replaceChildren(createIcon(ICONS.PIN));
  btn.style.pointerEvents = '';
}

let tooltip;

function startUI() {
  // Set on the extension's own window, which page scripts cannot see or fake (unlike a page element).
  if (window.xrayStarted) return;
  window.xrayStarted = true;

  tooltip = document.createElement('div');
  tooltip.className = 'xray-tooltip';
  document.body.appendChild(tooltip);

  liveRegion = document.createElement('div');
  liveRegion.className = 'xray-sr-only';
  liveRegion.setAttribute('role', 'status');
  document.body.appendChild(liveRegion);

  // Leaving the tab or window sends no mouseleave, so a card opened by hover would stay stuck open.
  // A focused pill is let go too, or coming back would give it focus again and reopen the card.
  const hideHints = () => {
    const active = document.activeElement;
    if (active && active.matches('.xray-pin, .xray-pill')) active.blur();
    hideHoverCard();
    hideTooltip();
  };
  window.addEventListener('blur', hideHints);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideHints();
    else refreshAuto();
  });

  const POST_SELECTOR = 'article[data-testid="tweet"]';

  function addButtons(posts) {
    posts.forEach((article) => {
      // One broken post must not stop the others from getting their pin.
      try {
        addLocationButton(article);
      } catch (e) {
        console.warn('[X-Ray] Could not add the location button to a post:', e);
      }
    });
  }

  function addLocationButton(article) {
    if (article.querySelector('.xray-pin') || article.querySelector('.xray-pill')) return;

    const userLink = article.querySelector('[data-testid="User-Name"] a[href^="/"]');
    if (!userLink) return;
    const linkName = userLink.getAttribute('href').replace('/', '');
    // Links like "/name/status/1" are not profiles; a pin there could never finish.
    if (!HANDLE_PATTERN.test(linkName)) return;
    // "@SpaceX" and "@spacex" are one account, so they share one saved result and one lookup.
    const handle = linkName.toLowerCase();

    const caret = article.querySelector('[data-testid="caret"]');
    const more = article.querySelector('div[aria-label="More"]');

    const targetNode = caret || more;

    if (!targetNode) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.handle = handle;

    if (locationMap.has(handle)) {
      const { loc, src } = locationMap.get(handle);
      renderPill(btn, loc, src);
    } else {
      btn.className = 'xray-pin';
      btn.setAttribute('aria-label', PIN_LABEL);
      btn.replaceChildren(createIcon(ICONS.PIN));

      btn.onclick = (e) => {
        if (!e.isTrusted) return;
        e.preventDefault();
        e.stopPropagation();
        hideTooltip();
        // Enter and Space still reach a pill that is looking up; only a pin may start a lookup.
        if (btn.classList.contains('xray-pin')) queueRequest(handle);
      };

      // A post that appears while its account is being looked up joins that lookup.
      const waiting = loadingTextFor(handle);
      if (waiting) showLoading(btn, waiting);

      // These stay attached while the pin is a loading pill, which must not show the pin's hint.
      btn.onmouseenter = btn.onfocus = () => {
        if (btn.classList.contains('xray-pin')) showTooltip(btn, PIN_LABEL);
      };
      btn.onmouseleave = btn.onblur = hideTooltip;
      btn.onkeydown = (e) => {
        if (e.key === 'Escape') hideTooltip();
      };
    }

    if (targetNode.parentNode) {
      targetNode.parentNode.insertBefore(btn, targetNode);
    }
    if (autoReveal) observePin(btn);
  }

  // Posts that changed since the last check, handled together once per frame.
  const changedPosts = new Set();
  let checkScheduled = false;

  function checkChangedPosts() {
    checkScheduled = false;
    const posts = [...changedPosts].filter((post) => post.isConnected);
    changedPosts.clear();
    addButtons(posts);
  }

  // A new post, or new content inside one (X fills in a post's menu button after the post appears).
  function collectChangedPosts(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const post = node.closest(POST_SELECTOR);
    if (post) changedPosts.add(post);
    node.querySelectorAll(POST_SELECTOR).forEach((inner) => changedPosts.add(inner));
  }

  function scheduleCheck() {
    if (changedPosts.size && !checkScheduled) {
      checkScheduled = true;
      requestAnimationFrame(checkChangedPosts);
    }
  }

  // Results cleared from the popup are forgotten here too: their pills turn back into pins.
  // An account that still has a saved spelling is kept (the tidy-up only drops the older capitals).
  // Pills that are still looking something up, or showing "Not available", are left to finish.
  async function forgetRemovedResults(changes, area) {
    if (area !== 'local') return;
    let handles = Object.keys(changes)
      .filter((key) => key.startsWith(SAVED_PREFIX) && changes[key].newValue === undefined)
      .map((key) => key.slice(SAVED_PREFIX.length).toLowerCase())
      .filter((handle) => HANDLE_PATTERN.test(handle));
    if (!handles.length) return;
    try {
      const store = savedStore();
      if (!store) return;
      const stillSaved = new Set(
        Object.keys(await store.get(null))
          .filter((key) => key.startsWith(SAVED_PREFIX))
          .map((key) => key.slice(SAVED_PREFIX.length).toLowerCase())
      );
      handles = handles.filter((handle) => !stillSaved.has(handle));
    } catch (e) {
      console.warn('[X-Ray] Could not check saved locations:', e);
      return;
    }
    if (!handles.length) return;
    hideHoverCard();
    for (const handle of handles) {
      locationMap.delete(handle);
      document.querySelectorAll(`.xray-pill[data-handle="${handle}"]`).forEach((pill) => {
        if (pill.classList.contains('loading') || pill.classList.contains('unavailable')) return;
        const post = pill.closest(POST_SELECTOR);
        pill.remove();
        if (post) changedPosts.add(post);
      });
    }
    scheduleCheck();
  }

  if (chrome.runtime?.id) {
    chrome.storage.onChanged.addListener(forgetRemovedResults);
    chrome.storage.onChanged.addListener(onSettingsChanged);
  }

  const observer = new MutationObserver((mutations) => {
    // X removes posts as you scroll; the card must not stay behind for a pill that is gone.
    if (hoverTarget && !hoverTarget.isConnected) hideHoverCard();
    if (hintTarget && !hintTarget.isConnected) hideTooltip();
    for (const mutation of mutations) mutation.addedNodes.forEach(collectChangedPosts);
    scheduleCheck();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  addButtons(document.querySelectorAll(POST_SELECTOR));
  syncAutoReveal();
}

// The pin the hint is showing for, so the hint can go away if X removes that post.
let hintTarget = null;
// Width used until the browser can measure the hint.
const HINT_WIDTH_FALLBACK = 170;
const HINT_HEIGHT_FALLBACK = 30;
const HINT_GAP = 5;

function showTooltip(el, text) {
  hintTarget = el;
  tooltip.textContent = text;
  tooltip.style.display = 'block';
  const rect = el.getBoundingClientRect();
  const width = tooltip.offsetWidth || HINT_WIDTH_FALLBACK;
  const height = tooltip.offsetHeight || HINT_HEIGHT_FALLBACK;
  // Pins sit next to the post menu, close to the window edge in narrow windows.
  const maxLeft = window.scrollX + window.innerWidth - width - CARD_MARGIN;
  // Under the pin, or above it when the window ends first and there is room above.
  const needed = height + HINT_GAP + CARD_MARGIN;
  const opensAbove = rect.bottom + needed > window.innerHeight && rect.top >= needed;
  const top = opensAbove ? rect.top - height - HINT_GAP : rect.bottom + HINT_GAP;
  tooltip.style.top = top + window.scrollY + 'px';
  tooltip.style.left = Math.max(window.scrollX + CARD_MARGIN, Math.min(maxLeft, rect.left + window.scrollX)) + 'px';
}

function hideTooltip() {
  hintTarget = null;
  if (tooltip) tooltip.style.display = 'none';
}

function createHoverRow(label, icon, text) {
  const row = document.createElement('div');
  row.className = 'xray-hover-row';
  const labelEl = document.createElement('span');
  labelEl.className = 'xray-hover-label';
  labelEl.textContent = label;
  const value = document.createElement('span');
  value.className = 'xray-hover-value';
  value.append(icon, text);
  row.append(labelEl, value);
  return row;
}

function createHoverCard() {
  const card = document.createElement('div');
  card.className = 'xray-hover-card';
  document.body.appendChild(card);
  return card;
}

let hoverCard = null;
// The pill the card is showing, so the card can go away if X removes that post.
let hoverTarget = null;
const CARD_MARGIN = 8;

function showHoverCard(btn, location, source) {
  // Made again if the page removed it.
  if (!hoverCard || !hoverCard.isConnected) hoverCard = createHoverCard();
  const card = hoverCard;
  hoverTarget = btn;

  const isAndroid = Boolean(source) && /android|play store/i.test(source);
  if (isAndroid) {
    card.classList.add('android-device');
  } else {
    card.classList.remove('android-device');
  }

  let store = { code: null, name: '' };
  let sourcePlatform = '';

  if (source) {
    // A store region that is not a country (like "South Asia") is shown by name, as the pill does.
    const parsed = splitLeadingCountry(sourceText(source));
    store = { code: parsed.code, name: parsed.name || regionText(parsed.rest) };

    if (/iPhone|iPad|iOS|App Store/i.test(source)) {
      sourcePlatform = 'iOS';
    } else if (/Android|Play Store/i.test(source)) {
      sourcePlatform = 'Android';
    } else if (/Web/i.test(source)) {
      sourcePlatform = 'Web';
    } else {
      sourcePlatform = 'Unknown';
    }

    // The web app has no store country, so the account's own location stands in for it.
    if (sourcePlatform === 'Web' && !store.code && location) {
      store = { code: countryCode(location), name: location };
    }
  }

  card.replaceChildren(
    createHoverRow('Based in', createFlag(location), location || 'Unknown'),
    createHoverRow(
      'Platform',
      store.code ? createFlagImage(store.code, store.name) : createGlobe(),
      sourcePlatform ? `${store.name || 'Unknown'} · ${sourcePlatform}` : 'Unknown'
    )
  );

  const rect = btn.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;

  const cardWidth = card.offsetWidth || 210;
  const cardHeight = card.offsetHeight || 75;

  const spaceRight = window.innerWidth - rect.right;
  const placeOnLeft = spaceRight < cardWidth + 16 && rect.left > cardWidth + 16;

  // Beside the pill, but never past the window edge, even when neither side has enough room.
  const idealLeft = placeOnLeft ? rect.left + scrollX - cardWidth - CARD_MARGIN : rect.right + scrollX + CARD_MARGIN;
  const maxLeft = scrollX + window.innerWidth - cardWidth - CARD_MARGIN;
  card.classList.toggle('pos-left', placeOnLeft);
  card.style.left = Math.max(scrollX + CARD_MARGIN, Math.min(maxLeft, idealLeft)) + 'px';

  const pillCenterY = rect.top + scrollY + rect.height / 2;
  const idealTop = pillCenterY - cardHeight / 2;
  const minTop = scrollY + CARD_MARGIN;
  const maxTop = scrollY + window.innerHeight - cardHeight - CARD_MARGIN;
  const cardTop = Math.max(minTop, Math.min(maxTop, idealTop));
  card.style.top = cardTop + 'px';

  const arrowOffset = Math.max(12, Math.min(cardHeight - 18, pillCenterY - cardTop - 6));
  card.style.setProperty('--arrow-top', `${arrowOffset}px`);
  requestAnimationFrame(() => {
    // Skipped if the pointer already left or the post went away within this frame.
    if (hoverTarget === btn) card.classList.add('show');
  });
}

function hideHoverCard() {
  hoverTarget = null;
  if (hoverCard) hoverCard.classList.remove('show');
}

// Saved results load first, so posts by accounts already looked up never flash a pin.
Promise.all([loadSavedResults(), loadSettings()]).then(() => {
  if (document.body) startUI();
  else document.addEventListener('DOMContentLoaded', startUI);
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createFlag, createSourceContent };
}
