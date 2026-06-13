// Background service worker — this is the only context that can access
// chrome.bookmarks in Manifest V3. The content script relays requests
// from the command palette UI to this worker.

// Flatten the Chrome bookmark tree into a simple array of { title, url }.
function flattenBookmarks(nodes) {
  const results = [];
  for (const node of nodes) {
    if (node.url) {
      results.push({ title: node.title, url: node.url });
    }
    if (node.children) {
      results.push(...flattenBookmarks(node.children));
    }
  }
  return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "butler:get-bookmarks") {
    chrome.bookmarks.getTree((tree) => {
      const bookmarks = flattenBookmarks(tree);
      sendResponse({ bookmarks });
    });
    // Keep the message channel open for the async response
    return true;
  }
});
