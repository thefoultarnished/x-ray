(function () {
  const XHR = XMLHttpRequest.prototype;
  const open = XHR.open;
  const send = XHR.send;

  if (window !== window.top) {
    XHR.open = function (method, url) {
      this._url = url;
      return open.apply(this, arguments);
    };

    XHR.send = function () {
      this.addEventListener('load', function () {
        if (this.responseText && (this.responseText.startsWith('{') || this.responseText.startsWith('['))) {
          try {
            const data = JSON.parse(this.responseText);
            findAndSendLocation(data);
          } catch (e) {}
        }
      });
      return send.apply(this, arguments);
    };
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
})();
