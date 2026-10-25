<?php
/**
 * General file upload for lesson attachments.
 * Deploy beside upload-pdf.php.
 *
 * Auth modes:
 * 1) Server-to-server: X-API-Key (DREAMHOST_PDF_API_KEY) + JSON body
 * 2) Browser direct:   X-Upload-Ticket HMAC (dedicated signing secret) + multipart
 *
 * Ticket secret (REQUIRED for browser tickets — never the PDF API key):
 *   DREAMHOST_UPLOAD_TOKEN_SECRET or DREAMHOST_UPLOAD_SIGNING_SECRET
 * TTL: 5 minutes. Nonce is single-use via exclusive fopen('xb') under
 *   ccd_private/upload_nonces/ (same pattern as upload-pdf.php).
 *
 * Path: <userUuid>/<lessonSeg>/<fileUuid>.<ext> — never overwrite.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Upload-Ticket');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }

define('UPLOAD_DIR', __DIR__ . '/../files/');
define('MAX_FILE_SIZE', 500 * 1024 * 1024);
define('TICKET_TTL_SEC', 5 * 60);
define('NONCE_MAX_AGE_SEC', 10 * 60);
define('UUID_REGEX', '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i');

$ALLOWED_EXT = [
  'jpg'=>15*1024*1024,'jpeg'=>15*1024*1024,'png'=>15*1024*1024,'heic'=>15*1024*1024,'webp'=>15*1024*1024,
  'mp4'=>500*1024*1024,'mov'=>500*1024*1024,
  'doc'=>25*1024*1024,'docx'=>25*1024*1024,
  'mp3'=>50*1024*1024,'wav'=>50*1024*1024,'m4a'=>50*1024*1024,'aac'=>50*1024*1024,'ogg'=>50*1024*1024,
];

function ccd_fail(int $status, string $error): void {
  http_response_code($status);
  echo json_encode(['error' => $error]);
  exit();
}

function ccd_load_secrets(): array {
  $apiKey = getenv('DREAMHOST_PDF_API_KEY') ?: getenv('PDF_API_KEY') ?: '';
  // Dedicated ticket secret — NO fallback to PDF API key.
  $tokenSecret = getenv('DREAMHOST_UPLOAD_TOKEN_SECRET')
    ?: getenv('DREAMHOST_UPLOAD_SIGNING_SECRET')
    ?: '';
  $configFile = dirname(__DIR__, 2) . '/ccd_private/pdf-api-key.php';
  if (is_readable($configFile)) {
    /** @var array{api_key?: string, upload_token_secret?: string, upload_signing_secret?: string} $cfg */
    $cfg = include $configFile;
    if (is_array($cfg)) {
      if ($apiKey === '' && !empty($cfg['api_key'])) {
        $apiKey = (string) $cfg['api_key'];
      }
      if ($tokenSecret === '' && !empty($cfg['upload_token_secret'])) {
        $tokenSecret = (string) $cfg['upload_token_secret'];
      }
      if ($tokenSecret === '' && !empty($cfg['upload_signing_secret'])) {
        $tokenSecret = (string) $cfg['upload_signing_secret'];
      }
    }
  }
  // Legacy placeholder in this file for API-key-only deploys (server-to-server).
  if ($apiKey === '') {
    $apiKey = 'YOUR-SECRET-API-KEY-HERE';
  }
  return [$apiKey, $tokenSecret];
}

function b64url_decode($str) {
  $pad = strlen($str) % 4 === 0 ? '' : str_repeat('=', 4 - (strlen($str) % 4));
  return base64_decode(strtr($str, '-_', '+/') . $pad, true);
}

function b64url_encode(string $raw): string {
  return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function ccd_nonce_dir(): string {
  return dirname(__DIR__, 2) . '/ccd_private/upload_nonces';
}

function ccd_cleanup_nonces(string $nonceDir): void {
  if (!is_dir($nonceDir)) return;
  $cutoff = time() - NONCE_MAX_AGE_SEC;
  $dh = @opendir($nonceDir);
  if ($dh === false) return;
  while (($entry = readdir($dh)) !== false) {
    if ($entry === '.' || $entry === '..') continue;
    if (!preg_match(UUID_REGEX, $entry)) continue;
    $full = $nonceDir . '/' . $entry;
    if (!is_file($full)) continue;
    $mtime = @filemtime($full);
    if ($mtime !== false && $mtime < $cutoff) {
      @unlink($full);
    }
  }
  closedir($dh);
}

/** Single-use nonce: exclusive create under private nonces dir. */
function ccd_consume_nonce(string $nonce): bool {
  if (!preg_match(UUID_REGEX, $nonce)) return false;
  $nonceDir = ccd_nonce_dir();
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
 * Verify HMAC ticket with hash_equals. Returns claims or null.
 * Requires dedicated token secret (never API key).
 */
function verify_ticket($ticket, string $secret) {
  if ($secret === '' || !$ticket || strpos($ticket, '.') === false) return null;
  list($body, $sig) = explode('.', $ticket, 2);
  if ($body === '' || $sig === '') return null;
  $expected = b64url_encode(hash_hmac('sha256', $body, $secret, true));
  if (!hash_equals($expected, $sig)) return null;
  $json = b64url_decode($body);
  if ($json === false) return null;
  $payload = json_decode($json, true);
  if (!$payload || empty($payload['exp']) || (int)$payload['exp'] < time()) return null;
  // Soft TTL check: reject tickets minted with >5m window abuse if exp far out
  if ((int)$payload['exp'] > time() + TICKET_TTL_SEC + 30) return null;
  $nonce = isset($payload['nonce']) ? (string)$payload['nonce'] : '';
  if (!preg_match(UUID_REGEX, $nonce)) return null;
  return $payload;
}

function valid_path($path) {
  if (!is_string($path) || strpos($path, '..') !== false) return false;
  $parts = explode('/', $path);
  if (count($parts) !== 3) return false;
  return preg_match('/^[0-9a-f-]{36}$/i', $parts[0])
    && preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/', $parts[1])
    && preg_match('/^[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i', $parts[2]);
}

[$API_KEY, $TOKEN_SECRET] = ccd_load_secrets();

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
$ticket = $headers['X-Upload-Ticket'] ?? $headers['x-upload-ticket'] ?? '';
$binary = null; $path = null;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'multipart/form-data') !== false) {
  $path = isset($_POST['path']) ? trim($_POST['path']) : '';
  if (!empty($_POST['ticket'])) $ticket = $_POST['ticket'];
  if (empty($_FILES['file']['tmp_name'])) { ccd_fail(400, 'Missing file'); }
  $binary = file_get_contents($_FILES['file']['tmp_name']);
} else {
  $data = json_decode(file_get_contents('php://input'), true);
  if (!$data) { ccd_fail(400, 'Invalid JSON'); }
  $path = $data['path'] ?? $data['fileName'] ?? '';
  if (!empty($data['ticket'])) $ticket = $data['ticket'];
  if (empty($data['fileData'])) { ccd_fail(400, 'Missing fileData'); }
  $binary = base64_decode($data['fileData'], true);
}

$apiOk = ($providedKey !== '' && hash_equals($API_KEY, $providedKey)
  && $API_KEY !== 'YOUR-SECRET-API-KEY-HERE');
$ticketPayload = null;
if ($ticket) {
  if ($TOKEN_SECRET === '') {
    ccd_fail(503, 'Upload ticket secret not configured');
  }
  $ticketPayload = verify_ticket($ticket, $TOKEN_SECRET);
}

if (!$apiOk && !$ticketPayload) { ccd_fail(401, 'Unauthorized'); }
if (!valid_path($path)) { ccd_fail(400, 'Invalid path'); }
if ($ticketPayload && ($ticketPayload['p'] ?? '') !== $path) { ccd_fail(403, 'Ticket path mismatch'); }

if ($ticketPayload) {
  $nonce = (string)($ticketPayload['nonce'] ?? '');
  if (!ccd_consume_nonce($nonce)) {
    ccd_fail(409, 'Upload ticket already used or invalid nonce');
  }
}

$maxFromTicket = isset($ticketPayload['n']) ? (int)$ticketPayload['n'] : MAX_FILE_SIZE;
if ($binary === false || $binary === null || strlen($binary) === 0) { ccd_fail(400, 'Empty file'); }
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
global $ALLOWED_EXT;
if (!isset($ALLOWED_EXT[$ext])) { ccd_fail(400, 'Extension not allowed'); }
$max = min($ALLOWED_EXT[$ext], $maxFromTicket, MAX_FILE_SIZE);
if (strlen($binary) > $max) { ccd_fail(413, 'File too large'); }
if (!file_exists(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
$fullDir = UPLOAD_DIR . dirname($path);
if (!file_exists($fullDir)) mkdir($fullDir, 0755, true);
$filePath = UPLOAD_DIR . $path;
if (file_exists($filePath)) { ccd_fail(409, 'File already exists'); }
if (file_put_contents($filePath, $binary) === false) { ccd_fail(500, 'Failed to save'); }
echo json_encode(['success'=>true,'path'=>$path,'bytes'=>strlen($binary)]);
