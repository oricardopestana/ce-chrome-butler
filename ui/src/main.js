import App from "./App.svelte";

const container = document.createElement("div");
container.id = "cb-container";

// Fixed overlay that covers the viewport — inline styles avoid page CSS interference
Object.assign(container.style, {
  position: "fixed",
  inset: "0",
  zIndex: "2147483647",
  display: "none",
});

document.body.appendChild(container);

new App({
  target: container,
});
