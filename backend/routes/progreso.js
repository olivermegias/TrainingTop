const express = require("express");
const router = express.Router();
const Entrenamiento = require("../models/Entrenamientos");
const Ejercicio = require("../models/Ejercicios");

// Obtener progreso de ejercicios específicos
router.get("/ejercicios/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limite = 10 } = req.query;

    // Obtener todos los entrenamientos del usuario
    const entrenamientos = await Entrenamiento.find({ usuarioId }).sort({
      fechaInicio: -1,
    });

    // Agrupar ejercicios por ejercicioId para analizar progreso
    const ejerciciosMap = {};

    for (const entrenamiento of entrenamientos) {
      for (const ejercicio of entrenamiento.ejercicios) {
        let ejercicioMapId = ejercicio.ejercicioId;

        // Si parece un ObjectId válido, intentamos buscar el campo 'id'
        if (ejercicioMapId.match(/^[0-9a-fA-F]{24}$/)) {
          const ejercicioDoc = await Ejercicio.findById(ejercicioMapId);
          if (ejercicioDoc && ejercicioDoc.id) {
            ejercicioMapId = ejercicioDoc.id;
          }
        }

        if (!ejerciciosMap[ejercicioMapId]) {
          ejerciciosMap[ejercicioMapId] = {
            ejercicioId: ejercicioMapId,
            historico: [],
          };
        }

        const pesosValidos = ejercicio.series
          .filter((s) => s.completada && s.peso > 0)
          .map((s) => s.peso);

        if (pesosValidos.length > 0) {
          ejerciciosMap[ejercicioMapId].historico.push({
            fecha: entrenamiento.fechaInicio,
            pesoMaximo: Math.max(...pesosValidos),
            pesoPromedio:
              pesosValidos.reduce((a, b) => a + b, 0) / pesosValidos.length,
            repeticionesPromedio:
              ejercicio.series
                .filter((s) => s.completada)
                .reduce((sum, s) => sum + s.repeticiones, 0) /
              ejercicio.series.filter((s) => s.completada).length,
            valoracion: ejercicio.valoracion,
            rutinaNombre: entrenamiento.nombreRutina,
          });
        }
      }
    }

    // Filtrar ejercicios con al menos 2 entrenamientos para mostrar progreso
    const ejerciciosConProgreso = [];

    for (const [ejercicioId, data] of Object.entries(ejerciciosMap)) {
      console.log(`Procesando ejercicio: ${ejercicioId}, datos:`, data);
      if (data.historico.length >= 2) {
        // CORRECCIÓN: Buscar por el campo 'id' en lugar de '_id'
        let ejercicioInfo = await Ejercicio.findOne({ id: ejercicioId });

        // Si no se encuentra por 'id' y es un ObjectId válido, buscar por '_id'
        if (!ejercicioInfo && ejercicioId.match(/^[0-9a-fA-F]{24}$/)) {
          ejercicioInfo = await Ejercicio.findById(ejercicioId);
        }

        if (ejercicioInfo) {
          // Calcular tendencia
          const historico = data.historico.sort((a, b) => a.fecha - b.fecha);
          const primerPeso = historico[0].pesoMaximo;
          const ultimoPeso = historico[historico.length - 1].pesoMaximo;
          const progresoPorcentaje = (
            ((ultimoPeso - primerPeso) / primerPeso) *
            100
          ).toFixed(1);

          ejerciciosConProgreso.push({
            ejercicioId,
            nombre: ejercicioInfo.nombre,
            categoria: ejercicioInfo.categoria,
            musculosPrimarios: ejercicioInfo.musculosPrimarios,
            historico: historico.slice(-limite), // Últimos N registros
            progresoPorcentaje: parseFloat(progresoPorcentaje),
            tendencia:
              ultimoPeso > primerPeso
                ? "mejora"
                : ultimoPeso < primerPeso
                ? "baja"
                : "estable",
          });
        }
      }
    }

    // Ordenar por mayor progreso
    ejerciciosConProgreso.sort(
      (a, b) => b.progresoPorcentaje - a.progresoPorcentaje
    );

    res.json({
      success: true,
      ejercicios: ejerciciosConProgreso.slice(0, limite),
    });
  } catch (error) {
    console.error("Error al obtener progreso de ejercicios:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener progreso de ejercicios",
    });
  }
});

// Obtener progreso por rutina
router.get("/rutinas/:usuarioId/:rutinaId", async (req, res) => {
  try {
    const { usuarioId, rutinaId } = req.params;

    const entrenamientos = await Entrenamiento.find({
      usuarioId,
      rutinaId,
    }).sort({ fechaInicio: 1 });

    // Obtener la información de la rutina
    const Rutina = require("../models/Rutinas");
    const rutina = await Rutina.findById(rutinaId);

    if (entrenamientos.length === 0) {
      return res.json({
        success: true,
        progreso: null,
        mensaje: "No hay entrenamientos para esta rutina",
      });
    }

    // Calcular métricas de progreso
    const progresoPorDia = {};

    // Inicializar con información de la rutina
    if (rutina && rutina.dias) {
      rutina.dias.forEach((dia, index) => {
        progresoPorDia[index] = {
          nombreDia: dia.nombre,
          ejerciciosRutina: dia.ejercicios,
          entrenamientos: 0,
          duracionPromedio: 0,
          satisfaccionPromedio: 0,
          esfuerzoPromedio: 0,
          dificultadPromedio: 0,
          pesoTotalPromedio: 0,
          fechas: [],
        };
      });
    }

    entrenamientos.forEach((entrenamiento) => {
      const dia = entrenamiento.diaEntrenamiento;

      if (!progresoPorDia[dia]) {
        progresoPorDia[dia] = {
          nombreDia: `Día ${dia + 1}`,
          ejerciciosRutina: [],
          entrenamientos: 0,
          duracionPromedio: 0,
          satisfaccionPromedio: 0,
          esfuerzoPromedio: 0,
          pesoTotalPromedio: 0,
          fechas: [],
        };
      }

      progresoPorDia[dia].entrenamientos++;
      progresoPorDia[dia].duracionPromedio += entrenamiento.duracion;
      progresoPorDia[dia].fechas.push(entrenamiento.fechaInicio);

      // Calcular promedios de valoraciones
      let totalSatisfaccion = 0,
        totalEsfuerzo = 0,
        totalPeso = 0,
      totalDificultad = 0;
      let contadorValoraciones = 0,
        contadorPesos = 0;

      entrenamiento.ejercicios.forEach((ejercicio) => {
        if (ejercicio.valoracion) {
          totalSatisfaccion += ejercicio.valoracion.satisfaccion;
          totalEsfuerzo += ejercicio.valoracion.esfuerzo;
          totalDificultad += ejercicio.valoracion.dificultad;
          contadorValoraciones++;
        }

        ejercicio.series.forEach((serie) => {
          if (serie.completada && serie.peso > 0) {
            totalPeso += serie.peso;
            contadorPesos++;
          }
        });
      });

      if (contadorValoraciones > 0) {
        progresoPorDia[dia].satisfaccionPromedio +=
          totalSatisfaccion / contadorValoraciones;
        progresoPorDia[dia].esfuerzoPromedio +=
          totalEsfuerzo / contadorValoraciones;
        progresoPorDia[dia].dificultadPromedio +=
          totalDificultad / contadorValoraciones;
      }

      if (contadorPesos > 0) {
        progresoPorDia[dia].pesoTotalPromedio += totalPeso / contadorPesos;
      }
    });

    // Calcular promedios finales
    Object.keys(progresoPorDia).forEach((dia) => {
      const data = progresoPorDia[dia];
      if (data.entrenamientos > 0) {
        data.duracionPromedio = Math.round(
          data.duracionPromedio / data.entrenamientos
        );
        data.satisfaccionPromedio = (
          data.satisfaccionPromedio / data.entrenamientos
        ).toFixed(1);
        data.esfuerzoPromedio = (
          data.esfuerzoPromedio / data.entrenamientos
        ).toFixed(1);
        data.dificultadPromedio = (
          data.dificultadPromedio / data.entrenamientos
        ).toFixed(1);
        data.pesoTotalPromedio = (
          data.pesoTotalPromedio / data.entrenamientos
        ).toFixed(1);
      }
    });

    res.json({
      success: true,
      progreso: {
        totalEntrenamientos: entrenamientos.length,
        primerEntrenamiento: entrenamientos[0].fechaInicio,
        ultimoEntrenamiento:
          entrenamientos[entrenamientos.length - 1].fechaInicio,
        progresoPorDia,
        historicoGeneral: entrenamientos.map((e) => ({
          fecha: e.fechaInicio,
          duracion: e.duracion,
          dia: e.diaEntrenamiento,
        })),
      },
    });
  } catch (error) {
    console.error("Error al obtener progreso de rutina:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener progreso de rutina",
    });
  }
});

// Obtener estadísticas por grupo muscular
router.get("/musculos/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const entrenamientos = await Entrenamiento.find({ usuarioId })
      .sort({ fechaInicio: -1 })
      .limit(30); // Últimos 30 entrenamientos

    const musculosStats = {};

    for (const entrenamiento of entrenamientos) {
      for (const ejercicio of entrenamiento.ejercicios) {
        // CORRECCIÓN: Buscar por el campo 'id' en lugar de '_id'
        let ejercicioInfo = await Ejercicio.findOne({
          id: ejercicio.ejercicioId,
        });

        // Si no se encuentra por 'id' y es un ObjectId válido, buscar por '_id'
        if (
          !ejercicioInfo &&
          ejercicio.ejercicioId.match(/^[0-9a-fA-F]{24}$/)
        ) {
          ejercicioInfo = await Ejercicio.findById(ejercicio.ejercicioId);
        }

        if (ejercicioInfo && ejercicioInfo.musculosPrimarios) {
          for (const musculo of ejercicioInfo.musculosPrimarios) {
            if (!musculosStats[musculo]) {
              musculosStats[musculo] = {
                nombre: musculo,
                totalEjercicios: 0,
                totalSeries: 0,
                totalRepeticiones: 0,
                pesoMaximo: 0,
                satisfaccionPromedio: 0,
                contadorValoraciones: 0,
              };
            }

            musculosStats[musculo].totalEjercicios++;
            musculosStats[musculo].totalSeries += ejercicio.series.filter(
              (s) => s.completada
            ).length;

            ejercicio.series.forEach((serie) => {
              if (serie.completada) {
                musculosStats[musculo].totalRepeticiones += serie.repeticiones;
                if (serie.peso > musculosStats[musculo].pesoMaximo) {
                  musculosStats[musculo].pesoMaximo = serie.peso;
                }
              }
            });

            if (ejercicio.valoracion) {
              musculosStats[musculo].satisfaccionPromedio +=
                ejercicio.valoracion.satisfaccion;
              musculosStats[musculo].contadorValoraciones++;
            }
          }
        }
      }
    }

    // Calcular promedios y formatear resultado
    const resultado = Object.values(musculosStats)
      .map((musculo) => ({
        ...musculo,
        satisfaccionPromedio:
          musculo.contadorValoraciones > 0
            ? (
                musculo.satisfaccionPromedio / musculo.contadorValoraciones
              ).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.totalEjercicios - a.totalEjercicios)
      .slice(0, 6); // Top 6 grupos musculares

    res.json({
      success: true,
      musculos: resultado,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas por músculo:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas por músculo",
    });
  }
});

module.exports = router;
