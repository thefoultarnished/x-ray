if (document.head) {
  const prefetch = document.createElement('link');
  prefetch.rel = 'dns-prefetch';
  prefetch.href = 'https://flagcdn.com';
  document.head.appendChild(prefetch);

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://flagcdn.com';
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);
}

const script = document.createElement('script');
script.src = chrome.runtime.getURL('parser.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

if (window === window.top) {
  const ICONS = {
    PIN: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17.5px; height:17.5px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    GLOBE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13.5px; height:13.5px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    CHECKMARK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:11.5px; height:11.5px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
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

  // Codes Chrome knows that are not countries or that flagcdn has no flag for.
  const NO_FLAG_CODES = new Set(['AC', 'CP', 'CQ', 'DG', 'EA', 'IC', 'TA', 'QO', 'EZ', 'ZZ']);

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
  function buildCountryCodes() {
    const codes = new Map();
    if (typeof Intl.DisplayNames === 'function') {
      const names = new Intl.DisplayNames(['en'], { type: 'region' });
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (const a of letters) {
        for (const b of letters) {
          const code = a + b;
          if (NO_FLAG_CODES.has(code)) continue;
          const name = names.of(code);
          // Skips unknown codes and outdated ones Chrome maps to a current code (UK -> GB).
          if (!name || name === code || new Intl.Locale(`und-${code}`).region !== code) continue;
          codes.set(normalizeName(name), code.toLowerCase());
        }
      }
    }
    for (const [name, code] of Object.entries(EXTRA_COUNTRY_NAMES)) codes.set(normalizeName(name), code);
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
  function sourceText(source) {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    return (doc.body.textContent || '')
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
    globe.className = 'globe-icon';
    globe.append(createIcon(ICONS.GLOBE));
    return globe;
  }

  function createFlagImage(code, alt) {
    const img = document.createElement('img');
    img.src = `https://flagcdn.com/w40/${code}.png`;
    img.className = 'flag-img';
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

  function renderPill(btn, location, source) {
    if (btn._resetCopyTimer) {
      clearTimeout(btn._resetCopyTimer);
      btn._resetCopyTimer = null;
    }

    const isAndroid = Boolean(source) && /android|play store/i.test(source);
    const pillClass = isAndroid ? 'loc-pill android-device' : 'loc-pill';
    btn.className = pillClass;
    // Clears the click block left over from the loading state.
    btn.style.pointerEvents = '';
    btn.replaceChildren(createFlag(location), location || 'Unknown Loc');
    if (source) {
      const sourceText = document.createElement('span');
      sourceText.className = 'source-text';
      sourceText.append(createSourceContent(source, location));
      btn.append(sourceText);
    }

    const originalContent = [...btn.childNodes];
    let isCopying = false;

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (isCopying || btn.classList.contains('copied')) return;
      isCopying = true;

      const locText = location || 'Unknown';
      const copyText = source ? `${locText} (${source})` : locText;

      try {
        const copyPromise = navigator.clipboard?.writeText?.(copyText);
        if (!copyPromise) {
          isCopying = false;
          return;
        }

        Promise.resolve(copyPromise)
          .then(() => {
            btn.className = `${pillClass} copied`;
            btn.replaceChildren(createIcon(ICONS.CHECKMARK), ' Copied!');

            clearTimeout(btn._resetCopyTimer);
            btn._resetCopyTimer = setTimeout(() => {
              btn.className = pillClass;
              btn.replaceChildren(...originalContent);
              isCopying = false;
              btn._resetCopyTimer = null;
            }, 1800);
          })
          .catch(() => {
            isCopying = false;
          });
      } catch {
        isCopying = false;
      }
    };
    btn.onmouseenter = () => showHoverCard(btn, location, source);
    btn.onmouseleave = () => hideHoverCard();
  }

  const locationMap = {};
  let scraperFrame = null;
  let busyHandle = null;
  const LOADING_TEXT = 'Locating...';
  const NOT_AVAILABLE_TEXT = 'Not available';
  const LOOKUP_TIMEOUT_MS = 10000;
  const NOT_AVAILABLE_MS = 3000;
  const SAVED_PREFIX = 'loc:';
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
      const { [MOVED_OLD_RESULTS_KEY]: alreadyMoved } = await store.get(MOVED_OLD_RESULTS_KEY);
      if (!alreadyMoved) {
        await moveOldSavedResults(store, now);
        await store.set({ [MOVED_OLD_RESULTS_KEY]: true });
      }
      localStorage.removeItem(OLD_CACHE_KEY);
      for (const [key, entry] of Object.entries(await store.get(null))) {
        if (key.startsWith(SAVED_PREFIX) && isUsable(entry, now)) {
          locationMap[key.slice(SAVED_PREFIX.length)] = { loc: entry.loc, src: entry.src };
        }
      }
    } catch (e) {
      console.warn('[X-Ray] Could not read saved locations:', e);
    }
  }

  // Drops results older than 90 days and, beyond 10,000, the oldest ones. Other extension data is left alone.
  async function pruneSavedResults(store, now) {
    const saved = Object.entries(await store.get(null)).filter(([key]) => key.startsWith(SAVED_PREFIX));
    const usable = saved.filter(([, entry]) => isUsable(entry, now)).sort((a, b) => b[1].timestamp - a[1].timestamp);
    const drop = [...saved.filter(([, entry]) => !isUsable(entry, now)), ...usable.slice(MAX_SAVED_RESULTS)];
    if (drop.length) await store.remove(drop.map(([key]) => key));
  }

  async function saveToCache(handle, loc, src) {
    locationMap[handle] = { loc, src };
    const now = Date.now();
    try {
      const store = savedStore();
      if (!store) return;
      // One entry per account, so two X tabs saving at once never overwrite each other.
      await store.set({ [SAVED_PREFIX + handle]: { loc, src, timestamp: now } });
      await pruneSavedResults(store, now);
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

    scraperFrame.src = 'about:blank';
    busyHandle = null;
    isProcessingQueue = false;
    setTimeout(processQueue, 500);
  });

  function updateToLocationText(handle, location, source) {
    document
      .querySelectorAll(`.loc-btn[data-handle="${handle}"], .loc-pill[data-handle="${handle}"]`)
      .forEach((btn) => renderPill(btn, location, source));

    if (!busyHandle && requestQueue.length === 0 && scraperFrame) {
      scraperFrame.remove();
      scraperFrame = null;
    }

    const tooltip = document.getElementById('x-tooltip');
    if (tooltip) tooltip.style.display = 'none';
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

  function queueRequest(handle) {
    if (locationMap[handle]) return;
    if (requestQueueSet.has(handle)) return;

    const isFirst = requestQueue.length === 0 && !isProcessingQueue;
    const initialText = isFirst ? LOADING_TEXT : 'Queued...';

    document.querySelectorAll(`.loc-btn[data-handle="${handle}"]`).forEach((btn) => {
      btn.style.transition = 'none';
      btn.innerHTML = '';
      btn.className = 'loc-pill loading';
      btn.style.pointerEvents = 'none';
      btn.offsetHeight;
      btn.style.transition = '';

      const globeIcon = document.createElement('span');
      globeIcon.className = 'globe-icon';
      globeIcon.innerHTML = ICONS.GLOBE;

      const loadingText = document.createElement('span');
      loadingText.className = 'loading-text';
      loadingText.textContent = initialText;
      loadingText.setAttribute('data-text', initialText);

      btn.appendChild(globeIcon);
      btn.appendChild(loadingText);
    });

    requestQueue.push(handle);
    requestQueueSet.add(handle);
    processQueue();
  }

  function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;

    const handle = requestQueue[0];

    isProcessingQueue = true;
    requestQueue.shift();
    requestQueueSet.delete(handle);
    loadAboutPage(handle);
  }

  function loadAboutPage(handle) {
    busyHandle = handle;

    document.querySelectorAll(`.loc-pill.loading[data-handle="${handle}"] .loading-text`).forEach((el) => {
      el.textContent = LOADING_TEXT;
      el.setAttribute('data-text', LOADING_TEXT);
    });

    const iframe = getScraperFrame();

    iframe.src = `${window.location.origin}/${handle}/about`;

    setTimeout(() => {
      if (busyHandle !== handle) return;
      busyHandle = null;
      isProcessingQueue = false;
      console.warn(`[X-Ray] No location data for @${handle} after ${LOOKUP_TIMEOUT_MS / 1000}s`);
      document.querySelectorAll(`.loc-pill.loading[data-handle="${handle}"]`).forEach(showNotAvailable);
      if (scraperFrame) scraperFrame.src = 'about:blank';
      processQueue();
    }, LOOKUP_TIMEOUT_MS);
  }

  // The pill keeps its original pin click handler, so restoring the class and icon makes it clickable again.
  function showNotAvailable(btn) {
    btn.className = 'loc-pill unavailable';
    btn.textContent = NOT_AVAILABLE_TEXT;
    setTimeout(() => {
      // A late result may have replaced the pill meanwhile; leave that alone.
      if (!btn.isConnected || !btn.classList.contains('unavailable')) return;
      btn.className = 'loc-btn';
      btn.innerHTML = ICONS.PIN;
      btn.style.pointerEvents = '';
    }, NOT_AVAILABLE_MS);
  }

  let tooltip;

  function startUI() {
    if (document.getElementById('x-tooltip')) return;

    tooltip = document.createElement('div');
    tooltip.id = 'x-tooltip';
    Object.assign(tooltip.style, {
      position: 'absolute',
      display: 'none',
      background: 'rgba(0, 0, 0, 0.92)',
      color: '#fff',
      padding: '7px 12px',
      borderRadius: '8px',
      zIndex: '99999',
      pointerEvents: 'none',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(tooltip);

    function processTweets() {
      document.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
        // One broken post must not stop the others from getting their pin.
        try {
          addLocationButton(article);
        } catch (e) {
          console.warn('[X-Ray] Could not add the location button to a post:', e);
        }
      });
    }

    function addLocationButton(article) {
      if (article.querySelector('.loc-btn') || article.querySelector('.loc-pill')) return;

      const userLink = article.querySelector('[data-testid="User-Name"] a[href^="/"]');
      if (!userLink) return;
      const handle = userLink.getAttribute('href').replace('/', '');

      const caret = article.querySelector('[data-testid="caret"]');
      const more = article.querySelector('div[aria-label="More"]');

      const targetNode = caret || more;

      if (!targetNode) return;

      const btn = document.createElement('div');
      btn.dataset.handle = handle;

      if (locationMap[handle]) {
        renderPill(btn, locationMap[handle].loc, locationMap[handle].src);
      } else {
        btn.className = 'loc-btn';
        btn.innerHTML = ICONS.PIN;

        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          tooltip.style.display = 'none';
          queueRequest(handle);
        };

        btn.onmouseenter = () => showTooltip(btn, 'Get Location & App Store');
        btn.onmouseleave = () => {
          tooltip.style.display = 'none';
        };
      }

      if (targetNode.parentNode) {
        targetNode.parentNode.insertBefore(btn, targetNode);
      }
    }

    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) processTweets();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    processTweets();
  }

  function showTooltip(el, html) {
    const rect = el.getBoundingClientRect();
    tooltip.style.top = rect.bottom + window.scrollY + 5 + 'px';
    tooltip.style.left = rect.left + 'px';
    tooltip.textContent = html;
    tooltip.style.display = 'block';
  }

  function createHoverRow(label, icon, text) {
    const row = document.createElement('div');
    row.className = 'loc-hover-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'loc-hover-label';
    labelEl.textContent = label;
    const value = document.createElement('span');
    value.className = 'loc-hover-value';
    value.append(icon, text);
    row.append(labelEl, value);
    return row;
  }

  function createHoverCard() {
    const card = document.createElement('div');
    card.className = 'loc-hover-card';
    card.id = 'loc-hover-card';
    document.body.appendChild(card);
    return card;
  }

  function showHoverCard(btn, location, source) {
    let card = document.getElementById('loc-hover-card');
    if (!card) {
      card = createHoverCard();
    }

    let store = { code: null, name: '' };
    let sourcePlatform = '';

    if (source) {
      store = splitLeadingCountry(sourceText(source));

      if (/iPhone|iPad|iOS|App Store/i.test(source)) {
        sourcePlatform = 'iOS';
      } else if (/Android|Play Store/i.test(source)) {
        sourcePlatform = 'Android';
      } else if (/Web/i.test(source)) {
        sourcePlatform = 'Web';
      } else {
        sourcePlatform = 'Unknown';
      }
    }

    card.replaceChildren(
      createHoverRow('Based in', createFlag(location), location || 'Unknown'),
      createHoverRow(
        'Platform',
        store.code ? createFlagImage(store.code, store.name) : createGlobe(),
        `${store.name || 'Unknown'} · ${sourcePlatform}`
      )
    );

    const rect = btn.getBoundingClientRect();
    const cardHeight = 100;
    const scrollY = window.scrollY || window.pageYOffset;

    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow > cardHeight + 20) {
      card.style.top = rect.bottom + scrollY + 8 + 'px';
    } else {
      card.style.top = rect.top + scrollY - cardHeight - 8 + 'px';
    }

    card.style.left = rect.left + 'px';

    requestAnimationFrame(() => {
      card.classList.add('show');
    });
  }

  function hideHoverCard() {
    const card = document.getElementById('loc-hover-card');
    if (card) {
      card.classList.remove('show');
    }
  }

  // Saved results load first, so posts by accounts already looked up never flash a pin.
  loadSavedResults().then(() => {
    if (document.body) startUI();
    else document.addEventListener('DOMContentLoaded', startUI);
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createFlag, createSourceContent };
  }
}
