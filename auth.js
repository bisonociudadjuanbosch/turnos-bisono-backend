const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'clave-ultra-secreta-bisono';

let usuarios = [
  { usuario: 'operador1', clave: '$2a$10$V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5' }, // Contraseña: '1234'
  { usuario: 'admin', clave: '$2a$10$V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5g1V1K5' } // Contraseña: 'admin123'
];

function loginRoute(app) {
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

module.exports = { loginRoute, verificarToken };
