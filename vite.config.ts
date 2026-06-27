import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync, renameSync, rmSync, readFileSync, writeFileSync } from "fs";

// Custom plugin: copy manifest.json + fix HTML path + copy icons
function chromeExtensionPlugin() {
  return {
    name: "chrome-extension-plugin",
    closeBundle() {
      if (!existsSync("dist")) mkdirSync("dist");

      // Move popup HTML from dist/src/popup/index.html → dist/popup.html
      const popupSrc = resolve("dist", "src/popup/index.html");
      const popupDest = resolve("dist", "popup.html");
      if (existsSync(popupSrc)) {
        renameSync(popupSrc, popupDest);
      }

      // Fix relative asset paths in dist/popup.html
      if (existsSync(popupDest)) {
        let html = readFileSync(popupDest, "utf-8");
        html = html.replace(/src="\.\.\/[^"]*\/popup\.js"/g, 'src="./popup.js"');
        html = html.replace(/href="\.\.\/[^"]*\/assets\//g, 'href="./assets/');
        writeFileSync(popupDest, html, "utf-8");
      }

      // Clean up empty src/ directory
      const srcDir = resolve("dist", "src");
      if (existsSync(srcDir)) {
        try { rmSync(srcDir, { recursive: true }); } catch (_) { /* ok */ }
      }

      // Copy manifest
      copyFileSync("public/manifest.json", "dist/manifest.json");

      // Copy icons
      const iconDir = "public/icons";
      const distIconDir = "dist/icons";
      if (existsSync(iconDir)) {
        if (!existsSync(distIconDir)) mkdirSync(distIconDir);
        const icons = ["icon16.png", "icon32.png", "icon48.png", "icon128.png"];
        icons.forEach((icon) => {
          const src = resolve(iconDir, icon);
          const dest = resolve(distIconDir, icon);
          if (existsSync(src)) copyFileSync(src, dest);
        });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/index.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
