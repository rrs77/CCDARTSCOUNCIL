<?php
/**
 * DreamHost PDF upload.
 *
 * Two modes:
 * 1) Server-to-server: X-API-Key + JSON { fileName, fileData } (base64).
 * 2) Browser direct:   X-Upload-Token (HMAC) + raw application/pdf body.
 *    Token binds user, org, server path, max size, exp, nonce.
 *    Nonce is single-use via exclusive file under ccd_private/upload_nonces/.
 *
 * Env / config (server-only):
 *   DREAMHOST_PDF_API_KEY / PDF_API_KEY
 *   DREAMHOST_UPLOAD_TOKEN_SECRET  — HMAC-SHA256 (same as Vercel)
 *   DREAMHOST_PDF_UPLOAD_DIR
 *   DREAMHOST_CORS_ORIGINS — comma-separated Origins for browser POSTs
 */

header('Content-Type: application/json');

define('MAX_FILE_SIZE', 100 * 1024 * 1024); // Keep in sync with api/_dreamhost.js MAX_UPLOAD_BYTES
define('PATH_REGEX', '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i');
define('UUID_REGEX', '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i');

function ccd_cors_headers(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin === '') {
        return;
    }
    $raw = getenv('DREAMHOST_CORS_ORIGINS') ?: '';
    $allowed = array_filter(array_map('trim', explode(',', $raw)));
    if ($allowed && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token, X-API-Key');
        header('Access-Control-Max-Age: 600');
    }
}

ccd_cors_headers();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

function ccd_load_secrets(): array
{
    $apiKey = getenv('DREAMHOST_PDF_API_KEY') ?: getenv('PDF_API_KEY') ?: '';
    $tokenSecret = getenv('DREAMHOST_UPLOAD_TOKEN_SECRET') ?: '';
    $configFile = dirname(__DIR__, 2) . '/ccd_private/pdf-api-key.php';
    if (is_readable($configFile)) {
        /** @var array{api_key?: string, upload_token_secret?: string} $cfg */
        $cfg = include $configFile;
        if (is_array($cfg)) {
            if ($apiKey === '' && !empty($cfg['api_key'])) {
                $apiKey = (string) $cfg['api_key'];
            }
            if ($tokenSecret === '' && !empty($cfg['upload_token_secret'])) {
                $tokenSecret = (string) $cfg['upload_token_secret'];
            }
        }
    }
    return [$apiKey, $tokenSecret];
}

function ccd_b64url_decode(string $data): string|false
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'), true);
}

function ccd_b64url_encode(string $raw): string
{
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

/**
 * Verify HMAC-SHA256 token with hash_equals. Returns claims array or null.
 */
function ccd_verify_upload_token(string $token, string $secret): ?array
{
    if ($secret === '' || !str_contains($token, '.')) {
        return null;
    }
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }
    [$body, $sig] = $parts;
    if ($body === '' || $sig === '') {
        return null;
    }
    $expected = ccd_b64url_encode(hash_hmac('sha256', $body, $secret, true));
    if (!hash_equals($expected, $sig)) {
        return null;
    }
    $json = ccd_b64url_decode($body);
    if ($json === false) {
        return null;
    }
    $claims = json_decode($json, true);
    if (!is_array($claims)) {
        return null;
    }
    $userId = isset($claims['u']) ? (string) $claims['u'] : '';
    $path = isset($claims['p']) ? (string) $claims['p'] : '';
    $max = isset($claims['m']) ? (int) $claims['m'] : 0;
    $exp = isset($claims['e']) ? (int) $claims['e'] : 0;
    $nonce = isset($claims['n']) ? (string) $claims['n'] : '';
    if (!preg_match(UUID_REGEX, $userId) || !preg_match(UUID_REGEX, $nonce)) {
        return null;
    }
    if (!preg_match(PATH_REGEX, $path)) {
        return null;
    }
    // Path must be under the bound user id.
    if (stripos($path, $userId . '/') !== 0) {
        return null;
    }
    if ($max < 1 || $max > MAX_FILE_SIZE) {
        return null;
    }
    if ($exp < time()) {
        return null;
    }
    return [
        'userId' => $userId,
        'orgId' => isset($claims['o']) ? (string) $claims['o'] : '',
        'path' => $path,
        'maxBytes' => $max,
        'exp' => $exp,
        'nonce' => $nonce,
    ];
}

/** Single-use nonce: exclusive create under private nonces dir. */
function ccd_consume_nonce(string $nonceDir, string $nonce): bool
{
    if (!is_dir($nonceDir) && !mkdir($nonceDir, 0750, true)) {
        return false;
    }
    $path = rtrim($nonceDir, '/\\') . '/' . $nonce;
    $fh = @fopen($path, 'xb');
    if ($fh === false) {
        return false;
    }
    fwrite($fh, (string) time());
    fclose($fh);
    return true;
}

function ccd_upload_dir(): string
{
    $uploadDirEnv = getenv('DREAMHOST_PDF_UPLOAD_DIR') ?: '';
    if ($uploadDirEnv !== '') {
        return rtrim($uploadDirEnv, '/\\') . '/';
    }
    $outside = dirname(__DIR__, 2) . '/ccd_private_pdfs/';
    return is_dir(dirname($outside)) || @mkdir($outside, 0750, true)
        ? (rtrim($outside, '/\\') . '/')
        : (__DIR__ . '/../pdfs/');
}

function ccd_write_pdf_exclusive(string $uploadDir, string $fileName, string $pdfData, int $maxBytes): void
{
    if (strlen($pdfData) > $maxBytes || strlen($pdfData) > MAX_FILE_SIZE) {
        http_response_code(413);
        echo json_encode(['error' => 'File too large']);
        exit();
    }
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
        'bytes' => strlen($pdfData),
    ]);
}

[$apiKey, $tokenSecret] = ccd_load_secrets();
$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';
$uploadToken = $headers['X-Upload-Token'] ?? $headers['x-upload-token'] ?? '';

$uploadDir = ccd_upload_dir();
$nonceDir = dirname(__DIR__, 2) . '/ccd_private/upload_nonces';

// ---- Mode 2: signed browser direct upload ----
if (is_string($uploadToken) && $uploadToken !== '') {
    $claims = ccd_verify_upload_token($uploadToken, $tokenSecret);
    if ($claims === null) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired upload token']);
        exit();
    }

    if (!ccd_consume_nonce($nonceDir, $claims['nonce'])) {
        http_response_code(409);
        echo json_encode(['error' => 'Upload token already used']);
        exit();
    }

    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > 0 && $contentLength > $claims['maxBytes']) {
        http_response_code(413);
        echo json_encode(['error' => 'File too large']);
        exit();
    }

    $pdfData = file_get_contents('php://input');
    if ($pdfData === false || $pdfData === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Empty body']);
        exit();
    }

    ccd_write_pdf_exclusive($uploadDir, $claims['path'], $pdfData, $claims['maxBytes']);
    exit();
}

// ---- Mode 1: server-to-server API key + JSON ----
if ($apiKey === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Upload not configured']);
    exit();
}

if (!is_string($providedKey) || $providedKey === '' || !hash_equals($apiKey, $providedKey)) {
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

ccd_write_pdf_exclusive($uploadDir, $fileName, $pdfData, MAX_FILE_SIZE);
