const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Servir la aplicación web y los archivos subidos desde el mismo servidor
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de subida de archivos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Obtener todas las notas
app.get('/notas', (req, res) => {
  db.all('SELECT * FROM notas', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Crear una nueva nota con texto y archivo PDF
app.post('/notas', upload.single('pdf'), (req, res) => {
  const { texto } = req.body;
  const pdf = req.file ? req.file.filename : null;

  db.run('INSERT INTO notas (texto, pdf) VALUES (?, ?)', [texto, pdf], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, texto, pdf });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
