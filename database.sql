CREATE DATABASE IF NOT EXISTS db_buku;
USE db_buku;

CREATE TABLE IF NOT EXISTS buku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    author VARCHAR(255) NOT NULL,
    coverId VARCHAR(255),
    progres ENUM('belum_baca', 'sedang_baca', 'sudah_baca') DEFAULT 'belum_baca',
    email VARCHAR(255) NOT NULL,
    isPublic BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_isPublic (isPublic),
    INDEX idx_progres (progres)
); 