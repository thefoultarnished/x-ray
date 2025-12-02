# 🔍 X-Ray for Twitter

> **Reveal the hidden location and device info of any Twitter/X user with a single click**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0-orange.svg)](manifest.json)

---

## 🌟 What is X-Ray?

**X-Ray for Twitter** is a powerful Chrome extension that instantly reveals where Twitter/X users are tweeting from and what device they're using. With a simple click, discover:

- 🌍 **User Location** - See where they're based (from their public profile)
- 📱 **Device Platform** - Know if they're on iOS, Android, or Web
- 🗺️ **Country Flags** - Visual representation with country flags
- 📋 **Quick Copy** - One-click copy to clipboard

**100% FREE. Unlimited usage. No subscriptions. No tracking.**

---

## ✨ Features

### 🎯 **Click-to-Reveal Design**
Unlike other extensions that auto-load everything, X-Ray uses a **smart click-to-reveal** system. This protects your account from Twitter/X's aggressive rate limits while giving you full control over what data you fetch.

**Why click-to-reveal?**
- ⚡ **Prevents rate limiting** - Twitter/X has strict API limits. Auto-loading hundreds of profiles would get you blocked
- 🔒 **Protects your account** - No unnecessary requests = safer browsing
- 🚀 **Faster performance** - Only loads what you actually want to see
- 💾 **Smart caching** - Once loaded, data is cached for instant re-display

### 🎨 **Beautiful Interface**
- Sleek, modern design that blends seamlessly with Twitter/X
- Smooth animations and hover effects
- Color-coded platforms (iOS blue, Android green)
- Glassmorphic styling with rotating borders

### 🔒 **Privacy-First**
- **Zero data collection** - We don't track, store, or transmit anything
- **Local storage only** - All data stays in your browser session
- **No external servers** - Everything runs locally
- **Open source** - Full transparency, audit the code yourself

### ⚡ **Performance Optimized**
- DNS prefetch for faster flag loading
- Smart caching system
- Efficient DOM manipulation
- Minimal resource footprint

---

## 🚀 How It Works

1. **Browse Twitter/X normally** - Extension adds a small pin icon 📍 next to usernames
2. **Click the pin** - Instantly loads the user's public location data
3. **View the info** - See their location with country flag and platform (iOS/Android/Web)
4. **Copy if needed** - Click the location pill to copy to clipboard

**That's it!** Simple, fast, and effective.

---

## 🎯 Why Click-to-Reveal?

### The Problem with Auto-Loading
Many extensions automatically fetch data for every user you see. This causes:
- ❌ **Rate limit bans** - Twitter/X blocks excessive requests
- ❌ **Account suspension risk** - Automated behavior triggers security flags
- ❌ **Slow performance** - Loading hundreds of profiles kills your browser
- ❌ **Wasted bandwidth** - Fetching data you don't need

### Our Solution
X-Ray's **click-to-reveal** approach means:
- ✅ **You stay safe** - Only fetch what you need, when you need it
- ✅ **No rate limits** - Controlled, manual requests don't trigger Twitter's defenses
- ✅ **Blazing fast** - Instant response with smart caching
- ✅ **Full control** - You decide what to reveal

---

## 💡 Use Cases

- **🔍 Researchers** - Analyze geographic distribution of discussions
- **📰 Journalists** - Verify user locations for fact-checking
- **📊 Marketers** - Understand audience demographics
- **🕵️ OSINT** - Open-source intelligence gathering
- **🤔 Curious Users** - Learn more about who you interact with
- **🌐 Network Analysis** - Map connections across regions

---

## 🛡️ Privacy & Security

### What We DON'T Do
- ❌ No tracking or analytics
- ❌ No data collection
- ❌ No external servers
- ❌ No cookies
- ❌ No user profiling
- ❌ No ads

### What We DO
- ✅ Access only publicly available profile information
- ✅ Store data locally in your browser session only
- ✅ Clear cache when you close your browser
- ✅ Use standard web security practices (XSS prevention, origin validation)
- ✅ Respect Twitter/X rate limits with click-to-reveal

**Your privacy is our priority.**

---

## 📦 Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](#) (link coming soon)
2. Click "Add to Chrome"
3. Confirm permissions
4. Done! Start using on Twitter/X

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder
6. Extension is now active!

---

## 🎮 Usage

### Basic Usage
1. Go to [twitter.com](https://twitter.com) or [x.com](https://x.com)
2. Look for the 📍 pin icon next to any username
3. Click it to reveal location and platform
4. Click the location pill to copy to clipboard

### Pro Tips
- **Hover** over location pills to see detailed info
- **Session cache** - Once loaded, locations appear instantly on refresh
- **Works everywhere** - Timeline, profiles, replies, search results
- **Rate limit friendly** - Click only what you need

---

## 🔧 Technical Details

### Built With
- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No frameworks, pure performance
- **CSS3 Animations** - Smooth, GPU-accelerated effects
- **Modern Web APIs** - Clipboard, MutationObserver, etc.

### Permissions Explained
- **`declarativeNetRequest`** - Required to access profile data by temporarily removing frame-blocking headers
- **`host_permissions`** - Only works on x.com and twitter.com, no access to other sites

### How It Works Technically
1. Injects a small script into Twitter/X pages
2. When you click the pin, loads the user's public "About" page in a hidden iframe
3. Extracts location and platform data from the publicly visible profile
4. Displays it beautifully with country flags and platform icons
5. Caches the data locally for instant re-display

**No APIs. No servers. Just smart web scraping of public data.**

---

## 🌍 Supported Countries

X-Ray recognizes **150+ countries** with automatic flag detection:
- 🇺🇸 North America
- 🇬🇧 Europe
- 🇯🇵 Asia
- 🇧🇷 South America
- 🇿🇦 Africa
- 🇦🇺 Oceania

If a country isn't recognized, a globe icon 🌐 is shown instead.

---

## 📱 Platform Detection

Automatically identifies:
- 🍎 **iOS** - iPhone, iPad, App Store
- 🤖 **Android** - Android devices, Play Store
- 🌐 **Web** - Desktop and mobile web browsers

---

## ⚠️ Important Notes

### Rate Limits
Twitter/X has strict rate limits. X-Ray's click-to-reveal design protects you, but:
- Don't spam-click hundreds of profiles rapidly
- The extension has built-in rate limiting (10 requests/minute max)
- If you hit Twitter's limits, wait a few minutes

### Data Availability
X-Ray can only show data that users have made public:
- Not all users have location information in their profile
- Some users may have restricted their "About" page
- Data comes from Twitter/X's public profile pages

### Terms of Service
This extension accesses publicly available information. However:
- Use responsibly and ethically
- Respect user privacy
- Be aware of Twitter/X's Terms of Service
- We are not responsible for how you use this tool

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Improve documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Country flags provided by [FlagCDN](https://flagcdn.com)
- Icons designed with love
- Built for the Twitter/X community

---

## 📞 Support

- **Issues**: [GitHub Issues](#)
- **Privacy Policy**: [View Policy](https://gist.githubusercontent.com/prabhat35/5470392bffdf908da90ce24af93ab115/raw/dc6f47baea12e6eeb9ea82362feb960a710fc33f/privacy-policy.md)

---

## 🎉 Why X-Ray?

✨ **100% Free** - No premium tiers, no paywalls  
🚀 **Unlimited** - Use as much as you want  
🔒 **Private** - Zero tracking, zero data collection  
⚡ **Fast** - Instant results with smart caching  
🛡️ **Safe** - Click-to-reveal protects your account  
🎨 **Beautiful** - Gorgeous UI that feels native  
🌍 **Global** - Supports 150+ countries  

**Download now and start revealing the world behind the tweets!**

---

<p align="center">
  <strong>Made with ❤️ for the Twitter/X community</strong><br>
  <sub>Not affiliated with Twitter or X Corp</sub>
</p>