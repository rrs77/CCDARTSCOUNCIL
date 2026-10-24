<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error'=>'Method not allowed']); exit(); }
define('UPLOAD_DIR', __DIR__ . '/../files/');
define('API_KEY', 'YOUR-SECRET-API-KEY-HERE');
$headers = function_exists('getallheaders') ? getallheaders() : [];
$providedKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
if ($providedKey === '' || !hash_equals(API_KEY, $providedKey)) {
  http_response_code(401); echo json_encode(['error'=>'Unauthorized']); exit();
}
$data = json_decode(file_get_contents('php://input'), true);
$path = is_array($data) ? trim($data['path'] ?? '') : '';
if ($path === '' || strpos($path, '..') !== false || substr_count($path, '/') !== 2) {
  http_response_code(400); echo json_encode(['error'=>'Invalid path']); exit();
}
$filePath = UPLOAD_DIR . $path;
if (!is_file($filePath)) { http_response_code(404); echo json_encode(['error'=>'Not found']); exit(); }
if (!unlink($filePath)) { http_response_code(500); echo json_encode(['error'=>'Delete failed']); exit(); }
echo json_encode(['success'=>true]);
