const STORAGE_KEY = "enabled";
const TOGGLE_ID = "toggle";
const STATUS_ID = "status";

const toggle = document.getElementById(TOGGLE_ID);
const statusEl = document.getElementById(STATUS_ID);

// Load the current state from storage and update the UI
chrome.storage.sync.get(STORAGE_KEY, (data) => {
  const enabled = data[STORAGE_KEY] !== false; // default to true
  toggle.checked = enabled;
  updateStatus(enabled);
});

// When the user flips the toggle, save the new state and notify content scripts
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ [STORAGE_KEY]: enabled }, () => {
    updateStatus(enabled);
    // Notify all active tabs so content scripts can react immediately
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: "butler:toggle", enabled }).catch(() => {
          // Ignore errors for tabs that don't have the content script
        });
      }
    });
  });
});

function updateStatus(enabled) {
  statusEl.textContent = enabled ? "active" : "disabled";
}
