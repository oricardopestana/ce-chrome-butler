<script>
    import { onMount, onDestroy } from "svelte";

    let visible = false;
    let query = "";
    let inputEl;

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
            requestAnimationFrame(() => {
                if (inputEl) inputEl.focus();
            });
        } else {
            query = "";
        }
    }

    function close() {
        visible = false;
        const el = document.getElementById("cb-container");
        if (el) el.style.display = "none";
        query = "";
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            close();
        }
    }
</script>

<div class="backdrop" on:click={handleBackdropClick} role="presentation">
    <div class="palette">
        <input
            bind:this={inputEl}
            bind:value={query}
            class="input"
            placeholder="Type a command..."
            on:keydown={(e) => {
                if (e.key === "Escape") close();
            }}
        />
        <div class="results">
            {#if query}
                <div class="empty">No results for "{query}"</div>
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
        align-items: center;
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
        padding: 8px;
        flex: 1;
        overflow-y: auto;
        min-height: 48px;
    }

    .empty {
        padding: 12px 16px;
        color: #71717a;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
    }
</style>
