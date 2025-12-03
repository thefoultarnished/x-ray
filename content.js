// REDACTED PARTS OF THE FUNCTIONALITY AS I AM NOT KEEPING IT OPEN SOURCE ANYMORE.
// leaving some code  INTACT TO HELP UNDERSTAND THE LOGIC AND FLOW OF THE EXTENSION. 
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
script.src = chrome.runtime.getURL('parser.js'); // i have redacted parser so you have to write your own otherwise my extension is of no use :)
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

if (window === window.top) {
    

    const ICONS = {
        PIN: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17.5px; height:17.5px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
        GLOBE: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13.5px; height:13.5px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
        CHECKMARK: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:11.5px; height:11.5px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    };


    const PLATFORM_ICONS = {
        APPLE: `<svg viewBox="0 0 384 512" fill="currentColor" style="width:11.5px; height:13.5px; display:inline-block; vertical-align:middle;"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 43.3-25.6 63.7 26.2 1.3 52.6-6.2 69.5-26.1z"></path></svg>`,
        ANDROID: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" style="width:13.5px; height:13.5px; display:inline-block; vertical-align:middle;"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"></path></svg>`,
        WEB: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13.5px; height:13.5px; display:inline-block; vertical-align:middle;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
    };


    const COUNTRY_CODES = {
        "usa": "us", "united states": "us", "america": "us", "us": "us", "tx": "us", "ny": "us",

        "uk": "gb", "united kingdom": "gb", "england": "gb", "london": "gb", "britain": "gb", "scotland": "gb", "wales": "gb",
        "france": "fr", "paris": "fr",
        "germany": "de", "berlin": "de", "deutschland": "de",
        "italy": "it", "rome": "it", "italia": "it",
        "spain": "es", "madrid": "es", "espana": "es",
        "russia": "ru", "moscow": "ru",
        "ukraine": "ua", "poland": "pl", "romania": "ro", "netherlands": "nl", "holland": "nl",
        "belgium": "be", "greece": "gr", "portugal": "pt", "czech republic": "cz", "czechia": "cz",
        "hungary": "hu", "sweden": "se", "austria": "at", "switzerland": "ch", "serbia": "rs",
        "bulgaria": "bg", "denmark": "dk", "finland": "fi", "slovakia": "sk", "norway": "no",
        "ireland": "ie", "croatia": "hr", "moldova": "md", "bosnia": "ba", "albania": "al",
        "lithuania": "lt", "north macedonia": "mk", "slovenia": "si", "latvia": "lv", 
        "estonia": "ee", "montenegro": "me", "luxembourg": "lu", "malta": "mt", "iceland": "is",
        "andorra": "ad", "monaco": "mc", "liechtenstein": "li", "san marino": "sm", "vatican": "va",
        "china": "cn", "beijing": "cn", "shanghai": "cn",
        "india": "in", "mumbai": "in", "delhi": "in",
        "japan": "jp", "tokyo": "jp",
        "indonesia": "id", "pakistan": "pk", "bangladesh": "bd", "philippines": "ph",
        "vietnam": "vn", "turkey": "tr", "turkiye": "tr", "iran": "ir", "thailand": "th",
        "myanmar": "mm", "south korea": "kr", "korea": "kr", "iraq": "iq", "afghanistan": "af",
        "saudi arabia": "sa", "uzbekistan": "uz", "malaysia": "my", "yemen": "ye", "nepal": "np",
        "north korea": "kp", "sri lanka": "lk", "kazakhstan": "kz", "syria": "sy", "cambodia": "kh",
        "jordan": "jo", "azerbaijan": "az", "uae": "ae", "dubai": "ae", "united arab emirates": "ae",
        "tajikistan": "tj", "israel": "il", "laos": "la", "lebanon": "lb", "kyrgyzstan": "kg",
        "turkmenistan": "tm", "singapore": "sg", "oman": "om", "palestine": "ps", "kuwait": "kw",
        "georgia": "ge", "mongolia": "mn", "armenia": "am", "qatar": "qa", "bahrain": "bh",
        "timor-leste": "tl", "cyprus": "cy", "bhutan": "bt", "maldives": "mv", "brunei": "bn",
        "hong kong": "hk", "taiwan": "tw",
        "brazil": "br", "brasil": "br", "colombia": "co", "argentina": "ar", "peru": "pe",
        "venezuela": "ve", "chile": "cl", "ecuador": "ec", "bolivia": "bo", "paraguay": "py",
        "uruguay": "uy", "guyana": "gy", "suriname": "sr",
        "nigeria": "ng", "ethiopia": "et", "egypt": "eg", "dr congo": "cd", "tanzania": "tz",
        "south africa": "za", "kenya": "ke", "uganda": "ug", "algeria": "dz", "sudan": "sd",
        "morocco": "ma", "angola": "ao", "ghana": "gh", "mozambique": "mz", "madagascar": "mg",
        "cameroon": "cm", "ivory coast": "ci", "niger": "ne", "burkina faso": "bf", "mali": "ml",
        "malawi": "mw", "zambia": "zm", "senegal": "sn", "chad": "td", "somalia": "so",
        "zimbabwe": "zw", "guinea": "gn", "rwanda": "rw", "benin": "bj", "burundi": "bi",
        "tunisia": "tn", "south sudan": "ss", "togo": "tg", "sierra leone": "sl", "libya": "ly",
        "congo": "cg", "liberia": "lr", "central african republic": "cf", "mauritania": "mr",
        "eritrea": "er", "namibia": "na", "gambia": "gm", "botswana": "bw", "gabon": "ga",
        "lesotho": "ls", "guinea-bissau": "gw", "equatorial guinea": "gq", "mauritius": "mu",
        "eswatini": "sz", "djibouti": "dj", "comoros": "km", "cape verde": "cv", "sao tome": "st",
        "seychelles": "sc",
        "australia": "au", "papua new guinea": "pg", "new zealand": "nz", "fiji": "fj",
        "solomon islands": "sb", "micronesia": "fm", "vanuatu": "vu", "samoa": "ws", "kiribati": "ki",
        "tonga": "to", "marshall islands": "mh", "palau": "pw", "tuvalu": "tv", "nauru": "nr"
    };


    const SORTED_COUNTRY_KEYS = Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length);


    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getFlagHtml(locText) {
        if (!locText) return `<span class="globe-icon">${ICONS.GLOBE}</span>`;
        const cleanText = locText.toLowerCase();
        
        if (COUNTRY_CODES[cleanText]) {
            const escapedLoc = escapeHtml(locText);
            return `<img src="https://flagcdn.com/w40/${COUNTRY_CODES[cleanText]}.png" class="flag-img" alt="${escapedLoc}" loading="eager">`;
        }
        
        for (const key of SORTED_COUNTRY_KEYS) {
            if (cleanText.includes(key)) {
                const escapedLoc = escapeHtml(locText);
                return `<img src="https://flagcdn.com/w40/${COUNTRY_CODES[key]}.png" class="flag-img" alt="${escapedLoc}" loading="eager">`;
            }
        }
        return `<span class="globe-icon">${ICONS.GLOBE}</span>`;
    }


function cleanSource(source, location) {
  // [REDACTED]
}

    const locationMap = {}; 
    let scraperFrame = null;
    let busyHandle = null;
    const LOADING_TEXT = 'Locating...';
    const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; 

    try {
        const cached = localStorage.getItem('x_location_cache');
        if (cached) {
            const parsed = JSON.parse(cached);
            const now = Date.now();
            
            Object.keys(parsed).forEach(handle => {
                const entry = parsed[handle];
                if (entry.timestamp && (now - entry.timestamp < CACHE_DURATION)) {
                    locationMap[handle] = { loc: entry.loc, src: entry.src };
                }
            });
            
            if (Object.keys(locationMap).length > 0) {
                localStorage.setItem('x_location_cache', JSON.stringify(
                    Object.fromEntries(
                        Object.entries(locationMap).map(([h, data]) => [h, { ...data, timestamp: parsed[h]?.timestamp || now }])
                    )
                ));
            } else {
                localStorage.removeItem('x_location_cache');
            }
        }
    } catch (e) {
        console.error('Failed to load location cache:', e);
    }

    function saveToCache(handle, loc, src) {
        locationMap[handle] = { loc, src };
        try {
            const cacheData = Object.fromEntries(
                Object.entries(locationMap).map(([h, data]) => [h, { ...data, timestamp: Date.now() }])
            );
            localStorage.setItem('x_location_cache', JSON.stringify(cacheData));
        } catch (e) {
            console.error('Failed to save location cache:', e);
        }
    }

    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://x.com' && event.origin !== 'https://twitter.com') {
            return;
        }
        
        if (event.data && event.data.type === 'X_LOCATION_FOUND') {
            const { handle, location, source } = event.data;
            
            saveToCache(handle, location, source);
            updateToLocationText(handle, location, source);
            
            if (scraperFrame) { 
                scraperFrame.src = 'about:blank'; 
                busyHandle = null; 
            }
            isProcessingQueue = false;
            setTimeout(processQueue, 500);
        }
    });

function updateToLocationText(handle, location, source) {
    const flagHtml = getFlagHtml(location);
    const escapedLocation = escapeHtml(location || "Unknown Loc");
    const sourceHtml = source ? `<span class="source-text">${cleanSource(source, location)}</span>` : "";
    const displayText = location ? escapedLocation : "Unknown Loc";
    const isAndroid = source && /android|play store/i.test(source);

    document.querySelectorAll(`.loc-btn[data-handle="${handle}"], .loc-pill[data-handle="${handle}"]`).forEach(btn => {
        btn.className = isAndroid ? 'loc-pill android-device' : 'loc-pill';
        btn.innerHTML = `${flagHtml}${displayText}${sourceHtml}`;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            
            const copyText = source ? `${location} (${source})` : location;
            navigator.clipboard.writeText(copyText);
            
            const oldHtml = newBtn.innerHTML;
            const oldClass = newBtn.className;
            newBtn.className = isAndroid ? 'loc-pill android-device copied' : 'loc-pill copied';
            newBtn.innerHTML = `${ICONS.CHECKMARK} Copied!`;
            
            setTimeout(() => {
                newBtn.className = oldClass;
                newBtn.innerHTML = oldHtml;
            }, 1800);
        };
        newBtn.onmouseenter = () => showHoverCard(newBtn, location, source);
        newBtn.onmouseleave = () => hideHoverCard();
    });
    
    if (!busyHandle && requestQueue.length === 0 && scraperFrame) {
        scraperFrame.remove();
        scraperFrame = null;
    }
    
    const tooltip = document.getElementById('x-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

    function getScraperFrame() {
        // [REDACTED] iframe creation logic
    }

    const requestQueue = [];
    const requestQueueSet = new Set();
    let isProcessingQueue = false;

    function queueRequest(handle) {
        // [REDACTED] queue  logic
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
        // [REDACTED] twiiter.com/user/about loading logic
    }


    let tooltip;
    
    function startUI() {
        if (document.getElementById('x-tooltip')) return;

        tooltip = document.createElement('div');
        tooltip.id = 'x-tooltip';
        Object.assign(tooltip.style, {
            position:'absolute', 
            display:'none', 
            background:'rgba(0, 0, 0, 0.92)', 
            color:'#fff', 
            padding:'7px 12px', 
            borderRadius:'8px', 
            zIndex:'99999', 
            pointerEvents:'none', 
            fontSize: '12px', 
            whiteSpace: 'nowrap'
        });
        document.body.appendChild(tooltip);

        function processTweets() {
            document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
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
                    const data = locationMap[handle];
                    const flagHtml = getFlagHtml(data.loc);
                    const escapedLocation = escapeHtml(data.loc || "Unknown Loc");
                    const sourceHtml = data.src ? `<span class="source-text">${cleanSource(data.src, data.loc)}</span>` : "";
                    const displayText = data.loc ? escapedLocation : "Unknown Loc";
                    
                    const isAndroid = data.src && /android|play store/i.test(data.src);

                    btn.className = isAndroid ? 'loc-pill android-device' : 'loc-pill';
                    btn.innerHTML = `${flagHtml}${displayText}${sourceHtml}`;
                    
                    btn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        const copyText = data.src ? `${data.loc} (${data.src})` : data.loc;
                        navigator.clipboard.writeText(copyText);
                        
                        const oldHtml = btn.innerHTML;
                        const oldClass = btn.className;
                        btn.className = isAndroid ? 'loc-pill android-device copied' : 'loc-pill copied';
                        btn.innerHTML = `${ICONS.CHECKMARK} Copied!`;
                        
                        setTimeout(() => {
                            btn.className = oldClass;
                            btn.innerHTML = oldHtml;
                        }, 1800);
                    };
                    btn.onmouseenter = () => showHoverCard(btn, data.loc, data.src);
                    btn.onmouseleave = () => hideHoverCard();
                } else {
                    btn.className = 'loc-btn';
                    btn.innerHTML = ICONS.PIN;
                    
                    btn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        tooltip.style.display = 'none';
                        queueRequest(handle);
                    };

                    btn.onmouseenter = () => showTooltip(btn, "Get Location & App Store");
                    btn.onmouseleave = () => { tooltip.style.display = 'none'; };
                }

                if (targetNode.parentNode) {
                    targetNode.parentNode.insertBefore(btn, targetNode);
                }
            });
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
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        tooltip.style.left = rect.left + 'px';
        tooltip.textContent = html;
        tooltip.style.display = 'block';
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
    
    const flagHtml = getFlagHtml(location);
    const escapedLocation = escapeHtml(location || 'Unknown');
    
    let sourceCountry = '';
    let sourcePlatform = '';
    
    if (source) {
        const cleanedSource = source.replace(/Twitter for /gi, "").replace(/ App$/i, "").trim();
        
        const sourceWords = cleanedSource.toLowerCase().split(/\s+/);
        for (const word of sourceWords) {
            if (COUNTRY_CODES[word]) {
                sourceCountry = word.charAt(0).toUpperCase() + word.slice(1);
                break;
            }
        }
        
        if (!sourceCountry) {
            for (const key of SORTED_COUNTRY_KEYS) {
                if (cleanedSource.toLowerCase().includes(key)) {
                    sourceCountry = key.charAt(0).toUpperCase() + key.slice(1);
                    break;
                }
            }
        }
        
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
    
    const sourceCountryFlag = sourceCountry ? getFlagHtml(sourceCountry) : `<span class="globe-icon">${ICONS.GLOBE}</span>`;
    const escapedSourceCountry = escapeHtml(sourceCountry || 'Unknown');
    const escapedSourcePlatform = escapeHtml(sourcePlatform);
    
    card.innerHTML = `
        <div class="loc-hover-row">
            <span class="loc-hover-label">Based in</span>
            <span class="loc-hover-value">${flagHtml}${escapedLocation}</span>
        </div>
        <div class="loc-hover-row">
            <span class="loc-hover-label">Platform</span>
            <span class="loc-hover-value">${sourceCountryFlag}${escapedSourceCountry} · ${escapedSourcePlatform}</span>
        </div>
    `;
    
    const rect = btn.getBoundingClientRect();
    const cardHeight = 100; 
    const scrollY = window.scrollY || window.pageYOffset;
    
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow > cardHeight + 20) {
        card.style.top = (rect.bottom + scrollY + 8) + 'px';
    } else {
        card.style.top = (rect.top + scrollY - cardHeight - 8) + 'px';
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

    if (document.body) startUI();
    else document.addEventListener('DOMContentLoaded', startUI);
}
