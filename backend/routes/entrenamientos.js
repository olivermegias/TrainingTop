const express = require("express");
const Entrenamiento = require("../models/Entrenamientos");
const Usuario = require("../models/Usuarios");
const Rutina = require("../models/Rutinas");
const router = express.Router();

// 📌 Crear un nuevo entrenamiento
router.post("/", async (req, res) => {
  try {
    console.log("🏋️ Petición POST recibida en /entrenamientos");
    console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2));

    const {
      usuarioId,
      rutinaId,
      nombreRutina,
      diaEntrenamiento,
      ejercicios,
      duracion,
      fechaInicio,
      fechaFin,
      completado,
      analisisIA
    } = req.body;

    // Validaciones básicas
    if (!usuarioId || !rutinaId || !ejercicios || !Array.isArray(ejercicios)) {
      return res.status(400).json({
        error: "Faltan datos obligatorios",
        datosRecibidos: { usuarioId, rutinaId, tieneEjercicios: !!ejercicios },
      });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findOne({ uid: usuarioId });
    if (!usuario) {
      console.log("❌ Usuario no encontrado con uid:", usuarioId);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la rutina existe
    const rutina = await Rutina.findById(rutinaId);
    if (!rutina) {
      console.log("❌ Rutina no encontrada con ID:", rutinaId);
      return res.status(404).json({ error: "Rutina no encontrada" });
    }

    // Crear el nuevo entrenamiento
    const nuevoEntrenamiento = new Entrenamiento({
      usuarioId,
      rutinaId,
      nombreRutina,
      diaEntrenamiento,
      ejercicios: ejercicios.map((ej) => ({
        ejercicioId: ej.ejercicioId,
        series: ej.series || [],
        seriesSaltadas: ej.seriesSaltadas || 0,
        valoracion: ej.valoracion || null,
        duracion: ej.duracion || 0,
      })),
      duracion,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      completado: completado !== false,
      analisisIA: analisisIA || null,
    });

    console.log("💾 Guardando entrenamiento...");
    const entrenamientoGuardado = await nuevoEntrenamiento.save();
    console.log("✅ Entrenamiento guardado con ID:", entrenamientoGuardado._id);

    // Actualizar estadísticas del usuario (opcional)
    if (!usuario.estadisticas) {
      usuario.estadisticas = {
        entrenamientosCompletados: 0,
        tiempoTotalEntrenado: 0,
      };
    }

    usuario.estadisticas.entrenamientosCompletados += 1;
    usuario.estadisticas.tiempoTotalEntrenado += duracion;
    usuario.estadisticas.ultimoEntrenamiento = new Date();

    let progreso = usuario.progresoRutinas.find(
      (p) => p.rutinaId.toString() === rutinaId
    );

    if (progreso) {
      // Actualizar día actual al siguiente
      const totalDias = rutina.dias.length;
      progreso.diaActual = (diaEntrenamiento + 1) % totalDias;
      progreso.ultimaEjecucion = new Date();
    } else {
      // Crear nuevo progreso
      usuario.progresoRutinas.push({
        rutinaId,
        diaActual: (diaEntrenamiento + 1) % rutina.dias.length,
        ultimaEjecucion: new Date(),
      });
    }

    await usuario.save();
    console.log("✅ Estadísticas del usuario actualizadas");

    res.status(201).json({
      message: "Entrenamiento guardado correctamente",
      entrenamiento: entrenamientoGuardado,
      estadisticasActualizadas: usuario.estadisticas,
    });
  } catch (error) {
    console.error("❌ Error al guardar entrenamiento:", error);
    res.status(500).json({
      error: "Error al guardar el entrenamiento",
      detalles: error.message,
    });
  }
});

// 📌 Obtener entrenamientos de un usuario
router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 10, pagina = 1 } = req.query;

    const entrenamientos = await Entrenamiento.find({ usuarioId })
      .sort({ fechaInicio: -1 })
      .limit(limite * 1)
      .skip((pagina - 1) * limite)
      .populate("rutinaId", "nombre nivel");

    const total = await Entrenamiento.countDocuments({ usuarioId });

    res.json({
      entrenamientos,
      paginacion: {
        total,
        pagina: parseInt(pagina),
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener entrenamientos:", error);
    res.status(500).json({ error: "Error al obtener entrenamientos" });
  }
});

// 📌 Obtener estadísticas de entrenamientos
router.get("/estadisticas/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { periodo = "mes" } = req.query;

    // Calcular fecha de inicio según el periodo
    const fechaInicio = new Date();
    if (periodo === "semana") {
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    } else if (periodo === "mes") {
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
    } else if (periodo === "año") {
      fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
    }

    const entrenamientos = await Entrenamiento.find({
      usuarioId,
      fechaInicio: { $gte: fechaInicio },
    });

    // Calcular estadísticas
    const estadisticas = {
      totalEntrenamientos: entrenamientos.length,
      tiempoTotal: entrenamientos.reduce((sum, e) => sum + e.duracion, 0),
      promedioSatisfaccion: 0,
      promedioEsfuerzo: 0,
      ejerciciosCompletados: 0,
      seriesCompletadas: 0,
    };

    let totalValoraciones = 0;
    let sumaSatisfaccion = 0;
    let sumaEsfuerzo = 0;

    entrenamientos.forEach((entrenamiento) => {
      entrenamiento.ejercicios.forEach((ejercicio) => {
        estadisticas.ejerciciosCompletados++;
        estadisticas.seriesCompletadas += ejercicio.series.length;

        if (ejercicio.valoracion) {
          totalValoraciones++;
          sumaSatisfaccion += ejercicio.valoracion.satisfaccion;
          sumaEsfuerzo += ejercicio.valoracion.esfuerzo;
        }
      });
    });

    if (totalValoraciones > 0) {
      estadisticas.promedioSatisfaccion = (
        sumaSatisfaccion / totalValoraciones
      ).toFixed(1);
      estadisticas.promedioEsfuerzo = (
        sumaEsfuerzo / totalValoraciones
      ).toFixed(1);
    }

    res.json({ estadisticas, periodo });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// 📌 Obtener detalles de un entrenamiento específico
router.get("/:id", async (req, res) => {
  try {
    const entrenamiento = await Entrenamiento.findById(req.params.id).populate(
      "rutinaId"
    );

    if (!entrenamiento) {
      return res.status(404).json({ error: "Entrenamiento no encontrado" });
    }

    res.json(entrenamiento);
  } catch (error) {
    console.error("Error al obtener entrenamiento:", error);
    res.status(500).json({ error: "Error al obtener entrenamiento" });
  }
});

router.get("/rutinas-entrenadas/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Obtener todas las rutinas únicas con las que ha entrenado
    const rutinasEntrenadas = await Entrenamiento.aggregate([
      { $match: { usuarioId } },
      {
        $group: {
          _id: "$rutinaId",
          nombreRutina: { $first: "$nombreRutina" },
          totalEntrenamientos: { $sum: 1 },
          ultimoEntrenamiento: { $max: "$fechaInicio" },
          primerEntrenamiento: { $min: "$fechaInicio" },
        },
      },
      { $sort: { ultimoEntrenamiento: -1 } },
    ]);

    res.json({
      success: true,
      rutinas: rutinasEntrenadas,
    });
  } catch (error) {
    console.error("Error al obtener rutinas entrenadas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener rutinas entrenadas",
    });
  }
});

module.exports = router;
