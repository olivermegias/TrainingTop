const mongoose = require("mongoose");

const RutinaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  nivel: { type: Number, required: true },
  publica: { type: Boolean, default: false },
  dias: [
    {
      nombre: { type: String, required: true },
      ejercicios: [
        {
          ejercicio: { type: String, required: true }, // Guardamos el `id` del ejercicio, no `_id`
          series: { type: Number, required: true },
          repeticiones: { type: Number, required: true },
          descanso: { type: Number, required: true }
        }
      ]
    }
  ],
}, { versionKey: false });

module.exports = mongoose.model("Rutina", RutinaSchema);
