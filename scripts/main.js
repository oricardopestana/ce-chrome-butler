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

let handleKeydown = null;

function init() {
  // Run Butler features on this page
  console.log("[Chrome Butler] enabled");

  if (handleKeydown) return; // already listening

  handleKeydown = (event) => {
    // Alt+K (Windows/Linux) and Option+K (macOS)
    if (event.altKey && event.code === "KeyK") {
      event.preventDefault();
      console.log("[Chrome Butler] Alt+K pressed");
      // Future: command palette or action runner
    }
  };

  document.addEventListener("keydown", handleKeydown);
}

function cleanup() {
  // Undo any DOM changes when disabled
  console.log("[Chrome Butler] disabled");

  if (handleKeydown) {
    document.removeEventListener("keydown", handleKeydown);
    handleKeydown = null;
  }
}
