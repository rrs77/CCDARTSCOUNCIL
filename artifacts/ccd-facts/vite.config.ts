import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const isReplit = process.env.REPL_ID !== undefined;
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";
const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Copy CONTENT.md into the built public folder (and keep it editable in the repo). */
function copyContentMd(): Plugin {
  const src = path.join(rootDir, "CONTENT.md");
  const readme = path.join(rootDir, "CONTENT.README.md");
  const copyTo = (dir: string) => {
    fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dir, "CONTENT.md"));
    if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(dir, "CONTENT.README.md"));
  };
  return {
    name: "copy-content-md",
    buildStart() {
      this.addWatchFile(src);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/CONTENT.md" || req.url?.endsWith("/CONTENT.md")) {
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          fs.createReadStream(src).pipe(res);
          return;
        }
        if (req.url === "/CONTENT.README.md" || req.url?.endsWith("/CONTENT.README.md")) {
          res.setHeader("Content-Type", "text/markdown; charset=utf-8");
          fs.createReadStream(readme).pipe(res);
          return;
        }
        next();
      });
    },
    closeBundle() {
      copyTo(path.join(rootDir, "dist/public"));
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    copyContentMd(),
    ...(isReplit
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          ...(process.env.NODE_ENV !== "production"
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer({
                    root: rootDir,
                  }),
                ),
                await import("@replit/vite-plugin-dev-banner").then((m) =>
                  m.devBanner(),
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  root: rootDir,
  build: {
    outDir: path.resolve(rootDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      allow: [rootDir],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
