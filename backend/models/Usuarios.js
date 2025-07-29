const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now },
  rutinas: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rutina" }],
  rutinaActiva: { type: mongoose.Schema.Types.ObjectId, ref: "Rutina", default: null },
  progresoRutinas: [{
    rutinaId: { type: mongoose.Schema.Types.ObjectId, ref: "Rutina" },
    diaActual: { type: Number, default: 0 },
    ultimaEjecucion: { type: Date }
  }],
  estadisticas: {
    entrenamientosCompletados: { type: Number, default: 0 },
    tiempoTotalEntrenado: { type: Number, default: 0 },
    ultimoEntrenamiento: { type: Date }
  }
});

module.exports = mongoose.model("Usuario", UsuarioSchema);
