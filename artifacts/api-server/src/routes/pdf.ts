import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const PDFBOLT_API_URL = "https://api.pdfbolt.com/v1/direct";

/**
 * Maximum allowed size (bytes) for the base64-encoded HTML field.
 * PDFBolt itself imposes limits, but we cap early to reduce proxy abuse risk.
 * 40 MB base64 ≈ ~30 MB raw HTML, more than enough for any realistic export.
 */
const MAX_HTML_BYTES = 40 * 1024 * 1024;

/**
 * POST /api/pdf/generate
 *
 * Server-side proxy for PDFBolt. The PDFBOLT_API_KEY never leaves the server.
 *
 * Auth assumptions:
 * - Supabase must be configured with HS256 JWT signing (the default for all
 *   Supabase projects). RS256/ES256 projects would need a public-key variant.
 *   Set SUPABASE_JWT_SECRET to the value from the Supabase dashboard
 *   (Settings → API → JWT Settings → JWT Secret).
 *
 * Fail-closed: both PDFBOLT_API_KEY and SUPABASE_JWT_SECRET must be present.
 * When either is missing the endpoint returns 503 rather than becoming an open
 * proxy. Every request must supply a valid Supabase access token in the
 * Authorization: Bearer header; missing, expired, or invalid tokens → 401.
 */
router.post("/pdf/generate", async (req, res) => {
  const apiKey = process.env["PDFBOLT_API_KEY"];
  if (!apiKey) {
    res
      .status(503)
      .json({ error: "PDF generation is not configured on this server." });
    return;
  }

  const jwtSecret = process.env["SUPABASE_JWT_SECRET"];
  if (!jwtSecret) {
    res
      .status(503)
      .json({ error: "PDF generation auth is not configured on this server." });
    return;
  }

  const authHeader = req.headers["authorization"] ?? "";
  const token =
    typeof authHeader === "string"
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : "";

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Basic payload validation: reject obviously malformed or oversized requests
  // before forwarding them to PDFBolt.
  const body = req.body as Record<string, unknown>;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    res.status(400).json({ error: "Invalid request payload." });
    return;
  }

  const allowedFields = new Set([
    "html",
    "printBackground",
    "waitUntil",
    "format",
    "margin",
    "displayHeaderFooter",
    "footerTemplate",
    "headerTemplate",
    "emulateMediaType",
    "landscape",
    "scale",
    "pageRanges",
    "width",
    "height",
  ]);

  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) {
      res.status(400).json({ error: `Unexpected field: ${key}` });
      return;
    }
  }

  const html = body["html"];
  if (typeof html !== "string" || html.length === 0) {
    res.status(400).json({ error: "Missing or empty 'html' field." });
    return;
  }
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    res.status(413).json({ error: "HTML payload exceeds maximum allowed size." });
    return;
  }

  try {
    const upstream = await fetch(PDFBOLT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API_KEY": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res
        .status(upstream.status)
        .json({ error: `PDFBolt error: ${errorText}` });
      return;
    }

    const pdfBuffer = await upstream.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.byteLength);
    res.send(Buffer.from(pdfBuffer));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PDF generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
