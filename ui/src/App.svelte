<script>
    import { onMount, onDestroy } from "svelte";

    let visible = false;
    let query = "";
    let inputEl;
    let resultsEl;
    let allBookmarks = [];
    let selectedIndex = 0;
    let statusMessage = "";

    // Derive the page-specific bookmark command dynamically.
    // When allBookmarks is loaded, we check if the current URL is bookmarked.
    $: existingForCurrentUrl = allBookmarks.filter((b) => b.url === window.location.href);

    $: dynamicCommands =
        existingForCurrentUrl.length > 0
            ? [
                  {
                      kind: "command",
                      id: "remove-bookmark",
                      title: "Remove Bookmark",
                      keywords: "remove delete unbookmark current page",
                      icon: "🗑️",
                      bookmarkIds: existingForCurrentUrl.map((b) => b.id),
                  },
              ]
            : [
                  {
                      kind: "command",
                      id: "bookmark-current",
                      title: "Bookmark Current Page",
                      keywords: "bookmark save add current page",
                      icon: "🔖",
                  },
              ];

    $: matchingCommands = getMatchingCommands(dynamicCommands, query);
    $: filteredBookmarks = getFilteredBookmarks(allBookmarks, query);
    $: allItems = [...matchingCommands, ...filteredBookmarks];

    // Reset selection whenever the results change
    $: if (allItems.length > 0) {
        selectedIndex = 0;
    }

    function getMatchingCommands(cmds, q) {
        if (!q.trim()) return cmds;
        const lower = q.toLowerCase();
        return cmds.filter((c) => c.title.toLowerCase().includes(lower) || c.keywords.toLowerCase().includes(lower));
    }

    function getFilteredBookmarks(bookmarks, q) {
        if (!q.trim()) return [];
        const lower = q.toLowerCase();
        return bookmarks.filter((b) => b.title.toLowerCase().includes(lower) || b.url.toLowerCase().includes(lower));
    }

    function handleGlobalKeydown(e) {
        if (e.altKey && e.code === "KeyK") {
            e.preventDefault();
            toggle();
        }
    }

    onMount(() => {
        document.addEventListener("keydown", handleGlobalKeydown);
    });

    onDestroy(() => {
        document.removeEventListener("keydown", handleGlobalKeydown);
    });

    function toggle() {
        visible = !visible;
        const el = document.getElementById("cb-container");
        if (el) {
            el.style.display = visible ? "block" : "none";
        }
        if (visible) {
            statusMessage = "";
            // Request bookmarks from the content script bridge
            window.postMessage({ type: "butler:get-bookmarks" }, "*");
            requestAnimationFrame(() => {
                if (inputEl) inputEl.focus();
            });
        } else {
            query = "";
            allBookmarks = [];
            statusMessage = "";
        }
    }

    function close() {
        visible = false;
        const el = document.getElementById("cb-container");
        if (el) el.style.display = "none";
        query = "";
        allBookmarks = [];
        statusMessage = "";
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            close();
        }
    }

    // Listen for bookmark data from the content script bridge
    //
    // IMPORTANT: We do NOT check `event.source === window` because when
    // communicating between the page context and the content script's
    // isolated world, they are different WindowProxy objects.
    function handleWindowMessage(event) {
        const { type, bookmarks } = event.data || {};
        if (type === "butler:bookmarks" && bookmarks) {
            allBookmarks = [...bookmarks].sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
        }
        if (type === "butler:bookmark-created") {
            statusMessage = "Bookmark added!";
            setTimeout(close, 800);
        }
        if (type === "butler:bookmark-removed") {
            statusMessage = "Bookmark removed!";
            setTimeout(close, 800);
        }
    }

    onMount(() => {
        window.addEventListener("message", handleWindowMessage);
    });

    onDestroy(() => {
        window.removeEventListener("message", handleWindowMessage);
    });

    function openBookmark(url) {
        window.open(url, "_blank");
    }

    function bookmarkCurrentPage() {
        const url = window.location.href;
        const title = document.title;
        window.postMessage({ type: "butler:create-bookmark", url, title }, "*");
    }

    function removeBookmark(ids) {
        window.postMessage({ type: "butler:remove-bookmark", ids }, "*");
    }

    function executeItem(item) {
        if (item.id === "bookmark-current") {
            bookmarkCurrentPage();
        } else if (item.id === "remove-bookmark") {
            removeBookmark(item.bookmarkIds);
            // Don't close immediately — wait for the success confirmation
        } else {
            // It's a bookmark
            openBookmark(item.url);
            close();
        }
    }

    function handleKeydown(e) {
        if (e.key === "Escape") {
            close();
            return;
        }

        if (allItems.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % allItems.length;
            scrollResultIntoView();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + allItems.length) % allItems.length;
            scrollResultIntoView();
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selected = allItems[selectedIndex];
            if (selected) {
                executeItem(selected);
            }
        }
    }

    function scrollResultIntoView() {
        if (!resultsEl) return;
        const items = resultsEl.querySelectorAll(".result-item");
        const item = items[selectedIndex];
        if (item) {
            item.scrollIntoView({ block: "nearest" });
        }
    }

    function resultMouseEnter(index) {
        selectedIndex = index;
    }

    function resultClick(item) {
        executeItem(item);
    }

    function domainLetter(url) {
        try {
            const u = new URL(url);
            return u.hostname[0].toUpperCase();
        } catch {
            return "∗";
        }
    }

    function isCommand(item) {
        return item.kind === "command";
    }
</script>

<div class="backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="palette">
        <input
            bind:this={inputEl}
            bind:value={query}
            class="input"
            placeholder="Search bookmarks or type a command..."
            on:keydown={handleKeydown}
        />
        <div class="results" bind:this={resultsEl} role="listbox">
            {#if statusMessage}
                <div class="status-bar">{statusMessage}</div>
            {:else if allItems.length > 0}
                {#each allItems as item, i (isCommand(item) ? item.id : item.url)}
                    <div
                        class="result-item"
                        class:selected={i === selectedIndex}
                        class:command={isCommand(item)}
                        role="option"
                        aria-selected={i === selectedIndex}
                        tabindex="-1"
                        on:mouseenter={() => resultMouseEnter(i)}
                        on:mousedown={(e) => {
                            e.preventDefault();
                            resultClick(item);
                        }}
                    >
                        {#if isCommand(item)}
                            <span class="command-icon">{item.icon}</span>
                            <div class="info">
                                <div class="title">{item.title}</div>
                            </div>
                        {:else}
                            <span class="domain-badge">{domainLetter(item.url)}</span>
                            <div class="info">
                                <div class="title">{item.title}</div>
                                <div class="url">{item.url}</div>
                            </div>
                        {/if}
                    </div>
                {/each}
            {:else if query && allBookmarks.length > 0}
                <div class="empty">No bookmarks match "{query}"</div>
            {:else if query}
                <div class="empty">
                    {#if allBookmarks.length === 0}
                        Loading bookmarks...
                    {:else}
                        No bookmarks match "{query}"
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .backdrop {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 12vh;
    }

    .palette {
        width: 580px;
        max-width: 90vw;
        max-height: 400px;
        background: #1a1a1e;
        border: 1px solid #27272a;
        border-radius: 12px;
        box-shadow: 0 16px 70px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .input {
        width: 100%;
        padding: 14px 16px;
        font-size: 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid #27272a;
        color: #e4e4e7;
        outline: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-sizing: border-box;
    }

    .input::placeholder {
        color: #52525b;
    }

    .results {
        padding: 4px;
        flex: 1;
        overflow-y: auto;
        min-height: 48px;
    }

    .status-bar {
        padding: 12px 16px;
        color: #22c55e;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        font-weight: 500;
    }

    .empty {
        padding: 12px 16px;
        color: #71717a;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
    }

    .result-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.1s ease;
    }

    .result-item.selected {
        background: #27272a;
    }

    .result-item:hover {
        background: #27272a;
    }

    .result-item.command .title {
        font-size: 14px;
        font-weight: 500;
    }

    .command-icon {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        line-height: 1;
    }

    .domain-badge {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #3f3f46;
        color: #a1a1aa;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1;
    }

    .info {
        flex: 1;
        min-width: 0;
    }

    .title {
        font-size: 13px;
        color: #e4e4e7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .url {
        font-size: 11px;
        color: #71717a;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 1px;
    }
</style>
