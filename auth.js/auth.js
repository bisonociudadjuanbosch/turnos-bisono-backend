const jwt = require('jsonwebtoken');
const SECRET_KEY = 'clave-ultra-secreta-bisono';

// Lista de operadores autorizados
const operadores = [
  { usuario: 'operador1', clave: '1234' },
  { usuario: 'admin', clave: 'admin123' }
];

function loginRoute(app) {
  app.post('/login', (req, res) => {
    const { usuario, clave } = req.body;
    const encontrado = operadores.find(op => op.usuario === usuario && op.clave === clave);

    if (!encontrado) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token });
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
