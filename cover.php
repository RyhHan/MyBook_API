<?php
header('Content-Type: image/jpeg');

$id = isset($_GET['id']) ? $_GET['id'] : null;

if ($id) {
    $file = "covers/$id.jpg";
    if (file_exists($file)) {
        readfile($file);
    } else {
        // Mengembalikan gambar default jika cover tidak ditemukan
        readfile("covers/default.jpg");
    }
} else {
    // Mengembalikan gambar default jika ID tidak diberikan
    readfile("covers/default.jpg");
}
?> 