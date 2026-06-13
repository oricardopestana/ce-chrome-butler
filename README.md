# Chrome Butler

A Chrome extension that brings Raycast-style command-palette features directly into the browser. Press **Alt+K** on any page to open a fuzzy-searchable command palette for bookmarks.

## Features

- **Alt+K** — open the command palette from any page
- **Fuzzy bookmark search** — multi-factor scoring (substring, word-by-word, fuzzy character sequence, acronym/initials)
- **Bookmark current page** directly from the palette
- **Remove bookmarks** for the current page
- **Open bookmarks** in a new tab
- **Toggle on/off** from the toolbar popup (persisted across devices via `chrome.storage.sync`)

## Architecture

```
┌──────────────────────────────────────┐
│  PAGE CONTEXT (Svelte App)           │
│  Injected into page, renders palette │
│  Communicates via window.postMessage  │
└──────────────┬───────────────────────┘
               │ postMessage("butler:*")
┌──────────────▼───────────────────────┐
│  CONTENT SCRIPT (isolated world)     │
│  Relays messages, caches bookmarks   │
│  Injects CSS & JS into the page      │
└──────────────┬───────────────────────┘
               │ chrome.runtime.sendMessage
┌──────────────▼───────────────────────┐
│  BACKGROUND SERVICE WORKER           │
│  Only context with chrome.bookmarks  │
│  Handles CRUD, flattens bookmark tree│
└──────────────────────────────────────┘
```

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Build

```bash
cd ui
pnpm install
pnpm run build
```

The build produces `dist/command-palette.js` and `dist/command-palette.css`.

### Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project root directory

## Usage

1. Click the extension icon in the toolbar to enable/disable it
2. On any page, press **Alt+K** to open the command palette
3. Start typing to fuzzy-search your bookmarks
4. Press **Enter** to open a bookmark, or **Escape** to close

## Built with

- [Svelte](https://svelte.dev) 4 — command palette UI
- [esbuild](https://esbuild.github.io) — bundler
- [esbuild-svelte](https://github.com/emilhein/esbuild-svelte) — Svelte compiler plugin

## License

MIT
