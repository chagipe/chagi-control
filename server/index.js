const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const app = express();

app.use(cors({ 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
})); 

app.use(express.json());

// 1. OBTENER TICKETS (Trae la fecha de creación)
app.get('/tickets', async (req, res) => {
  try {
    // Si aún no has creado la columna fecha_creacion, recuerda ejecutar el ALTER TABLE en pgAdmin
    const result = await pool.query('SELECT * FROM tickets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error en DB:", err.message);
    res.status(500).json({ error: "Fallo en la conexión" });
  }
});

// 2. CREAR TICKET
app.post('/tickets', async (req, res) => {
  try {
    const { titulo, descripcion, prioridad } = req.body;
    const result = await pool.query(
      'INSERT INTO tickets (titulo, descripcion, prioridad, estado) VALUES ($1, $2, $3, $4) RETURNING *',
      [titulo, descripcion || '', prioridad || 'Media', 'Abierto']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al insertar" });
  }
});

// 3. ACTUALIZAR (FINALIZAR)
app.put('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tecnico_asignado } = req.body; 
    const result = await pool.query(
      'UPDATE tickets SET estado = $1, tecnico_asignado = $2 WHERE id = $3 RETURNING *',
      ['Resuelto', tecnico_asignado, id]
    );
    res.json({ message: "Atención guardada", ticket: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// 4. VACIAR (TRUNCATE)
app.delete('/tickets', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE tickets RESTART IDENTITY');
    res.json({ message: "Base de datos reseteada" });
  } catch (err) {
    res.status(500).json({ error: "Error al vaciar" });
  }
});

app.listen(3001, () => {
  console.log('🚀 CHAGICONTROL V3.0 - SLA & SMART SEARCH ON');
});