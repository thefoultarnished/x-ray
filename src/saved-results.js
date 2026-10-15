// Same prefix content.js puts in front of each saved result's storage key.
const SAVED_PREFIX = 'loc:';

async function savedKeys(store) {
  const everything = await store.get(null);
  return Object.keys(everything).filter((key) => key.startsWith(SAVED_PREFIX));
}

async function countSavedResults(store) {
  return (await savedKeys(store)).length;
}

// Removes only the saved locations; every other stored value is left alone.
async function clearSavedResults(store) {
  const keys = await savedKeys(store);
  if (keys.length) await store.remove(keys);
  return keys.length;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAVED_PREFIX, countSavedResults, clearSavedResults };
}
