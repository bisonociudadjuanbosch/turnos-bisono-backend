const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { enviarMensajeWhatsApp } = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const archivoTurnos = './turnos.json';

// Leer datos desde JSON
function leerTurnos() {
  if (!fs.existsSync(archivoTurnos)) fs.writeFileSync(archivoTurnos, '[]');
  return JSON.parse(fs.readFileSync(archivoTurnos));
}

// Guardar datos en JSON
function guardarTurnos(turnos) {
  fs.writeFileSync(archivoTurnos, JSON.stringify(turnos, null, 2));
}

// 1. Crear nuevo turno
app.post('/', (req, res) => {
  const { numero, telefono } = req.body;
  const turnos = leerTurnos();
  turnos.push({
    id: Date.now(),
    numero,
    telefono,
    estado: 'Pendiente',
    creado: new Date().toISOString()
  });
  guardarTurnos(turnos);
  res.json({ mensaje: 'Turno registrado' });
});

// 2. Obtener lista de turnos
app.get('/turnos', (req, res) => {
  const turnos = leerTurnos();
  res.json(turnos);
});

// 3. Cambiar estado de un turno
app.patch('/turnos/:id', async (req, res) => {
  const turnos = leerTurnos();
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  const index = turnos.findIndex(t => t.id == id);
  if (index === -1) return res.status(404).json({ mensaje: 'Turno no encontrado' });

  const estadoAnterior = turnos[index].estado;
  turnos[index].estado = nuevoEstado;
  guardarTurnos(turnos);

  // Si pasa de "Pendiente" a otro estado, enviar mensaje al siguiente pendiente
  if (estadoAnterior === 'Pendiente' && nuevoEstado !== 'Pendiente') {
    const siguiente = turnos.find(t => t.estado === 'Pendiente');
    if (siguiente && siguiente.telefono) {
      await enviarMensajeWhatsApp(siguiente.telefono, '¡Es tu turno! Por favor pasa con el Oficial de Ventas Bisono.');
    }
  }

  res.json({ mensaje: 'Estado actualizado' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});