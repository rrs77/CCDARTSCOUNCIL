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
 * Required storage location (no web-root fallback):
 *   DREAMHOST_PDF_UPLOAD_DIR  — absolute path outside the web root, OR
 *   ../ccd_private_pdfs/ relative to the site root (sibling of the public tree).
 * Deploy upload-pdf.php under the site api/ path; keep secrets in ccd_private/.
 *
 * Env / config (server-only):
 *   DREAMHOST_PDF_API_KEY / PDF_API_KEY
 *   DREAMHOST_UPLOAD_TOKEN_SECRET  — HMAC-SHA256 (same as Vercel)
 *   DREAMHOST_PDF_UPLOAD_DIR
 *   DREAMHOST_CORS_ORIGINS — comma-separated Origins for browser POSTs
 */

header('Content-Type: application/json');

define('MAX_FILE_SIZE', 100 * 1024 * 1024); // Keep in sync with api/_dreamhost.js MAX_UPLOAD_BYTES
define('STREAM_CHUNK_BYTES', 1024 * 1024); // 1 MiB
define('NONCE_MAX_AGE_SEC', 35 * 60); // upload TTL (5m) + complete grace (30m)
define('TMP_MAX_AGE_SEC', 60 * 60); // orphaned upload_tmp/up_* older than 1 hour
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
        // Browser direct uploads use X-Upload-Token only (not X-API-Key).
        header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
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

function ccd_fail(int $status, string $error, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(array_merge(['error' => $error], $extra));
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

/** Delete nonce files older than NONCE_MAX_AGE_SEC (best-effort). */
function ccd_cleanup_nonces(string $nonceDir): void
{
    if (!is_dir($nonceDir)) {
        return;
    }
    $cutoff = time() - NONCE_MAX_AGE_SEC;
    $dh = @opendir($nonceDir);
    if ($dh === false) {
        return;
    }
    while (($entry = readdir($dh)) !== false) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        if (!preg_match(UUID_REGEX, $entry)) {
            continue;
        }
        $full = $nonceDir . '/' . $entry;
        if (!is_file($full)) {
            continue;
        }
        $mtime = @filemtime($full);
        if ($mtime !== false && $mtime < $cutoff) {
            @unlink($full);
        }
    }
    closedir($dh);
}

/** Single-use nonce: exclusive create under private nonces dir. */
function ccd_consume_nonce(string $nonceDir, string $nonce): bool
{
    ccd_cleanup_nonces($nonceDir);
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

/**
 * Required private upload directory — never falls back to api/../pdfs.
 */
function ccd_upload_dir(): string
{
    $uploadDirEnv = getenv('DREAMHOST_PDF_UPLOAD_DIR') ?: '';
    if ($uploadDirEnv !== '') {
        $dir = rtrim($uploadDirEnv, '/\\') . '/';
        if (!is_dir($dir) && !@mkdir($dir, 0750, true)) {
            ccd_fail(500, 'Upload directory not configured');
        }
        return $dir;
    }
    $outside = dirname(__DIR__, 2) . '/ccd_private_pdfs/';
    if (!is_dir($outside) && !@mkdir($outside, 0750, true)) {
        ccd_fail(500, 'Upload directory not configured (set DREAMHOST_PDF_UPLOAD_DIR or create ccd_private_pdfs outside the web root)');
    }
    return rtrim($outside, '/\\') . '/';
}

function ccd_private_tmp_dir(): string
{
    $base = dirname(__DIR__, 2) . '/ccd_private/upload_tmp';
    if (!is_dir($base) && !@mkdir($base, 0750, true)) {
        ccd_fail(500, 'Temp upload directory unavailable');
    }
    return rtrim($base, '/\\') . '/';
}

/** Best-effort: remove upload_tmp/up_* files older than TMP_MAX_AGE_SEC. */
function ccd_cleanup_stale_tmps(): void
{
    $dir = ccd_private_tmp_dir();
    $cutoff = time() - TMP_MAX_AGE_SEC;
    $matches = glob($dir . 'up_*') ?: [];
    foreach ($matches as $full) {
        if (!is_file($full)) {
            continue;
        }
        $mtime = @filemtime($full);
        if ($mtime !== false && $mtime < $cutoff) {
            @unlink($full);
        }
    }
}

/** Ensure a temp path is unlinked even if the request aborts mid-flight. */
function ccd_register_tmp_cleanup(string $tmpPath): void
{
    register_shutdown_function(static function () use ($tmpPath) {
        if ($tmpPath !== '' && is_file($tmpPath)) {
            @unlink($tmpPath);
        }
    });
}

/** Create an exclusive up_* temp path with shutdown + stale cleanup. */
function ccd_create_upload_tmp(): string
{
    ccd_cleanup_stale_tmps();
    $tmpPath = ccd_private_tmp_dir() . 'up_' . bin2hex(random_bytes(16));
    ccd_register_tmp_cleanup($tmpPath);
    return $tmpPath;
}

/**
 * Place temp → final exclusively.
 * Prefer link() (atomic, same filesystem). If link fails (EXDEV / unsupported)
 * and the target does not exist: fopen(dest,'xb'), stream_copy_to_stream,
 * verify byte count; unlink partial dest on any error. Temp+upload dirs must
 * share a filesystem for link(); otherwise the copy fallback is used.
 */
function ccd_place_temp_as_final(string $tmpPath, string $filePath, int $expectedBytes): void
{
    if (@link($tmpPath, $filePath)) {
        @unlink($tmpPath);
        return;
    }

    if (file_exists($filePath)) {
        @unlink($tmpPath);
        ccd_fail(409, 'File already exists', ['success' => false]);
    }

    // Cross-device / unsupported link — exclusive copy fallback.
    $dest = @fopen($filePath, 'xb');
    if ($dest === false) {
        $exists = file_exists($filePath);
        @unlink($tmpPath);
        if ($exists) {
            ccd_fail(409, 'File already exists', ['success' => false]);
        }
        ccd_fail(500, 'Failed to save file', ['success' => false]);
    }
    $src = @fopen($tmpPath, 'rb');
    if ($src === false) {
        fclose($dest);
        @unlink($filePath);
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to read temp file');
    }
    $copied = @stream_copy_to_stream($src, $dest);
    fclose($src);
    fclose($dest);
    if ($copied === false || (int) $copied !== (int) $expectedBytes) {
        @unlink($filePath);
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to save file', ['success' => false]);
    }
    @unlink($tmpPath);
}

/**
 * Validate a temp file as PDF (magic + finfo), then place exclusively.
 */
function ccd_finalize_pdf_from_temp(string $uploadDir, string $fileName, string $tmpPath, int $byteLength): void
{
    $fh = @fopen($tmpPath, 'rb');
    if ($fh === false) {
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to read temp file');
    }
    $magic = fread($fh, 5);
    fclose($fh);
    if ($magic === false || strncmp($magic, '%PDF-', 5) !== 0) {
        @unlink($tmpPath);
        ccd_fail(400, 'Not a PDF');
    }

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mime = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if ($mime !== 'application/pdf') {
                @unlink($tmpPath);
                ccd_fail(400, 'Not a PDF');
            }
        }
    }

    $parts = explode('/', $fileName);
    $userDir = $uploadDir . $parts[0];
    if (!is_dir($userDir) && !mkdir($userDir, 0750, true)) {
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to create directory');
    }

    $filePath = $uploadDir . $fileName;
    ccd_place_temp_as_final($tmpPath, $filePath, $byteLength);

    echo json_encode([
        'success' => true,
        'path' => $fileName,
        'bytes' => $byteLength,
    ]);
}

/**
 * Stream php://input in 1MB chunks to a private temp file; 413 once maxBytes exceeded.
 */
function ccd_stream_body_to_temp(int $maxBytes): array
{
    $limit = min($maxBytes, MAX_FILE_SIZE);
    $tmpPath = ccd_create_upload_tmp();
    $in = fopen('php://input', 'rb');
    if ($in === false) {
        @unlink($tmpPath);
        ccd_fail(400, 'Empty body');
    }
    $out = @fopen($tmpPath, 'xb');
    if ($out === false) {
        fclose($in);
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to create temp file');
    }

    $total = 0;
    while (!feof($in)) {
        $chunk = fread($in, STREAM_CHUNK_BYTES);
        if ($chunk === false) {
            fclose($in);
            fclose($out);
            @unlink($tmpPath);
            ccd_fail(500, 'Failed to read upload body');
        }
        if ($chunk === '') {
            break;
        }
        $total += strlen($chunk);
        if ($total > $limit) {
            fclose($in);
            fclose($out);
            @unlink($tmpPath);
            ccd_fail(413, 'File too large');
        }
        if (fwrite($out, $chunk) === false) {
            fclose($in);
            fclose($out);
            @unlink($tmpPath);
            ccd_fail(500, 'Failed to write temp file');
        }
    }
    fclose($in);
    fclose($out);

    if ($total < 1) {
        @unlink($tmpPath);
        ccd_fail(400, 'Empty body');
    }

    return [$tmpPath, $total];
}

/**
 * Write decoded bytes via temp + magic/finfo + rename (API-key JSON path).
 */
function ccd_write_pdf_from_string(string $uploadDir, string $fileName, string $pdfData, int $maxBytes): void
{
    $len = strlen($pdfData);
    if ($len > $maxBytes || $len > MAX_FILE_SIZE) {
        ccd_fail(413, 'File too large');
    }
    $tmpPath = ccd_create_upload_tmp();
    if (@file_put_contents($tmpPath, $pdfData) !== $len) {
        @unlink($tmpPath);
        ccd_fail(500, 'Failed to write temp file');
    }
    ccd_finalize_pdf_from_temp($uploadDir, $fileName, $tmpPath, $len);
}

[$apiKey, $tokenSecret] = ccd_load_secrets();
$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? $headers['X-API-Key'] ?? '';
$uploadToken = $headers['X-Upload-Token'] ?? $headers['x-upload-token'] ?? '';

$uploadDir = ccd_upload_dir();
$nonceDir = dirname(__DIR__, 2) . '/ccd_private/upload_nonces';

// ---- Mode 2: signed browser direct upload (streamed) ----
if (is_string($uploadToken) && $uploadToken !== '') {
    $claims = ccd_verify_upload_token($uploadToken, $tokenSecret);
    if ($claims === null) {
        ccd_fail(401, 'Invalid or expired upload token');
    }

    if (!ccd_consume_nonce($nonceDir, $claims['nonce'])) {
        ccd_fail(409, 'Upload token already used');
    }

    // Early reject when Content-Length is present and already over max.
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > 0 && $contentLength > $claims['maxBytes']) {
        ccd_fail(413, 'File too large');
    }

    [$tmpPath, $byteLength] = ccd_stream_body_to_temp($claims['maxBytes']);
    ccd_finalize_pdf_from_temp($uploadDir, $claims['path'], $tmpPath, $byteLength);
    exit();
}

// ---- Mode 1: server-to-server API key + JSON ----
if ($apiKey === '') {
    ccd_fail(503, 'Upload not configured');
}

if (!is_string($providedKey) || $providedKey === '' || !hash_equals($apiKey, $providedKey)) {
    ccd_fail(401, 'Invalid API key');
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    ccd_fail(400, 'Invalid JSON data');
}

if (empty($data['fileData']) || empty($data['fileName'])) {
    ccd_fail(400, 'Missing fileData or fileName');
}

$fileName = (string) $data['fileName'];
if (!preg_match(PATH_REGEX, $fileName)) {
    ccd_fail(400, 'Invalid fileName path');
}

$pdfData = base64_decode($data['fileData'], true);
if ($pdfData === false || $pdfData === '') {
    ccd_fail(400, 'Invalid base64 data');
}

ccd_write_pdf_from_string($uploadDir, $fileName, $pdfData, MAX_FILE_SIZE);
