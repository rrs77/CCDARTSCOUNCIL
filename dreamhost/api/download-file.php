<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  header('Content-Type: application/json'); http_response_code(405);
  echo json_encode(['error'=>'Method not allowed']); exit();
}
define('UPLOAD_DIR', __DIR__ . '/../files/');
define('API_KEY', 'YOUR-SECRET-API-KEY-HERE');
$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
if ($providedKey === '' || !hash_equals(API_KEY, $providedKey)) {
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
header('Content-Type: '.$mime);
header('Content-Length: '.filesize($filePath));
header('Content-Disposition: inline; filename="'.basename($path).'"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($filePath);
