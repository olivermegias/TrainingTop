const express = require("express");
const router = express.Router();
const { ollamaService } = require("../services/ollama.service");
const Entrenamiento = require("../models/Entrenamientos");

// Función auxiliar para obtener historial
async function getWorkoutHistory(userId, limit = 3) {
  try {
    console.log("📚 Obteniendo historial del usuario...");
    const workouts = await Entrenamiento.find({ usuarioId: userId })
      .sort({ fechaInicio: -1 })
      .limit(limit)
      .select("fechaInicio duracion ejercicios");

    return workouts.map((w) => ({
      date: w.fechaInicio,
      duracion: w.duracion,
      totalEjercicios: w.ejercicios.length,
      totalSeries: w.ejercicios.reduce(
        (sum, e) => sum + (e.series?.length || 0),
        0
      ),
    }));
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }
}

// Función para calcular métricas
function calcularMetricasEntrenamiento(entrenamientoData) {
  let totalSatisfaccion = 0;
  let totalEsfuerzo = 0;
  let totalDificultad = 0;
  let totalSeriesCompletadas = 0;
  let totalSeriesSaltadas = 0;
  let pesoMaximo = 0;
  let totalRepeticiones = 0;
  let contadorEjercicios = 0;

  for (const ejercicio of entrenamientoData) {
    if (ejercicio?.valoracion) {
      totalSatisfaccion += ejercicio.valoracion.satisfaccion || 0;
      totalEsfuerzo += ejercicio.valoracion.esfuerzo || 0;
      totalDificultad += ejercicio.valoracion.dificultad || 0;
      contadorEjercicios++;
    }

    if (ejercicio?.series && Array.isArray(ejercicio.series)) {
      totalSeriesCompletadas += ejercicio.series.filter(
        (s) => s?.completada
      ).length;

      ejercicio.series.forEach((serie) => {
        if (serie.completada) {
          pesoMaximo = Math.max(pesoMaximo, serie.peso || 0);
          totalRepeticiones += serie.repeticiones || 0;
        }
      });
    }

    totalSeriesSaltadas += ejercicio?.seriesSaltadas || 0;
  }

  return {
    totalSeriesCompletadas,
    totalSeriesSaltadas,
    promedioSatisfaccion:
      contadorEjercicios > 0
        ? (totalSatisfaccion / contadorEjercicios).toFixed(1)
        : "0",
    promedioEsfuerzo:
      contadorEjercicios > 0
        ? (totalEsfuerzo / contadorEjercicios).toFixed(1)
        : "0",
    promedioDificultad:
      contadorEjercicios > 0
        ? (totalDificultad / contadorEjercicios).toFixed(1)
        : "0",
    porcentajeCompletado:
      totalSeriesCompletadas + totalSeriesSaltadas > 0
        ? Math.round(
            (totalSeriesCompletadas /
              (totalSeriesCompletadas + totalSeriesSaltadas)) *
              100
          )
        : 100,
    pesoMaximo,
    totalRepeticiones,
  };
}

// Función para generar prompt optimizado
function generarPromptOptimizado(
  entrenamientoData,
  ejerciciosRealizados,
  metricas,
  duracionTotal,
  rutinaInfo,
  historial
) {
  // Preparar datos de ejercicios de forma concisa
  const ejerciciosResumen = entrenamientoData
    .map((ej, idx) => {
      const info = ejerciciosRealizados?.[idx] || {};
      return `${info.nombre || ej.ejercicioId}: Satisf=${
        ej.valoracion?.satisfaccion || 0
      }/5, Esf=${ej.valoracion?.esfuerzo || 0}/5, Dific=${
        ej.valoracion?.dificultad || 0
      }/5, Tiempo=${ej.duracion}s, Series=${ej.series?.length || 0}/${
        (ej.series?.length || 0) + (ej.seriesSaltadas || 0)
      }`;
    })
    .join("\n");

  return `Analiza este entrenamiento de gimnasio y da recomendaciones específicas:

ENTRENAMIENTO:
Rutina: ${rutinaInfo?.nombre} (Día ${(rutinaInfo?.diaIndex || 0) + 1})
Duración: ${Math.round(duracionTotal / 60)} minutos
Historial: ${historial.length} entrenamientos previos

EJERCICIOS Y VALORACIONES:
${ejerciciosResumen}

MÉTRICAS GLOBALES:
- Satisfacción promedio: ${metricas.promedioSatisfaccion}/5
- Esfuerzo promedio: ${metricas.promedioEsfuerzo}/5
- Dificultad promedio: ${metricas.promedioDificultad}/5
- Series completadas: ${metricas.totalSeriesCompletadas}/${
    metricas.totalSeriesCompletadas + metricas.totalSeriesSaltadas
  }

INSTRUCCIONES (MUY IMPORTANTE):
1. Analiza CADA ejercicio individualmente
2. Para ejercicios con baja satisfacción (<3) o alta dificultad (>4), da consejos específicos
3. Si hay series saltadas, recomienda ajustes de peso
4. Sugiere progresión solo si satisfacción>=3 y dificultad<=3
5. Sé específico con números (ej: "reduce 5kg" o "añade 2 reps")
6. Máximo 4 párrafos en español
7. Usa emojis para hacer el texto más amigable

Da un análisis personalizado y motivador.`;
}

// Endpoint principal con Ollama
router.post("/analyze-workout", async (req, res) => {
  console.log("🎯 POST /ia/analyze-workout - INICIO");

  // Establecer timeout largo para la respuesta
  req.setTimeout(180000); // 3 minutos
  res.setTimeout(180000);

  try {
    const {
      usuarioId,
      entrenamientoData,
      ejerciciosRealizados,
      duracionTotal,
      rutinaInfo,
    } = req.body;

    console.log("🏋️ Ejercicios:", entrenamientoData?.length || 0);
    console.log("⏱️ Duración:", duracionTotal);

    // Calcular métricas
    const metricas = calcularMetricasEntrenamiento(entrenamientoData);

    // Obtener historial
    const historial = await getWorkoutHistory(usuarioId);

    let analisisTexto = "";

    try {
      // Intentar con Ollama
      console.log("🤖 Enviando a Ollama para análisis...");

      const prompt = generarPromptOptimizado(
        entrenamientoData,
        ejerciciosRealizados,
        metricas,
        duracionTotal,
        rutinaInfo,
        historial
      );

      console.log("📝 Longitud del prompt:", prompt.length, "caracteres");

      // Llamar a Ollama con timeout específico
      analisisTexto = await Promise.race([
        ollamaService.generateResponse(prompt, {
          temperature: 0.7,
          maxTokens: 600,
          model: process.env.OLLAMA_MODEL || "gemma:2b",
        }),
        new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("Ollama timeout")), 120000) // 2 minutos timeout para Ollama
        ),
      ]);

      console.log("✅ Análisis de Ollama recibido");
    } catch (ollamaError) {
      console.error("⚠️ Error con Ollama:", ollamaError.message);

      // Generar análisis de fallback detallado
      analisisTexto = generarAnalisisFallback(
        entrenamientoData,
        ejerciciosRealizados,
        metricas,
        duracionTotal,
        rutinaInfo
      );
    }

    // Asegurar que siempre haya un análisis
    if (!analisisTexto || analisisTexto.trim().length === 0) {
      analisisTexto = generarAnalisisFallback(
        entrenamientoData,
        ejerciciosRealizados,
        metricas,
        duracionTotal,
        rutinaInfo
      );
    }

    console.log("📊 Métricas calculadas:", metricas);
    console.log("✅ Enviando respuesta completa");

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      analisis: analisisTexto,
      ejerciciosRecomendados: [],
      metricas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error general en analyze-workout:", error);

    // Respuesta de error pero exitosa para evitar Network Error
    return res.status(200).json({
      success: true,
      analisis:
        "Tu entrenamiento ha sido guardado correctamente. El análisis detallado no pudo completarse en este momento, pero tu progreso está registrado.",
      ejerciciosRecomendados: [],
      metricas: {
        promedioSatisfaccion: "3",
        promedioEsfuerzo: "3",
        promedioDificultad: "3",
        totalSeriesCompletadas: 0,
        totalSeriesSaltadas: 0,
        porcentajeCompletado: 100,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Función para generar análisis de fallback detallado
function generarAnalisisFallback(
  entrenamientoData,
  ejerciciosRealizados,
  metricas,
  duracionTotal,
) {
  let texto = `🎯 **Análisis de tu entrenamiento**\n\n`;
  texto += `Completaste ${
    metricas.totalSeriesCompletadas
  } series en ${Math.round(duracionTotal / 60)} minutos. `;

  const satisf = parseFloat(metricas.promedioSatisfaccion);
  const esf = parseFloat(metricas.promedioEsfuerzo);
  const dific = parseFloat(metricas.promedioDificultad);

  // Análisis por métricas
  if (satisf >= 4 && esf >= 4) {
    texto += `¡Excelente sesión! Tu alta satisfacción (${metricas.promedioSatisfaccion}/5) y esfuerzo (${metricas.promedioEsfuerzo}/5) muestran un entrenamiento muy productivo. `;
  } else if (satisf <= 2) {
    texto += `La baja satisfacción (${metricas.promedioSatisfaccion}/5) sugiere que algo no fue óptimo. Considera ajustar los pesos o la selección de ejercicios. `;
  } else {
    texto += `Mantuviste un buen balance con satisfacción de ${metricas.promedioSatisfaccion}/5 y esfuerzo de ${metricas.promedioEsfuerzo}/5. `;
  }

  texto += `\n\n💪 **Recomendaciones:**\n`;

  if (dific >= 4) {
    texto += `• La alta dificultad (${metricas.promedioDificultad}/5) indica que estás en tu límite. Mantén estos pesos 2-3 semanas antes de incrementar.\n`;
  } else if (dific <= 2) {
    texto += `• Con dificultad de ${metricas.promedioDificultad}/5, puedes aumentar el peso en 2.5-5kg o añadir 1-2 repeticiones.\n`;
  }

  if (metricas.totalSeriesSaltadas > 0) {
    texto += `• Saltaste ${metricas.totalSeriesSaltadas} series. Considera reducir el peso en 10% para completar todo el volumen.\n`;
  }

  // Análisis por ejercicio si hay datos
  if (entrenamientoData && entrenamientoData.length > 0) {
    texto += `\n📊 **Por ejercicio:**\n`;
    entrenamientoData.forEach((ej, idx) => {
      const nombre =
        ejerciciosRealizados?.[idx]?.nombre || `Ejercicio ${idx + 1}`;
      if (ej.valoracion) {
        texto += `• ${nombre}: `;
        if (ej.valoracion.satisfaccion <= 2) {
          texto += `revisar técnica o peso. `;
        } else if (ej.valoracion.dificultad >= 4) {
          texto += `mantener peso actual. `;
        } else if (ej.valoracion.dificultad <= 2) {
          texto += `listo para progresar. `;
        } else {
          texto += `buen trabajo. `;
        }
        texto += `\n`;
      }
    });
  }

  texto += `\n¡Sigue así! La consistencia es la clave del progreso 💪`;

  return texto;
}

// Test endpoint
router.get("/test", (req, res) => {
  console.log("✅ Test endpoint funcionando");
  res.json({ success: true, message: "IA endpoint funcionando" });
});

module.exports = router;
