import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const isReplit = process.env.REPL_ID !== undefined;
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || "/";

/** Nested built apps in public/ — Vite's SPA fallback otherwise serves CCD HTML for their .js/.css. */
const BAKED_APPS = ["the-facts", "ccd-pitch"] as const;

function mimeFor(file: string): string {
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".pdf")) return "application/pdf";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (file.endsWith(".woff2")) return "font/woff2";
  if (file.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

function serveBakedApps(publicDir: string): Plugin {
  return {
    name: "serve-baked-apps",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = (req.url || "").split("?")[0];
        const app = BAKED_APPS.find((name) => raw === `/${name}` || raw.startsWith(`/${name}/`));
        if (!app) return next();

        const decoded = decodeURIComponent(raw);
        let file = path.resolve(publicDir, decoded.slice(1));
        const appRoot = path.resolve(publicDir, app);
        if (file !== appRoot && !file.startsWith(appRoot + path.sep)) return next();

        try {
          if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
            file = path.join(file, "index.html");
          }
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
        } catch {
          return next();
        }

        res.setHeader("Content-Type", mimeFor(file));
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    serveBakedApps(path.resolve(import.meta.dirname, "public")),
    react(),
    ...(isReplit
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          ...(process.env.NODE_ENV !== "production"
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer({
                    root: path.resolve(import.meta.dirname, ".."),
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
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // Local PDF export (PDFBolt) and other /api routes live on the Express api-server.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
