<?php
/**
 * General file upload for lesson attachments.
 * Deploy beside upload-pdf.php. Auth: X-API-Key (server) or HMAC ticket (browser direct).
 * Path: <userUuid>/<lessonSeg>/<fileUuid>.<ext> — never overwrite.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Upload-Ticket');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit(); }

define('UPLOAD_DIR', __DIR__ . '/../files/');
define('API_KEY', 'YOUR-SECRET-API-KEY-HERE'); // match DREAMHOST_PDF_API_KEY
define('SIGNING_SECRET', API_KEY);
define('MAX_FILE_SIZE', 500 * 1024 * 1024);

$ALLOWED_EXT = [
  'jpg'=>15*1024*1024,'jpeg'=>15*1024*1024,'png'=>15*1024*1024,'heic'=>15*1024*1024,'webp'=>15*1024*1024,
  'mp4'=>500*1024*1024,'mov'=>500*1024*1024,
  'doc'=>25*1024*1024,'docx'=>25*1024*1024,
  'mp3'=>50*1024*1024,'wav'=>50*1024*1024,'m4a'=>50*1024*1024,'aac'=>50*1024*1024,'ogg'=>50*1024*1024,
];

function b64url_decode($str) {
  $pad = strlen($str) % 4 === 0 ? '' : str_repeat('=', 4 - (strlen($str) % 4));
  return base64_decode(strtr($str, '-_', '+/') . $pad);
}
function verify_ticket($ticket) {
  if (!$ticket || strpos($ticket, '.') === false) return null;
  list($body, $sig) = explode('.', $ticket, 2);
  $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $body, SIGNING_SECRET, true)), '+/', '-_'), '=');
  if (!hash_equals($expected, $sig)) return null;
  $payload = json_decode(b64url_decode($body), true);
  if (!$payload || empty($payload['exp']) || $payload['exp'] < time()) return null;
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

$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
$ticket = $headers['X-Upload-Ticket'] ?? $headers['x-upload-ticket'] ?? '';
$binary = null; $path = null;
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'multipart/form-data') !== false) {
  $path = isset($_POST['path']) ? trim($_POST['path']) : '';
  if (!empty($_POST['ticket'])) $ticket = $_POST['ticket'];
  if (empty($_FILES['file']['tmp_name'])) { http_response_code(400); echo json_encode(['error'=>'Missing file']); exit(); }
  $binary = file_get_contents($_FILES['file']['tmp_name']);
} else {
  $data = json_decode(file_get_contents('php://input'), true);
  if (!$data) { http_response_code(400); echo json_encode(['error'=>'Invalid JSON']); exit(); }
  $path = $data['path'] ?? $data['fileName'] ?? '';
  if (!empty($data['ticket'])) $ticket = $data['ticket'];
  if (empty($data['fileData'])) { http_response_code(400); echo json_encode(['error'=>'Missing fileData']); exit(); }
  $binary = base64_decode($data['fileData'], true);
}

$apiOk = ($providedKey !== '' && hash_equals(API_KEY, $providedKey));
$ticketPayload = $ticket ? verify_ticket($ticket) : null;
if (!$apiOk && !$ticketPayload) { http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit(); }
if (!valid_path($path)) { http_response_code(400); echo json_encode(['error'=>'Invalid path']); exit(); }
if ($ticketPayload && ($ticketPayload['p'] ?? '') !== $path) { http_response_code(403); echo json_encode(['error'=>'Ticket path mismatch']); exit(); }
$maxFromTicket = isset($ticketPayload['n']) ? (int)$ticketPayload['n'] : MAX_FILE_SIZE;
if ($binary === false || $binary === null || strlen($binary) === 0) { http_response_code(400); echo json_encode(['error'=>'Empty file']); exit(); }
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
global $ALLOWED_EXT;
if (!isset($ALLOWED_EXT[$ext])) { http_response_code(400); echo json_encode(['error'=>'Extension not allowed']); exit(); }
$max = min($ALLOWED_EXT[$ext], $maxFromTicket, MAX_FILE_SIZE);
if (strlen($binary) > $max) { http_response_code(413); echo json_encode(['error'=>'File too large']); exit(); }
if (!file_exists(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
$fullDir = UPLOAD_DIR . dirname($path);
if (!file_exists($fullDir)) mkdir($fullDir, 0755, true);
$filePath = UPLOAD_DIR . $path;
if (file_exists($filePath)) { http_response_code(409); echo json_encode(['error'=>'File already exists']); exit(); }
if (file_put_contents($filePath, $binary) === false) { http_response_code(500); echo json_encode(['error'=>'Failed to save']); exit(); }
echo json_encode(['success'=>true,'path'=>$path,'bytes'=>strlen($binary)]);
