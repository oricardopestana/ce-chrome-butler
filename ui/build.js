import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";

const config = {
  entryPoints: ["src/main.js"],
  bundle: true,
  outfile: "../dist/command-palette.js",
  plugins: [sveltePlugin()],
  format: "iife",
  globalName: "ChromeButlerUI",
  logLevel: "info",
};

await esbuild.build(config);
