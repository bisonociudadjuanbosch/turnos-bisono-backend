// index.js (en la raíz del proyecto)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'clave-ultra-secreta-bisono';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const usuariosPath = path.join(__dirname, 'usuarios.json');
const turnosPath = path.join(__dirname, 'turnos.json');

let usuarios = fs.existsSync(usuariosPath) ? JSON.parse(fs.readFileSync(usuariosPath, 'utf8')) : [];
let turnos = fs.existsSync(turnosPath) ? JSON.parse(fs.readFileSync(turnosPath, 'utf8')) : [];

// Ruta principal para verificar el estado de la API
app.get('/', (req, res) => {
  res.send('API funcionando con CORS');
});

// Ruta para registrar nuevos usuarios
app.post('/register', async (req, res) => {
  const { usuario, clave } = req.body;

  // Verificar si el usuario ya existe
  if (usuarios.some(u => u.usuario === usuario)) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }

  // Encriptar la contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(clave, salt);

  // Crear nuevo usuario
  const nuevoUsuario = { usuario, clave: hashedPassword };
  usuarios.push(nuevoUsuario);
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
});

// Ruta para login de operadores
app.post('/login', (req, res) => {
  const { usuario, clave } = req.body;

  const usuarioEncontrado = usuarios.find(u => u.usuario === usuario);
  if (!usuarioEncontrado) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  bcrypt.compare(clave, usuarioEncontrado.clave, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ usuario: usuarioEncontrado.usuario }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token });
  });
});

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

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(403).json({ error: 'Token requerido' });

  jwt.verify(token, SECRET_KEY, (err, usuario) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

app.listen(PORT, () => {
  console.log(`✅ Backend en http://localhost:${PORT}`);
});
