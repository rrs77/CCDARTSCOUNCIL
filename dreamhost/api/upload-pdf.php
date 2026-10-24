<?php
/**
 * DreamHost PDF upload (server-to-server only).
 *
 * Deploy to DreamHost and point DREAMHOST_PDF_UPLOAD_URL at this script.
 * CCDesigner Vercel routes call this with X-API-Key — never from the browser.
 *
 * Preferred storage: outside the web root (ccd_private_pdfs/).
 * Fallback: ../pdfs/ locked down by pdfs/.htaccess.
 */

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

define('MAX_FILE_SIZE', 20 * 1024 * 1024); // Keep in sync with api/_dreamhost.js MAX_UPLOAD_BYTES
define('PATH_REGEX', '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i');

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
    echo json_encode(['error' => 'Upload not configured']);
    exit();
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';

if (!is_string($providedKey) || $providedKey === '' || !hash_equals($apiKey, $providedKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid API key']);
    exit();
}

$uploadDirEnv = getenv('DREAMHOST_PDF_UPLOAD_DIR') ?: '';
if ($uploadDirEnv !== '') {
    $uploadDir = rtrim($uploadDirEnv, '/\\') . '/';
} else {
    $outside = dirname(__DIR__, 2) . '/ccd_private_pdfs/';
    $uploadDir = is_dir(dirname($outside)) || @mkdir($outside, 0750, true)
        ? (rtrim($outside, '/\\') . '/')
        : (__DIR__ . '/../pdfs/');
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

$fileName = (string) $data['fileName'];
if (!preg_match(PATH_REGEX, $fileName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid fileName path']);
    exit();
}

$pdfData = base64_decode($data['fileData'], true);
if ($pdfData === false || $pdfData === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid base64 data']);
    exit();
}

if (strlen($pdfData) > MAX_FILE_SIZE) {
    http_response_code(413);
    echo json_encode(['error' => 'File too large']);
    exit();
}

// Require PDF magic bytes (ignore any client contentType).
if (strncmp($pdfData, '%PDF-', 5) !== 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Not a PDF']);
    exit();
}

if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $mime = finfo_buffer($finfo, $pdfData);
        finfo_close($finfo);
        if ($mime !== 'application/pdf') {
            http_response_code(400);
            echo json_encode(['error' => 'Not a PDF']);
            exit();
        }
    }
}

$parts = explode('/', $fileName);
$userDir = $uploadDir . $parts[0];
if (!is_dir($userDir) && !mkdir($userDir, 0750, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create directory']);
    exit();
}

$filePath = $uploadDir . $fileName;

// Exclusive create — refuse overwrite even under race.
$fh = @fopen($filePath, 'xb');
if ($fh === false) {
    http_response_code(file_exists($filePath) ? 409 : 500);
    echo json_encode([
        'error' => file_exists($filePath) ? 'File already exists' : 'Failed to create file',
        'success' => false,
    ]);
    exit();
}

$written = fwrite($fh, $pdfData);
fclose($fh);
if ($written === false || $written !== strlen($pdfData)) {
    @unlink($filePath);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit();
}

echo json_encode([
    'success' => true,
    'path' => $fileName,
]);
