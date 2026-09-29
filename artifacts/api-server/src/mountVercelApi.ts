import type {
  Express,
  NextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "./lib/logger";

type VercelModule = Record<string, unknown> & {
  GET?: (req: Request) => Promise<Response> | Response;
  POST?: (req: Request) => Promise<Response> | Response;
  PUT?: (req: Request) => Promise<Response> | Response;
  PATCH?: (req: Request) => Promise<Response> | Response;
  DELETE?: (req: Request) => Promise<Response> | Response;
  OPTIONS?: (req: Request) => Promise<Response> | Response;
  default?: (req: Request) => Promise<Response> | Response;
};

type VercelHandler = (req: Request) => Promise<Response> | Response;

const ROUTES: Array<[string, string]> = [
  ["/api/create-user", "create-user.js"],
  ["/api/resend-invite", "resend-invite.js"],
  ["/api/users/list", "users/list.js"],
  ["/api/users/anonymise", "users/anonymise.js"],
];

function resolveApiDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../api");
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

async function toWebRequest(req: ExpressRequest): Promise<Request> {
  const host = req.get("host") || "127.0.0.1";
  const proto = req.protocol || "http";
  const url = `${proto}://${host}${req.originalUrl}`;
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

/**
 * Serve the Vercel Web-API user-management handlers from the local Express server
 * so Settings → Users works without a separate Vercel deployment.
 */
export function mountVercelUserApi(app: Express): void {
  for (const [route, file] of ROUTES) {
    app.all(route, async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
      try {
        const mod = await loadVercelModule(file);
        const handler = handlerFor(mod, req.method);
        if (!handler) {
          res.status(405).json({ error: "Method not allowed." });
          return;
        }
        const webReq = await toWebRequest(req);
        const webRes = await handler(webReq);
        await sendWebResponse(webRes, res);
      } catch (err) {
        logger.error({ err, route }, "Vercel user API adapter error");
        next(err);
      }
    });
  }
}
