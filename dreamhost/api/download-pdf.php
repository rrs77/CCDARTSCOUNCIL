<?php
/**
 * Authenticated PDF download for server-to-server proxying.
 *
 * CCDesigner Vercel /api/files proxy calls this with X-API-Key and
 * ?path=<userId>/<uuid>.pdf — never expose this to browsers without the key.
 *
 * Probe (no full body):
 *   - Range (any form) → 206 of at most 64 KiB (suffix / open-ended / closed)
 *   - Multiple ranges → 416
 *   - ?probe=1          → first 5 bytes (when no Range)
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

/**
 * Parse a single HTTP Range. Caps returned length at $maxBytes.
 * Returns ['start'=>int,'end'=>int] or ['error'=>416].
 */
function ccd_parse_byte_range(?string $header, int $totalSize, int $maxBytes = 65536): ?array
{
    if ($header === null || trim($header) === '') {
        return null;
    }
    if (!preg_match('/^\s*bytes\s*=\s*(.+)$/i', $header, $m)) {
        return ['error' => 416];
    }
    $spec = trim($m[1]);
    // Multiple ranges not supported.
    if (str_contains($spec, ',')) {
        return ['error' => 416];
    }

    $maxEndDelta = max(0, $maxBytes - 1);

    // Suffix: bytes=-N (last N bytes), capped at maxBytes.
    if (preg_match('/^-(\d+)$/', $spec, $sm)) {
        $want = (int) $sm[1];
        if ($want < 1 || $totalSize < 1) {
            return ['error' => 416];
        }
        $length = min($want, $maxBytes, $totalSize);
        $start = $totalSize - $length;
        return ['start' => $start, 'end' => $totalSize - 1];
    }

    // Open-ended: bytes=N-
    if (preg_match('/^(\d+)-$/', $spec, $om)) {
        $start = (int) $om[1];
        if ($start < 0 || $start >= $totalSize) {
            return ['error' => 416];
        }
        $end = min($start + $maxEndDelta, $totalSize - 1);
        return ['start' => $start, 'end' => $end];
    }

    // Closed: bytes=N-M
    if (preg_match('/^(\d+)-(\d+)$/', $spec, $cm)) {
        $start = (int) $cm[1];
        $end = (int) $cm[2];
        if ($start < 0 || $end < $start || $start >= $totalSize) {
            return ['error' => 416];
        }
        $end = min($end, $totalSize - 1);
        if (($end - $start + 1) > $maxBytes) {
            $end = $start + $maxEndDelta;
        }
        return ['start' => $start, 'end' => $end];
    }

    return ['error' => 416];
}

$probe = isset($_GET['probe']) && (string) $_GET['probe'] === '1';
$rangeHeader = $headers['Range'] ?? $headers['range'] ?? null;
$parsed = is_string($rangeHeader) ? ccd_parse_byte_range($rangeHeader, (int) $totalSize, 64 * 1024) : null;

if (is_array($parsed) && isset($parsed['error'])) {
    header('Content-Type: application/json');
    header('Content-Range: bytes */' . $totalSize);
    http_response_code(416);
    echo json_encode(['error' => 'Range Not Satisfiable']);
    exit();
}

$fh = fopen($realFile, 'rb');
if ($fh === false) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read file']);
    exit();
}

if (is_array($parsed) && isset($parsed['start'], $parsed['end'])) {
    $start = (int) $parsed['start'];
    $end = (int) $parsed['end'];
    $length = $end - $start + 1;
    if (fseek($fh, $start) !== 0) {
        fclose($fh);
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read file']);
        exit();
    }
    $chunk = fread($fh, $length);
    fclose($fh);
    if ($chunk === false || strlen($chunk) < 1) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read file']);
        exit();
    }
    header('Content-Type: application/pdf');
    header('Accept-Ranges: bytes');
    header('Content-Range: bytes ' . $start . '-' . ($start + strlen($chunk) - 1) . '/' . $totalSize);
    header('Content-Length: ' . (string) strlen($chunk));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    http_response_code(206);
    echo $chunk;
    exit();
}

if ($probe) {
    $head = fread($fh, 5);
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
