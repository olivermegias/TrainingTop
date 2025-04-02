const mongoose = require("mongoose");

const EjercicioSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  fuerza: { type: String },
  nivel: { type: String },
  mecanica: { type: String },
  equipo: { type: String },
  musculosPrimarios: { type: [String] },
  musculosSecundarios: { type: [String] },
  instrucciones: { type: [String] },
  categoria: { type: String },
  imagenes: { type: [String] },
});

module.exports = mongoose.model("Ejercicio", EjercicioSchema);