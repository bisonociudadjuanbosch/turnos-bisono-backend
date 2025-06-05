// index.js (en la raíz del proyecto)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'clave-ultra-secreta-bisono';

app.use(cors());
app.use(express.json());

// Ruta para registrar nuevos usuarios
app.post('/register', async (req, res) => {
  const { usuario, clave } = req.body;
  const usuariosPath = path.join(__dirname, 'usuarios.json');
  let usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));

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
  const usuariosPath = path.join(__dirname, 'usuarios.json');
  let usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));

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
  // Lógica para obtener turnos
});

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