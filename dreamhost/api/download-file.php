<?php
/**
 * Lesson attachment download (API key only).
 * Supports ?probe=1 and Range bytes=0-N for complete-upload magic/size checks.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Range');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  header('Content-Type: application/json'); http_response_code(405);
  echo json_encode(['error'=>'Method not allowed']); exit();
}
define('UPLOAD_DIR', __DIR__ . '/../files/');

function ccd_load_api_key(): string {
  $apiKey = getenv('DREAMHOST_PDF_API_KEY') ?: getenv('PDF_API_KEY') ?: '';
  $configFile = dirname(__DIR__, 2) . '/ccd_private/pdf-api-key.php';
  if ($apiKey === '' && is_readable($configFile)) {
    $cfg = include $configFile;
    if (is_array($cfg) && !empty($cfg['api_key'])) {
      $apiKey = (string) $cfg['api_key'];
    }
  }
  if ($apiKey === '') {
    $apiKey = 'YOUR-SECRET-API-KEY-HERE';
  }
  return $apiKey;
}

$API_KEY = ccd_load_api_key();
$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
if ($providedKey === '' || !hash_equals($API_KEY, $providedKey) || $API_KEY === 'YOUR-SECRET-API-KEY-HERE') {
  header('Content-Type: application/json'); http_response_code(401);
  echo json_encode(['error'=>'Unauthorized']); exit();
}
$path = isset($_GET['path']) ? trim($_GET['path']) : '';
if ($path === '' || strpos($path, '..') !== false || substr_count($path, '/') !== 2) {
  header('Content-Type: application/json'); http_response_code(400);
  echo json_encode(['error'=>'Invalid path']); exit();
}
$filePath = UPLOAD_DIR . $path;
if (!is_file($filePath)) {
  header('Content-Type: application/json'); http_response_code(404);
  echo json_encode(['error'=>'Not found']); exit();
}
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mime = [
  'jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','heic'=>'image/heic','webp'=>'image/webp',
  'mp4'=>'video/mp4','mov'=>'video/quicktime','doc'=>'application/msword',
  'docx'=>'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'mp3'=>'audio/mpeg','wav'=>'audio/wav','m4a'=>'audio/mp4','aac'=>'audio/aac','ogg'=>'audio/ogg',
][$ext] ?? 'application/octet-stream';

$totalSize = filesize($filePath);
$probe = isset($_GET['probe']) && (string)$_GET['probe'] === '1';
$rangeHeader = $headers['Range'] ?? $headers['range'] ?? null;
$start = null;
$end = null;

if (is_string($rangeHeader) && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $m)) {
  $start = (int)$m[1];
  $end = ($m[2] !== '') ? (int)$m[2] : min($start + 63, $totalSize - 1);
  if ($start < 0 || $start >= $totalSize || $end < $start) {
    header('Content-Type: application/json');
    header('Content-Range: bytes */' . $totalSize);
    http_response_code(416);
    echo json_encode(['error' => 'Range Not Satisfiable']);
    exit();
  }
  $end = min($end, $totalSize - 1);
}

$fh = fopen($filePath, 'rb');
if ($fh === false) {
  header('Content-Type: application/json'); http_response_code(500);
  echo json_encode(['error'=>'Failed to read']); exit();
}

if ($start !== null) {
  $length = $end - $start + 1;
  if (fseek($fh, $start) !== 0) {
    fclose($fh);
    header('Content-Type: application/json'); http_response_code(500);
    echo json_encode(['error'=>'Failed to read']); exit();
  }
  $chunk = fread($fh, $length);
  fclose($fh);
  if ($chunk === false || strlen($chunk) < 1) {
    header('Content-Type: application/json'); http_response_code(500);
    echo json_encode(['error'=>'Failed to read']); exit();
  }
  header('Content-Type: '.$mime);
  header('Accept-Ranges: bytes');
  header('Content-Range: bytes ' . $start . '-' . ($start + strlen($chunk) - 1) . '/' . $totalSize);
  header('Content-Length: ' . (string) strlen($chunk));
  header('X-File-Size: ' . (string) $totalSize);
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, no-store');
  http_response_code(206);
  echo $chunk;
  exit();
}

if ($probe) {
  $head = fread($fh, 64);
  fclose($fh);
  if ($head === false || strlen($head) < 1) {
    header('Content-Type: application/json'); http_response_code(500);
    echo json_encode(['error'=>'Failed to read']); exit();
  }
  header('Content-Type: '.$mime);
  header('Accept-Ranges: bytes');
  header('Content-Range: bytes 0-' . (strlen($head) - 1) . '/' . $totalSize);
  header('Content-Length: ' . (string) strlen($head));
  header('X-File-Size: ' . (string) $totalSize);
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, no-store');
  http_response_code(206);
  echo $head;
  exit();
}

header('Content-Type: '.$mime);
header('Content-Length: '.$totalSize);
header('Accept-Ranges: bytes');
header('Content-Disposition: inline; filename="'.basename($path).'"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
fpassthru($fh);
fclose($fh);
