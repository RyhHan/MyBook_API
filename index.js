require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = process.env.PORT || 8080;

// Konfigurasi Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Buku',
      version: '1.0.0',
      description: 'API untuk manajemen buku',
    },
    servers: [
      {
        url: 'https://api-buku-production.up.railway.app',
        description: 'Railway Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./index.js'], // Path ke file yang berisi anotasi
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, accept');
    next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Tambahkan middleware untuk menangani preflight requests
app.options('*', cors());

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
/**
 * @swagger
 * /buku:
 *   get:
 *     summary: Mendapatkan semua buku
 *     tags: [Buku]
 *     responses:
 *       200:
 *         description: Daftar buku berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   judul:
 *                     type: string
 *                   deskripsi:
 *                     type: string
 *                   author:
 *                     type: string
 *                   coverId:
 *                     type: string
 *                   progres:
 *                     type: string
 *                     enum: [belum_baca, sedang_baca, sudah_baca]
 */
app.get('/buku', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM buku');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * @swagger
 * /buku:
 *   post:
 *     summary: Menambahkan buku baru
 *     tags: [Buku]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               author:
 *                 type: string
 *               cover:
 *                 type: string
 *                 format: binary
 *               progres:
 *                 type: string
 *                 enum: [belum_baca, sedang_baca, sudah_baca]
 *     responses:
 *       200:
 *         description: Buku berhasil ditambahkan
 */
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

/**
 * @swagger
 * /buku/{id}:
 *   put:
 *     summary: Mengupdate buku
 *     tags: [Buku]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *               author:
 *                 type: string
 *               progres:
 *                 type: string
 *                 enum: [belum_baca, sedang_baca, sudah_baca]
 *     responses:
 *       200:
 *         description: Buku berhasil diupdate
 */
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

/**
 * @swagger
 * /buku/{id}:
 *   delete:
 *     summary: Menghapus buku
 *     tags: [Buku]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Buku berhasil dihapus
 */
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

/**
 * @swagger
 * /cover/{id}:
 *   get:
 *     summary: Mendapatkan cover buku
 *     tags: [Cover]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File cover buku
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
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