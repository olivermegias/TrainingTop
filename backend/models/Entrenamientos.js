const mongoose = require("mongoose");

const SerieSchema = new mongoose.Schema({
  peso: { type: Number, default: 0 },
  repeticiones: { type: Number, required: true },
  completada: { type: Boolean, default: false },
  saltada: { type: Boolean, default: false },
});

const ValoracionSchema = new mongoose.Schema({
  satisfaccion: { type: Number, min: 1, max: 5, default: 3 },
  esfuerzo: { type: Number, min: 1, max: 5, default: 3 },
  dificultad: { type: Number, min: 1, max: 5, default: 3 },
  notas: { type: String, default: "" },
});

const EjercicioEntrenamientoSchema = new mongoose.Schema({
  ejercicioId: { type: String, required: true },
  series: [SerieSchema],
  seriesSaltadas: { type: Number, default: 0 },
  valoracion: { type: ValoracionSchema, default: null },
  duracion: { type: Number, default: 0 }, // duración total del ejercicio en segundos
});

const EntrenamientoSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true, index: true },
  rutinaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rutina",
    required: true,
  },
  nombreRutina: { type: String, required: true },
  diaEntrenamiento: { type: Number, required: true },
  ejercicios: [EjercicioEntrenamientoSchema],
  duracion: { type: Number, required: true }, // duración total en segundos
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  completado: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  analisisIA: {
    analisis: {
      type: String,
      default: null,
    },
    metricas: {
      porcentajeCompletado: Number,
      promedioSatisfaccion: String,
      promedioEsfuerzo: String,
      promedioDificultad: String,
      totalSeriesCompletadas: Number,
      totalSeriesSaltadas: Number,
    },
    ejerciciosRecomendados: [
      {
        nombre: String,
        musculos: [String],
        nivel: String,
      },
    ],
    timestamp: Date,
  },
});

// Índices para mejorar las consultas
EntrenamientoSchema.index({ usuarioId: 1, fechaInicio: -1 });
EntrenamientoSchema.index({ rutinaId: 1, usuarioId: 1 });

module.exports = mongoose.model("Entrenamiento", EntrenamientoSchema);
