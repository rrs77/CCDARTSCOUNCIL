import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const router: IRouter = Router();

const PDFBOLT_API_URL = "https://api.pdfbolt.com/v1/direct";

/**
 * Maximum allowed size (bytes) for the base64-encoded HTML field.
 * PDFBolt itself imposes limits, but we cap early to reduce proxy abuse risk.
 * 40 MB base64 ≈ ~30 MB raw HTML, more than enough for any realistic export.
 */
const MAX_HTML_BYTES = 40 * 1024 * 1024;

const DEFAULT_SUPABASE_URL = "https://wiudrzdkbpyziaodqoog.supabase.co";

function isLocalDev(): boolean {
  return (
    process.env["NODE_ENV"] === "development" ||
    process.env["PDF_LOCAL_DEV"] === "1"
  );
}

function requirePdfBoltKey(res: import("express").Response): string | null {
  const apiKey = process.env["PDFBOLT_API_KEY"];
  if (!apiKey) {
    res.status(503).json({
      error:
        "PDF generation is not configured on this server. Set PDFBOLT_API_KEY.",
    });
    return null;
  }
  return apiKey;
}

function enforcePdfAuth(
  req: import("express").Request,
  res: import("express").Response,
): boolean {
  const jwtSecret = process.env["SUPABASE_JWT_SECRET"];

  if (!jwtSecret && !isLocalDev()) {
    res
      .status(503)
      .json({ error: "PDF generation auth is not configured on this server." });
    return false;
  }

  const authHeader = req.headers["authorization"] ?? "";
  const token =
    typeof authHeader === "string"
      ? authHeader.replace(/^Bearer\s+/i, "").trim()
      : "";

  if (jwtSecret) {
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
    try {
      jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    } catch {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
  }

  return true;
}

async function generatePdfBuffer(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Buffer> {
  const upstream = await fetch(PDFBOLT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      API_KEY: apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    throw new Error(`PDFBolt error: ${upstream.status} ${errorText}`);
  }

  return Buffer.from(await upstream.arrayBuffer());
}

/**
 * POST /api/pdf/generate
 *
 * Server-side proxy for PDFBolt. The PDFBOLT_API_KEY never leaves the server.
 *
 * Fail-closed in production: both PDFBOLT_API_KEY and SUPABASE_JWT_SECRET must
 * be present. Locally (NODE_ENV=development or PDF_LOCAL_DEV=1), JWT verification
 * is skipped when SUPABASE_JWT_SECRET is unset so PDF export works with only
 * PDFBOLT_API_KEY.
 */
router.post("/pdf/generate", async (req, res) => {
  const apiKey = requirePdfBoltKey(res);
  if (!apiKey) return;
  if (!enforcePdfAuth(req, res)) return;

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
    const pdfBuffer = await generatePdfBuffer(apiKey, body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.byteLength);
    res.send(pdfBuffer);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PDF generation failed";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/generate-pdf
 *
 * Generate a PDF with PDFBolt, upload to Supabase Storage (lesson-pdfs),
 * and return a public URL for Copy Link / share flows.
 *
 * Body: { html, footerTemplate?, headerTemplate?, fileName?, lessonNumber? }
 * Env: PDFBOLT_API_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *      SUPABASE_URL or VITE_SUPABASE_URL
 */
router.post("/generate-pdf", async (req, res) => {
  const apiKey = requirePdfBoltKey(res);
  if (!apiKey) return;
  if (!enforcePdfAuth(req, res)) return;

  const body = req.body as Record<string, unknown>;
  const encodedHtml = body["html"];
  if (typeof encodedHtml !== "string" || encodedHtml.length === 0) {
    res.status(400).json({ error: "Missing html content" });
    return;
  }
  if (Buffer.byteLength(encodedHtml, "utf8") > MAX_HTML_BYTES) {
    res.status(413).json({ error: "HTML payload exceeds maximum allowed size." });
    return;
  }

  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!serviceRoleKey) {
    res.status(503).json({
      error:
        "Copy link requires SUPABASE_SERVICE_ROLE_KEY so the server can upload the PDF. Add it to .env (Supabase → Settings → API → service_role).",
    });
    return;
  }

  const supabaseUrl =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    DEFAULT_SUPABASE_URL;

  const footerTemplate =
    typeof body["footerTemplate"] === "string" ? body["footerTemplate"] : "";
  const headerTemplate =
    typeof body["headerTemplate"] === "string" ? body["headerTemplate"] : "";
  const fileNameRaw =
    typeof body["fileName"] === "string" && body["fileName"]
      ? body["fileName"]
      : `shared-pdfs/${Date.now()}_lesson.pdf`;
  const storagePath = fileNameRaw.startsWith("shared-pdfs/")
    ? fileNameRaw
    : `shared-pdfs/${fileNameRaw}`;

  try {
    const pdfBuffer = await generatePdfBuffer(apiKey, {
      html: encodedHtml,
      printBackground: true,
      waitUntil: "networkidle",
      format: "A4",
      margin: { top: "15px", right: "20px", left: "20px", bottom: "55px" },
      displayHeaderFooter: true,
      footerTemplate,
      headerTemplate,
      emulateMediaType: "screen",
    });

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: uploadError } = await supabase.storage
      .from("lesson-pdfs")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      return;
    }

    const { data: urlData } = supabase.storage
      .from("lesson-pdfs")
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      res.status(500).json({ error: "No public URL returned after upload." });
      return;
    }

    res.json({ success: true, url: urlData.publicUrl, path: storagePath });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PDF generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
