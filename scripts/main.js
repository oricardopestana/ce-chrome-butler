const STORAGE_KEY = "enabled";

let isEnabled = true;

// Check current state and run if enabled
chrome.storage.sync.get(STORAGE_KEY, (data) => {
  isEnabled = data[STORAGE_KEY] !== false;
  if (isEnabled) {
    init();
  }
});

// Listen for toggle changes from the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "butler:toggle") {
    isEnabled = message.enabled;
    if (isEnabled) {
      init();
    } else {
      cleanup();
    }
  }
});

let bookmarkLoadPromise = null;

function init() {
  console.log("[Chrome Butler] enabled");

  // Start pre-loading bookmarks immediately so they're cached
  // before the user first opens the palette.
  if (!bookmarkLoadPromise) {
    bookmarkLoadPromise = loadAllBookmarks();
  }

  const existing = document.getElementById("cb-container");
  if (existing) return;

  // Inject CSS first
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("dist/command-palette.css");
  document.head.appendChild(link);

  // Inject JS bundle
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("dist/command-palette.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

function cleanup() {
  console.log("[Chrome Butler] disabled");

  const container = document.getElementById("cb-container");
  if (container) container.remove();

  const link = document.querySelector('link[href*="command-palette.css"]');
  if (link) link.remove();
}

// ---------------------------------------------------------------------------
// Bookmark bridge – the injected Svelte app runs in the page context and
// cannot directly access chrome.* APIs. We relay bookmark data via
// window.postMessage and chrome.runtime.sendMessage.
//
// Flow:
//   Svelte app (page)  →  window.postMessage  →  content script (this file)
//   content script     →  chrome.runtime.sendMessage  →  background worker
//   background worker  →  chrome.bookmarks.getTree()
//   ...response flows back through the same chain
// ---------------------------------------------------------------------------

let cachedBookmarks = null;

// Load all bookmarks by asking the background service worker.
function loadAllBookmarks() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "butler:get-bookmarks" }, (response) => {
      cachedBookmarks = response.bookmarks;
      resolve(cachedBookmarks);
    });
  });
}

// Listen for requests from the page-context Svelte app.
//
// IMPORTANT: We do NOT check `event.source === window` here, because when
// communicating between the content script's isolated world and the page
// context, `event.source` and `window` are different WindowProxy objects.
// Rely on the "butler:" type prefix for message scoping instead.
window.addEventListener("message", (event) => {
  const { type } = event.data || {};
  if (!type || !type.startsWith("butler:")) return;

  if (type === "butler:get-bookmarks") {
    // If still loading, await the in-flight promise; otherwise use cache.
    const result = cachedBookmarks ? Promise.resolve(cachedBookmarks) : bookmarkLoadPromise || loadAllBookmarks();

    result.then((bookmarks) => {
      window.postMessage({ type: "butler:bookmarks", bookmarks }, "*");
    });
  }
});
