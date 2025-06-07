const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Servir la carpeta de uploads directamente para acceder a los PDFs por URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Servir la aplicación web y los archivos subidos desde el mismo servidor
app.use(express.static(path.join(__dirname, '..')));

// Configuración de subida de archivos
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '');
    cb(null, `${Date.now()}_${safeName}`);
  }
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
  const pdf = req.file ? path.posix.join('uploads', req.file.filename) : null;

  db.run('INSERT INTO notas (texto, pdf) VALUES (?, ?)', [texto, pdf], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, texto, pdf });
  });
});

// Eliminar una nota y su PDF
app.delete('/notas/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT pdf FROM notas WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Nota no encontrada' });

    const pdfPath = row.pdf ? path.join(__dirname, row.pdf) : null;

    db.run('DELETE FROM notas WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      if (pdfPath) {
        fs.unlink(pdfPath, (fsErr) => {
          if (fsErr && fsErr.code !== 'ENOENT') {
            console.error('Error al eliminar archivo:', fsErr);
          }
        });
      }

      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
