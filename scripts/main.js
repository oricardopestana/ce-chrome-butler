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

function init() {
  console.log("[Chrome Butler] enabled");

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
