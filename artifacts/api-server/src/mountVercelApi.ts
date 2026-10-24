import type {
  Express,
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "./lib/logger";

type VercelModule = Record<string, unknown> & {
  GET?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  POST?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  PUT?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  PATCH?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  DELETE?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  OPTIONS?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
  default?: (req: Request, ctx?: unknown) => Promise<Response> | Response;
};

type VercelHandler = (
  req: Request,
  ctx?: unknown,
) => Promise<Response> | Response;

/**
 * Direct /api/*.js entrypoints that exist as standalone Vercel functions
 * (not rewritten through api/router.js).
 */
const DIRECT_ROUTES: Array<[string, string]> = [
  ["/api/create-user", "create-user.js"],
  ["/api/resend-invite", "resend-invite.js"],
  ["/api/register", "register.js"],
  ["/api/users/list", "users/list.js"],
  ["/api/users/anonymise", "users/anonymise.js"],
  ["/api/downloads/analytics", "downloads/analytics.js"],
  ["/api/downloads/export", "downloads/export.js"],
  ["/api/downloads/mine", "downloads/mine.js"],
  // PDF: keep Express routes/pdf.ts as the local implementation (already mounted).
];

/** Areas rewritten to api/router.js on Vercel (see vercel.json). */
const COMBINED_AREAS = [
  "forum",
  "hubs",
  "music-hubs",
  "interactive-lessons",
] as const;

function resolveApiDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // Prefer repo-root /api whether we run from src/ (tsx) or dist/ (bundled).
  const candidates = [
    path.resolve(here, "../../../api"), // dist/index.mjs → repo/api
    path.resolve(here, "../../../../api"), // src/mountVercelApi.ts → repo/api
    path.resolve(process.cwd(), "api"),
    path.resolve(process.cwd(), "../../api"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "router.js"))) return candidate;
  }
  return candidates[0]!;
}

const moduleCache = new Map<string, Promise<VercelModule>>();

function loadVercelModule(relativeFile: string): Promise<VercelModule> {
  const cached = moduleCache.get(relativeFile);
  if (cached) return cached;
  const abs = path.join(resolveApiDir(), relativeFile);
  const href = pathToFileURL(abs).href;
  const pending = import(href) as Promise<VercelModule>;
  moduleCache.set(relativeFile, pending);
  return pending;
}

function handlerFor(mod: VercelModule, method: string): VercelHandler | null {
  const upper = method.toUpperCase();
  const named = mod[upper];
  if (typeof named === "function") return named as VercelHandler;
  if (typeof mod.default === "function") return mod.default;
  return null;
}

async function toWebRequest(
  req: ExpressRequest,
  urlOverride?: string,
): Promise<Request> {
  const host = req.get("host") || "127.0.0.1";
  const proto = req.protocol || "http";
  const url = urlOverride || `${proto}://${host}${req.originalUrl}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }
  const method = (req.method || "GET").toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  let body: string | undefined;
  if (hasBody) {
    if (typeof req.body === "string") {
      body = req.body;
    } else if (req.body !== undefined && req.body !== null) {
      body = JSON.stringify(req.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }
  return new Request(url, { method, headers, body });
}

async function sendWebResponse(webRes: Response, res: ExpressResponse) {
  res.status(webRes.status);
  webRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const buf = Buffer.from(await webRes.arrayBuffer());
  if (buf.length) res.send(buf);
  else res.end();
}

async function runDirectHandler(
  relativeFile: string,
  req: ExpressRequest,
  res: ExpressResponse,
): Promise<void> {
  const mod = await loadVercelModule(relativeFile);
  const handler = handlerFor(mod, req.method);
  if (!handler) {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  const webReq = await toWebRequest(req);
  const webRes = await handler(webReq, {});
  await sendWebResponse(webRes, res);
}

/**
 * Mirror vercel.json rewrites:
 *   /api/forum/:path* → /api/router?__route=forum/:path*
 * so api/router.js rebuilds the original path and dispatches to server/api/**.
 */
async function runCombinedRouter(
  req: ExpressRequest,
  res: ExpressResponse,
): Promise<void> {
  const host = req.get("host") || "127.0.0.1";
  const proto = req.protocol || "http";
  const incoming = new URL(`${proto}://${host}${req.originalUrl}`);
  const pathname = incoming.pathname.replace(/\/+$/, "") || "/";
  const route = pathname.replace(/^\/api\//, "");
  if (!route || route.includes("..")) {
    res.status(404).json({ error: "API route not found." });
    return;
  }

  const routerUrl = new URL(`${proto}://${host}/api/router`);
  routerUrl.searchParams.set("__route", route);
  // Preserve original query string (aside from any accidental __route).
  incoming.searchParams.forEach((value, key) => {
    if (key === "__route") return;
    routerUrl.searchParams.append(key, value);
  });

  const mod = await loadVercelModule("router.js");
  const handler = handlerFor(mod, req.method);
  if (!handler) {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  const webReq = await toWebRequest(req, routerUrl.toString());
  const webRes = await handler(webReq, {});
  await sendWebResponse(webRes, res);
}

function isCombinedApiPath(pathname: string): boolean {
  const cleaned = pathname.replace(/\/+$/, "") || "/";
  for (const area of COMBINED_AREAS) {
    if (cleaned === `/api/${area}` || cleaned.startsWith(`/api/${area}/`)) {
      return true;
    }
  }
  return false;
}

/**
 * Serve Vercel Web-API handlers from the local Express server so local Vite
 * (`/api` → :8080) behaves like production rewrites in vercel.json.
 *
 * - Combined areas (forum, hubs, music-hubs, interactive-lessons) go through
 *   api/router.js exactly as on Vercel (including dynamic [topicId]/[postId]).
 *   Flesh-out AI: GET/POST /api/interactive-lessons/flesh-out (needs OPENAI_API_KEY
 *   in the api-server env; Vite proxies /api → :8080 via VITE_API_PROXY_TARGET).
 * - Standalone /api entrypoints (users, downloads, register, PDF) are mounted
 *   by file.
 * - Dynamic resource downloads: /api/resources/:resourceId/download
 */
export function mountVercelUserApi(app: Express): void {
  // Combined router catch-all — must run before Express 404s these paths.
  app.use(async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    if (!isCombinedApiPath(req.path)) {
      next();
      return;
    }
    try {
      await runCombinedRouter(req, res);
    } catch (err) {
      logger.error({ err, path: req.path }, "Vercel combined API adapter error");
      next(err);
    }
  });

  for (const [route, file] of DIRECT_ROUTES) {
    app.all(route, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      try {
        await runDirectHandler(file, req, res);
      } catch (err) {
        logger.error({ err, route }, "Vercel direct API adapter error");
        next(err);
      }
    });
  }

  // Dynamic segment: api/resources/[resourceId]/download.js
  app.all(
    "/api/resources/:resourceId/download",
    async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      try {
        await runDirectHandler(
          "resources/[resourceId]/download.js",
          req,
          res,
        );
      } catch (err) {
        logger.error({ err, path: req.path }, "Vercel resource download adapter error");
        next(err);
      }
    },
  );
}

/** @deprecated Use mountVercelUserApi — kept as an alias for existing imports. */
export const mountVercelApi = mountVercelUserApi;
