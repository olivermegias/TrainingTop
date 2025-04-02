const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now },
  rutinas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rutina" }] // Rutinas personales del usuario
});

module.exports = mongoose.model("Usuario", UsuarioSchema);
