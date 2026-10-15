(function () {
  const XHR = XMLHttpRequest.prototype;
  const send = XHR.send;

  if (window !== window.top) {
    XHR.send = function () {
      this.addEventListener('load', function () {
        const data = readJson(this);
        if (!data) return;
        try {
          findAndSendLocation(data);
        } catch (e) {
          console.debug('[X-Ray] Could not read a response:', e);
        }
      });
      return send.apply(this, arguments);
    };
  }

  // Reading the text of a file or other non-text answer throws, so only text answers are looked at.
  function readJson(xhr) {
    if (xhr.responseType !== '' && xhr.responseType !== 'text') return null;
    try {
      const text = xhr.responseText;
      if (!text || (!text.startsWith('{') && !text.startsWith('['))) return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function findAndSendLocation(obj) {
    if (!obj || typeof obj !== 'object') return;

    if (obj.about_profile) {
      const location = obj.about_profile.account_based_in;
      const source = obj.about_profile.source;
      if (location || source) {
        const handle = obj.core?.screen_name || obj.screen_name;
        window.top.postMessage(
          {
            type: 'X_LOCATION_FOUND',
            handle: handle,
            location: location,
            source: source,
          },
          window.location.origin
        );
        return;
      }
    }
    Object.values(obj).forEach((child) => findAndSendLocation(child));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { readJson, findAndSendLocation };
  }
})();
