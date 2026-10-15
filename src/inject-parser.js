// Runs in every frame on X. The rest of the extension runs only on the top page.
// Only frames need parser.js; the hidden lookup frame is where X's answer is read.
function addParser() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('parser.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

if (window !== window.top) {
  if (document.documentElement) {
    addParser();
  } else {
    // A frame can run this before it has any page at all; wait for the first element.
    new MutationObserver((mutations, observer) => {
      if (!document.documentElement) return;
      observer.disconnect();
      addParser();
    }).observe(document, { childList: true });
  }
}
