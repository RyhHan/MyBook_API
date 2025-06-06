require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/covers', express.static('covers'));

// Konfigurasi upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'covers';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Konfigurasi database
const pool = mysql.createPool({
    uri: 'mysql://root:jadLGhZFBKyWVuDTJJacdJmIxeFqqiXT@trolley.proxy.rlwy.net:36432/railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Routes
// GET semua buku
app.get('/buku', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM buku');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST buku baru
app.post('/buku', upload.single('cover'), async (req, res) => {
    try {
        const { judul, deskripsi, author, progres } = req.body;
        const coverId = req.file ? req.file.filename : null;

        const [result] = await pool.query(
            'INSERT INTO buku (judul, deskripsi, author, coverId, progres) VALUES (?, ?, ?, ?, ?)',
            [judul, deskripsi, author, coverId, progres]
        );

        res.json({ status: 'success', id: result.insertId });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT update buku
app.put('/buku/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, deskripsi, author, progres } = req.body;

        await pool.query(
            'UPDATE buku SET judul = ?, deskripsi = ?, author = ?, progres = ? WHERE id = ?',
            [judul, deskripsi, author, progres, id]
        );

        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE buku
app.delete('/buku/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Ambil informasi cover sebelum menghapus
        const [rows] = await pool.query('SELECT coverId FROM buku WHERE id = ?', [id]);
        
        // Hapus file cover jika ada
        if (rows[0]?.coverId) {
            const coverPath = path.join(__dirname, 'covers', rows[0].coverId);
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
            }
        }

        await pool.query('DELETE FROM buku WHERE id = ?', [id]);
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET cover buku
app.get('/cover/:id', (req, res) => {
    const { id } = req.params;
    const coverPath = path.join(__dirname, 'covers', id);
    
    if (fs.existsSync(coverPath)) {
        res.sendFile(coverPath);
    } else {
        res.status(404).send('Cover tidak ditemukan');
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
}); 