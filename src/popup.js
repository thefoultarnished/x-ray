const LINKS = {
  feedbackLink: 'https://github.com/thefoultarnished/x-ray/issues',
  openX: 'https://x.com/',
  // Bundled page, opened in a tab so the click doesn't navigate the popup itself.
  appVersion: chrome.runtime.getURL('changelogs.html'),
};

for (const [id, url] of Object.entries(LINKS)) {
  document.getElementById(id).addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await chrome.tabs.create({ url });
      window.close();
    } catch (err) {
      console.warn('[X-Ray] Could not open tab:', err);
    }
  });
}

document.getElementById('appVersion').textContent = `v${chrome.runtime.getManifest().version}`;
