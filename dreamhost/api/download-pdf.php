<?php
/**
 * Authenticated PDF download for server-to-server proxying.
 *
 * CCDesigner Vercel /api/files proxy calls this with X-API-Key and
 * ?path=<userId>/<uuid>.pdf — never expose this to browsers without the key.
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Prefer env / config outside web root; never hardcode production secrets.
$apiKey = getenv('DREAMHOST_PDF_API_KEY') ?: getenv('PDF_API_KEY') ?: '';
$configFile = dirname(__DIR__, 2) . '/ccd_private/pdf-api-key.php';
if ($apiKey === '' && is_readable($configFile)) {
    /** @var array{api_key?: string} $cfg */
    $cfg = include $configFile;
    if (is_array($cfg) && !empty($cfg['api_key'])) {
        $apiKey = (string) $cfg['api_key'];
    }
}

if ($apiKey === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Download not configured']);
    exit();
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';

if (!is_string($providedKey) || $providedKey === '' || !hash_equals($apiKey, $providedKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit();
}

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
// Strict: <uuid>/<uuid>.pdf only
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i', $path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path']);
    exit();
}

// Preferred: outside web root. Fallback: ../pdfs (denied by .htaccess).
$uploadDir = getenv('DREAMHOST_PDF_UPLOAD_DIR') ?: '';
if ($uploadDir === '') {
    $outside = dirname(__DIR__, 2) . '/ccd_private_pdfs/';
    $uploadDir = is_dir($outside) ? $outside : (__DIR__ . '/../pdfs/');
}
$uploadDir = rtrim($uploadDir, '/\\') . '/';

$filePath = $uploadDir . $path;
$realBase = realpath($uploadDir);
$realFile = realpath($filePath);

if ($realBase === false || $realFile === false || strpos($realFile, $realBase) !== 0) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit();
}

if (!is_file($realFile) || !is_readable($realFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit();
}

header_remove('Content-Type');
header('Content-Type: application/pdf');
header('Content-Length: ' . (string) filesize($realFile));
header('Content-Disposition: attachment; filename="' . basename($realFile) . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');

$fh = fopen($realFile, 'rb');
if ($fh === false) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to read file']);
    exit();
}
fpassthru($fh);
fclose($fh);
exit();
