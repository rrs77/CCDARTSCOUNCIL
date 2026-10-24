<?php
/**
 * DreamHost PDF upload (server-to-server only).
 *
 * Deploy to DreamHost and point DREAMHOST_PDF_UPLOAD_URL at this script.
 * CCDesigner Vercel routes call this with X-API-Key — never from the browser.
 *
 * Stores files under UPLOAD_DIR/<userId>/<uuid>.pdf (no overwrite).
 * Do not expose UPLOAD_DIR as a public directory listing; the app serves
 * files only via /api/files/... after auth.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Upsert');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// --- Configure on DreamHost ---
define('UPLOAD_DIR', __DIR__ . '/../pdfs/');
define('PUBLIC_URL_BASE', 'https://YOUR-DOMAIN.com/pdfs/'); // used only for server-side fetch URL
define('API_KEY', 'YOUR-SECRET-API-KEY-HERE'); // set DREAMHOST_PDF_API_KEY to the same value in Vercel
define('MAX_FILE_SIZE', 10 * 1024 * 1024);

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';

if (!hash_equals(API_KEY, (string) $providedKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit();
}

if (empty($data['fileData']) || empty($data['fileName'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing fileData or fileName']);
    exit();
}

// Expect server-built path: <uuid>/<uuid>.pdf
$fileName = (string) $data['fileName'];
if (!preg_match('/^[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\.pdf$/', $fileName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid fileName path']);
    exit();
}

$pdfData = base64_decode($data['fileData'], true);
if ($pdfData === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid base64 data']);
    exit();
}

if (strlen($pdfData) > MAX_FILE_SIZE) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large']);
    exit();
}

$parts = explode('/', $fileName);
$userDir = UPLOAD_DIR . $parts[0];
if (!is_dir($userDir) && !mkdir($userDir, 0750, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create directory']);
    exit();
}

$filePath = UPLOAD_DIR . $fileName;

// No overwrite
if (file_exists($filePath)) {
    http_response_code(409);
    echo json_encode(['error' => 'File already exists', 'success' => false]);
    exit();
}

if (file_put_contents($filePath, $pdfData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit();
}

$publicUrl = rtrim(PUBLIC_URL_BASE, '/') . '/' . $parts[0] . '/' . $parts[1];

echo json_encode([
    'success' => true,
    'url' => $publicUrl,
    'fileName' => $fileName,
    'path' => $fileName,
]);
