(function () {
  const XHR = XMLHttpRequest.prototype;
  const send = XHR.send;
  // True for the answer that holds everything X shows on the About page of an account.
  const isAboutAnswer = (url) => /\/AboutAccountQuery(\?|$)/.test(url);

  if (window !== window.top) {
    XHR.send = function () {
      this.addEventListener('load', function () {
        const data = readJson(this);
        if (!data) return;
        try {
          findAndSendLocation(data, isAboutAnswer(this.responseURL));
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

  // `fromAbout` is true for X's own About answer. When it holds nothing to show (the account hides it), that is
  // sent as hidden, so it is not mistaken for a lookup X never answered.
  function findAndSendLocation(obj, fromAbout = false) {
    if (!obj || typeof obj !== 'object') return;

    if (obj.about_profile) {
      const location = obj.about_profile.account_based_in;
      const source = obj.about_profile.source;
      const hidden = fromAbout && !location && !source;
      if (location || source || hidden) {
        const handle = obj.core?.screen_name || obj.screen_name;
        window.top.postMessage(
          {
            type: 'X_LOCATION_FOUND',
            handle: handle,
            location: location,
            source: source,
            ...(hidden && { hidden: true }),
          },
          window.location.origin
        );
        return;
      }
    }
    Object.values(obj).forEach((child) => findAndSendLocation(child, fromAbout));
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { readJson, findAndSendLocation, isAboutAnswer };
  }
})();
