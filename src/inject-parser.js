// Runs in every frame on X. The rest of the extension runs only on the top page.
// Only frames need parser.js; the hidden lookup frame is where X's answer is read.
if (window !== window.top) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('parser.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}
