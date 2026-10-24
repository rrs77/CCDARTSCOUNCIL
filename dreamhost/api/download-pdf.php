<?php
/**
 * Authenticated PDF download for server-to-server proxying.
 *
 * CCDesigner Vercel /api/files proxy calls this with X-API-Key and
 * ?path=<userId>/<uuid>.pdf — never expose this to browsers without the key.
 *
 * Probe (no full body):
 *   - Range: bytes=0-4  → 206 + Content-Range bytes 0-4/total
 *   - ?probe=1          → same 5-byte head response
 *
 * Required storage: DREAMHOST_PDF_UPLOAD_DIR or ccd_private_pdfs/ outside web root.
 * No fallback to api/../pdfs (500 if missing).
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

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
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode(['error' => 'Download not configured']);
    exit();
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';

if (!is_string($providedKey) || $providedKey === '' || !hash_equals($apiKey, $providedKey)) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit();
}

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i', $path)) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'Invalid path']);
    exit();
}

$uploadDirEnv = getenv('DREAMHOST_PDF_UPLOAD_DIR') ?: '';
if ($uploadDirEnv !== '') {
    $uploadDir = rtrim($uploadDirEnv, '/\\') . '/';
} else {
    $outside = dirname(__DIR__, 2) . '/ccd_private_pdfs/';
    if (!is_dir($outside)) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Upload directory not configured (set DREAMHOST_PDF_UPLOAD_DIR or create ccd_private_pdfs outside the web root)']);
        exit();
    }
    $uploadDir = rtrim($outside, '/\\') . '/';
}

$filePath = $uploadDir . $path;
$realBase = realpath($uploadDir);
$realFile = realpath($filePath);

if ($realBase === false || $realFile === false || strpos($realFile, $realBase) !== 0) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit();
}

if (!is_file($realFile) || !is_readable($realFile)) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
    exit();
}

$totalSize = filesize($realFile);
if ($totalSize === false) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read file']);
    exit();
}

$probe = isset($_GET['probe']) && (string) $_GET['probe'] === '1';
$rangeHeader = $headers['Range'] ?? $headers['range'] ?? '';
$wantHead = $probe;
$rangeEnd = 4;

if (!$wantHead && is_string($rangeHeader) && preg_match('/bytes=0-(\d+)/i', $rangeHeader, $m)) {
    $wantHead = true;
    $rangeEnd = min((int) $m[1], max(0, $totalSize - 1));
}

$fh = fopen($realFile, 'rb');
if ($fh === false) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read file']);
    exit();
}

if ($wantHead) {
    $end = min($rangeEnd, max(0, $totalSize - 1));
    $length = $end + 1;
    $head = fread($fh, $length);
    fclose($fh);
    if ($head === false || strlen($head) < 1) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read file']);
        exit();
    }
    header('Content-Type: application/pdf');
    header('Accept-Ranges: bytes');
    header('Content-Range: bytes 0-' . (strlen($head) - 1) . '/' . $totalSize);
    header('Content-Length: ' . (string) strlen($head));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    http_response_code(206);
    echo $head;
    exit();
}

header('Content-Type: application/pdf');
header('Accept-Ranges: bytes');
header('Content-Length: ' . (string) $totalSize);
header('Content-Disposition: attachment; filename="' . basename($realFile) . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');

fpassthru($fh);
fclose($fh);
exit();
