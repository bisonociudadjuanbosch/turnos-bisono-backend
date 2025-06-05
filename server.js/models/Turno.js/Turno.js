const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
  numero: String,
  telefono: String,
  estado: {
    type: String,
    default: 'Pendiente',
    enum: ['Pendiente', 'Visitando Apartamentos Modelo', 'Precalificando con el Banco', 'OK', 'En Proceso', 'Finalizado']
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Turno', turnoSchema);