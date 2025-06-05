const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { loginRoute, verificarToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const turnosPath = path.join(__dirname, 'turnos.json');
let turnos = fs.existsSync(turnosPath) ? JSON.parse(fs.readFileSync(turnosPath, 'utf8')) : [];

// Ruta para registrar turnos desde frontend
app.post('/', (req, res) => {
  const nuevoTurno = {
    id: turnos.length + 1,
    numero: req.body.numero,
    telefono: req.body.telefono || '',
    estado: 'Pendiente'
  };
  turnos.push(nuevoTurno);
  fs.writeFileSync(turnosPath, JSON.stringify(turnos, null, 2));
  res.json(nuevoTurno);
});

// Login para operadores
loginRoute(app);

// Rutas protegidas
app.get('/turnos', verificarToken, (req, res) => {
  res.json(turnos);
});

app.patch('/turnos/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  const index = turnos.findIndex(t => t.id == id);
  if (index === -1) return res.status(404).json({ error: 'Turno no encontrado' });

  turnos[index].estado = nuevoEstado;

  // Si cambia de Pendiente a otro estado, avisamos al siguiente
  if (nuevoEstado !== 'Pendiente') {
    const siguiente = turnos.find((t, i) => i > index && t.estado === 'Pendiente');
    if (siguiente && siguiente.telefono) {
      await enviarWhatsApp(siguiente.telefono, '¡Es tu turno! Por favor pasa con el Oficial de Ventas Bisonó.');
    }
  }

  fs.writeFileSync(turnosPath, JSON.stringify(turnos, null, 2));
  res.json(turnos[index]);
});

async function enviarWhatsApp(telefono, mensaje) {
  console.log(`Enviando WhatsApp a ${telefono}: ${mensaje}`);
  // Aquí puedes conectar con tu API real más adelante.
}

app.listen(PORT, () => {
  console.log(`✅ Backend en http://localhost:${PORT}`);
});