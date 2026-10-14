# X-Ray for Twitter

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.5-orange.svg)](src/manifest.json)

> **Reveal the user location and device info of any Twitter/X user with a single click based on publically available data**

---

## <img src="screenshots/icons/camera.svg" width="18" height="18" align="baseline"> Screenshots

<div align="center">
  <img src="screenshots/s1.png" alt="X-Ray Extension in Action" width="800">
  <p><em>X-Ray seamlessly integrates into Twitter/X with click-to-reveal location icons</em></p>
  
  <img src="screenshots/s2.png" alt="Location and Device Details" width="800">
  <p><em>Instantly see user location with country flags and device platform information</em></p>
</div>

---

## <img src="screenshots/icons/info.svg" width="18" height="18" align="baseline"> What is X-Ray?

**X-Ray for Twitter** is a powerful Chrome extension that instantly reveals where Twitter/X users are tweeting from and what device they're using. With a simple click, discover:

*   <img src="screenshots/icons/pin.svg" width="16" height="16" align="absmiddle"> **User Location** - See where they're based (from their public profile)
*   <img src="screenshots/icons/apple.svg" width="14" height="14" align="absmiddle"> **Device Platform** - Know if they're on iOS, Android, or Web
*   <img src="screenshots/icons/globe.svg" width="16" height="16" align="absmiddle"> **Country Flags** - Visual representation with country flags
*   **Quick Copy** - One-click copy to clipboard

**100% FREE. Unlimited usage. No subscriptions. No tracking.**

---

## <img src="screenshots/icons/zap.svg" width="18" height="18" align="baseline"> Features

### Click-to-Reveal Design
Unlike other extensions that auto-load everything, X-Ray uses a **smart click-to-reveal** system. This protects your account from Twitter/X's aggressive rate limits while giving you full control over what data you fetch.

**Why click-to-reveal?**
*   **Prevents rate limiting** - Twitter/X has strict API limits. Auto-loading hundreds of profiles would get you blocked
*   **Protects your account** - No unnecessary requests = safer browsing
*   **Faster performance** - Only loads what you actually want to see
*   **Smart caching** - Once loaded, data is cached for instant re-display

### Beautiful Interface
*   Sleek, modern design that blends seamlessly with Twitter/X
*   Smooth animations and hover effects
*   Color-coded platforms (iOS blue, Android green)
*   Glassmorphic styling with rotating borders

### Privacy-First
*   **Zero data collection** - We don't track you or collect anything about you
*   **Saved on your device only** - Locations you looked up are kept in your browser for 90 days (up to 10,000), then forgotten
*   **No external servers** - Everything runs locally
*   **Open source** - Full transparency, audit the code yourself

### Performance Optimized
*   DNS prefetch for faster flag loading
*   Smart caching system
*   Efficient DOM manipulation
*   Minimal resource footprint

---

## <img src="screenshots/icons/cursor.svg" width="18" height="18" align="baseline"> How It Works

1.  **Browse Twitter/X normally** - Extension adds a small location icon <img src="screenshots/icons/pin.svg" width="16" height="16" align="absmiddle"> next to usernames
2.  **Click the location icon** - Instantly loads the user's public location data
3.  **View the info** - See their location with country flag and platform (iOS/Android/Web)
4.  **Copy if needed** - Click the location pill to copy to clipboard

**That's it!** Simple, fast, and effective.

---

## <img src="screenshots/icons/target.svg" width="18" height="18" align="baseline"> Why Click-to-Reveal?

### The Problem with Auto-Loading
Many extensions automatically fetch data for every user you see. This causes:
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> **Rate limit bans** - Twitter/X blocks excessive requests
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> **Account suspension risk** - Automated behavior triggers security flags
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> **Slow performance** - Loading hundreds of profiles kills your browser
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> **Wasted bandwidth** - Fetching data you don't need

### Our Solution
X-Ray's **click-to-reveal** approach means:
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> **You stay safe** - Only fetch what you need, when you need it
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> **No rate limits** - Controlled, manual requests don't trigger Twitter's defenses
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> **Blazing fast** - Instant response with smart caching
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> **Full control** - You decide what to reveal

---

## <img src="screenshots/icons/search.svg" width="18" height="18" align="baseline"> Use Cases

*   <img src="screenshots/icons/search.svg" width="16" height="16" align="absmiddle"> **Researchers** - Analyze geographic distribution of discussions
*   <img src="screenshots/icons/newspaper.svg" width="16" height="16" align="absmiddle"> **Journalists** - Verify user locations for fact-checking
*   <img src="screenshots/icons/chart.svg" width="16" height="16" align="absmiddle"> **Marketers** - Understand audience demographics
*   <img src="screenshots/icons/eye.svg" width="16" height="16" align="absmiddle"> **OSINT** - Open-source intelligence gathering
*   <img src="screenshots/icons/eye.svg" width="16" height="16" align="absmiddle"> **Curious Users** - Learn more about who you interact with
*   <img src="screenshots/icons/network.svg" width="16" height="16" align="absmiddle"> **Network Analysis** - Map connections across regions

---

## <img src="screenshots/icons/shield.svg" width="18" height="18" align="baseline"> Privacy & Security

### What It Does Not Do
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No tracking or analytics
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No data collection
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No external servers
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No cookies
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No user profiling
*   <img src="screenshots/icons/cross.svg" width="14" height="14" align="absmiddle"> No ads

### What It Does
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> Access only publicly available profile information
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> Keep looked-up locations only in your browser, for 90 days
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> Use standard web security practices (XSS prevention, origin validation)
*   <img src="screenshots/icons/check.svg" width="14" height="14" align="absmiddle"> Respect Twitter/X rate limits with click-to-reveal

**Your privacy is our priority.**

---

## <img src="screenshots/icons/download.svg" width="18" height="18" align="baseline"> Installation

### From Chrome Web Store (Recommended)
1.  Visit the [Chrome Web Store](#) (link coming soon)
2.  Click "Add to Chrome"
3.  Confirm permissions
4.  Done! Start using on Twitter/X

### Manual Installation (Developer Mode)
1.  Download or clone this repository
2.  Open Chrome and go to `chrome://extensions/`
3.  Enable "Developer mode" (top right)
4.  Click "Load unpacked"
5.  Select the `src` folder
6.  Extension is now active!

---

## <img src="screenshots/icons/pin.svg" width="18" height="18" align="baseline"> Usage

### Basic Usage
1.  Go to [twitter.com](https://twitter.com) or [x.com](https://x.com)
2.  Look for the location icon <img src="screenshots/icons/pin.svg" width="16" height="16" align="absmiddle"> next to any username (or near the Grok/More buttons)
3.  Click it to reveal location and platform
4.  Click the location pill to copy to clipboard

### Pro Tips
*   **Hover** over the icon to see a "Get Location" tooltip
*   **Hover** over location pills to see detailed info (Based in & Platform)
*   **Saved results** - Locations you looked up appear instantly for 90 days, even after a refresh
*   **Works everywhere** - Timeline, profiles, replies, search results
*   **Rate limit friendly** - Click only what you need

---

## <img src="screenshots/icons/code.svg" width="18" height="18" align="baseline"> Technical Details

### Built With
*   **Manifest V3** - Latest Chrome extension standard
*   **Vanilla JavaScript** - No frameworks, pure performance
*   **CSS3 Animations** - Smooth, GPU-accelerated effects
*   **Modern Web APIs** - Clipboard, MutationObserver, etc.

### Permissions Explained
*   **`declarativeNetRequest`** - Lets the profile's About page load in a hidden frame by removing X's "don't show in a frame" setting for that page only; all of X's other protections stay on
*   **`host_permissions`** - Only works on x.com and twitter.com, no access to other sites

### How It Works Technically
1.  Injects a small script into Twitter/X pages
2.  When you click the location icon, loads the user's public "About" page in a hidden iframe
3.  Extracts location and platform data from the publicly visible profile
4.  Displays it beautifully with country flags and platform icons
5.  Caches the data locally for instant re-display

**No APIs. No servers. Just smart web scraping of public data.**

---

## <img src="screenshots/icons/globe-blue.svg" width="18" height="18" align="baseline"> Supported Countries

X-Ray recognizes **150+ countries** with automatic flag detection:
*   North America
*   Europe
*   Asia
*   South America
*   Africa
*   Oceania

If a country isn't recognized, a globe icon <img src="screenshots/icons/globe.svg" width="16" height="16" align="absmiddle"> is shown instead.

---

## <img src="screenshots/icons/smartphone.svg" width="18" height="18" align="baseline"> Platform Detection

Automatically identifies:
*   <img src="screenshots/icons/apple.svg" width="14" height="14" align="absmiddle"> **iOS** - iPhone, iPad, App Store
*   <img src="screenshots/icons/android.svg" width="16" height="16" align="absmiddle"> **Android** - Android devices, Play Store
*   <img src="screenshots/icons/web.svg" width="16" height="16" align="absmiddle"> **Web** - Desktop and mobile web browsers

---

## <img src="screenshots/icons/alert.svg" width="18" height="18" align="baseline"> Important Notes

### Rate Limits
Twitter/X has strict rate limits. X-Ray's click-to-reveal design protects you, but:
*   Don't spam-click hundreds of profiles rapidly
*   The extension has built-in rate limiting (10 requests/minute max)
*   If you hit Twitter's limits, wait a few minutes

### Data Availability
X-Ray can only show data that users have made public:
*   Not all users have location information in their profile
*   Some users may have restricted their "About" page
*   Data comes from Twitter/X's public profile pages

### Terms of Service
This extension accesses publicly available information. However:
*   Use responsibly and ethically
*   Respect user privacy
*   Be aware of Twitter/X's Terms of Service
*   We are not responsible for how you use this tool

---

## <img src="screenshots/icons/git-branch.svg" width="18" height="18" align="baseline"> Contributing

Contributions are welcome! Feel free to:
*   Report bugs
*   Suggest features
*   Submit pull requests
*   Improve documentation

---

## <img src="screenshots/icons/heart.svg" width="18" height="18" align="baseline"> Acknowledgments

*   Country flags provided by [FlagCDN](https://flagcdn.com)
*   Icons designed with love
*   Built for the Twitter/X community

---

## <img src="screenshots/icons/star.svg" width="18" height="18" align="baseline"> Why X-Ray?

*   **100% Free** - No premium tiers, no paywalls
*   **Unlimited** - Use as much as you want
*   **Private** - Zero tracking, zero data collection
*   **Fast** - Instant results with smart caching
*   **Safe** - Click-to-reveal protects your account
*   **Beautiful** - Gorgeous UI that feels native
*   **Global** - Supports 150+ countries

---

<p align="center">
  <strong>Made for the Twitter/X community</strong><br>
  <sub>Not affiliated with Twitter or X Corp</sub>
</p>
