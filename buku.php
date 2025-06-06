<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Konfigurasi database
$host = 'localhost';
$dbname = 'db_buku';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Koneksi database gagal']);
    exit();
}

// Mendapatkan method request
$method = $_SERVER['REQUEST_METHOD'];

// Mendapatkan header Authorization
$headers = getallheaders();
$authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';

switch($method) {
    case 'GET':
        // Mengambil data buku
        $stmt = $pdo->query("SELECT * FROM buku");
        $buku = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($buku);
        break;

    case 'POST':
        // Menyimpan data buku baru
        if(isset($_FILES['cover'])) {
            $cover = $_FILES['cover'];
            $coverId = uniqid();
            move_uploaded_file($cover['tmp_name'], "covers/$coverId.jpg");
        } else {
            $coverId = null;
        }

        $judul = $_POST['judul'];
        $deskripsi = $_POST['deskripsi'];
        $author = $_POST['author'];
        $progres = $_POST['progres'];

        $stmt = $pdo->prepare("INSERT INTO buku (judul, deskripsi, author, coverId, progres) VALUES (?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$judul, $deskripsi, $author, $coverId, $progres]);
            echo json_encode(['status' => 'success']);
        } catch(PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Update data buku
        parse_str(file_get_contents("php://input"), $_PUT);
        $id = $_PUT['id'];
        $judul = $_PUT['judul'];
        $deskripsi = $_PUT['deskripsi'];
        $author = $_PUT['author'];
        $progres = $_PUT['progres'];

        $stmt = $pdo->prepare("UPDATE buku SET judul = ?, deskripsi = ?, author = ?, progres = ? WHERE id = ?");
        try {
            $stmt->execute([$judul, $deskripsi, $author, $progres, $id]);
            echo json_encode(['status' => 'success']);
        } catch(PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Menghapus data buku
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM buku WHERE id = ?");
        try {
            $stmt->execute([$id]);
            echo json_encode(['status' => 'success']);
        } catch(PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
}
?> 