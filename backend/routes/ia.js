const express = require("express");
const router = express.Router();
const { ollamaService } = require("../services/ollama.service");
const Entrenamiento = require("../models/Entrenamientos");
const Usuario = require("../models/Usuarios");

// Función auxiliar para obtener historial
async function getWorkoutHistory(userId, limit = 2) { // Reducido a 2 para optimizar contexto
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

// Función mejorada para generar análisis de fallback
function generarAnalisisFallback(
  entrenamientoData,
  metricas,
  duracionTotal,
) {
  const duracionMinutos = Math.round(duracionTotal / 60);
  
  return `## Resumen del Entrenamiento

Has completado tu entrenamiento de **${duracionMinutos} minutos** con un **${metricas.porcentajeCompletado}% de series completadas**. 💪

## Análisis por Ejercicio

${entrenamientoData.map((ejercicio, idx) => {
  const nombre = ejercicio.ejercicioNombre || `Ejercicio ${idx + 1}`;
  const satisfaccion = ejercicio.valoracion?.satisfaccion || 0;
  const dificultad = ejercicio.valoracion?.dificultad || 0;
  const seriesSaltadas = ejercicio.seriesSaltadas || 0;
  
  let recomendacion = '';
  if (satisfaccion < 3 && dificultad > 3) {
    recomendacion = `Para **"${nombre}"**: La combinación de baja satisfacción y alta dificultad sugiere que el peso actual es excesivo. Reduce **5 kilos** en la próxima sesión y enfócate en la técnica.`;
  } else if (seriesSaltadas > 0) {
    recomendacion = `Para **"${nombre}"**: Saltaste ${seriesSaltadas} series. Reduce **3 kilos** para completar todas las series planificadas.`;
  } else if (satisfaccion >= 4 && dificultad <= 2) {
    recomendacion = `Para **"${nombre}"**: Excelente ejecución con baja dificultad. Aumenta **2.5 kilos** para mayor estímulo.`;
  }
  
  return recomendacion;
}).filter(r => r).join('\n\n')}

## Ajustes de Carga y Descansos

* Mantén descansos de **60-90 segundos** entre series para optimizar la hipertrofia
* Para ejercicios compuestos pesados, puedes descansar hasta **2 minutos**
* Si la fatiga es excesiva, añade **30 segundos** más de descanso

## Plan para Próxima Sesión

* Ajusta los pesos según las recomendaciones específicas de cada ejercicio
* Intenta completar todas las series planificadas
* Registra tu percepción de esfuerzo para seguir ajustando las cargas
* Mantén una técnica estricta en todos los movimientos

## Mensaje Motivacional

¡Sigue así! Cada entrenamiento te acerca más a tus objetivos. La constancia es la clave del éxito. 🎯💪`;
}

// Endpoint principal con Ollama - VERSIÓN MEJORADA
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

    // NUEVO: Obtener datos del usuario para personalización
    let usuarioData = null;
    try {
      usuarioData = await Usuario.findOne({ uid: usuarioId })
        .select('peso altura objetivoPeso')
        .lean();
      console.log("👤 Datos del usuario obtenidos:", usuarioData ? "Sí" : "No");
    } catch (error) {
      console.error("⚠️ Error obteniendo datos del usuario:", error.message);
    }

    let analisisTexto = "";

    try {
      // Intentar con Ollama
      console.log("🤖 Enviando a Ollama para análisis...");

      // MODIFICADO: Preparar datos completos para el análisis
      const datosAnalisis = {
        entrenamientoData,
        duracionTotal,
        rutinaInfo: {
          ...rutinaInfo,
          totalDias: rutinaInfo?.dias?.length || 1
        },
        metricas,
        usuarioData,
        historial // Incluir el historial en los datos
      };

      console.log(datosAnalisis)

      // Llamar al servicio con los datos completos
      analisisTexto = await Promise.race([
        ollamaService.analizarEntrenamiento(datosAnalisis),
        new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("Ollama timeout")), 180000) 
        ),
      ]);

      console.log("✅ Análisis de Ollama recibido");
      
      // Validar que el análisis tenga el formato correcto
      if (!analisisTexto.includes("##")) {
        console.log("⚠️ Análisis sin formato markdown correcto, usando fallback");
        analisisTexto = generarAnalisisFallback(
          entrenamientoData,
          ejerciciosRealizados,
          metricas,
          duracionTotal,
          rutinaInfo
        );
      }
    } catch (ollamaError) {
      console.error("⚠️ Error con Ollama:", ollamaError.message);

      // Generar análisis de fallback mejorado
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

    // Respuesta de error pero con análisis básico
    const metricasBasicas = {
      porcentajeCompletado: 100,
      promedioSatisfaccion: "3",
      promedioEsfuerzo: "3",
      promedioDificultad: "3",
      totalSeriesCompletadas: 0,
      totalSeriesSaltadas: 0
    };

    return res.status(200).json({
      success: true,
      analisis: `## Entrenamiento Guardado

Tu entrenamiento ha sido guardado correctamente. 💪

## Resumen
* Duración: ${Math.round((req.body?.duracionTotal || 0) / 60)} minutos
* Ejercicios completados: ${req.body?.entrenamientoData?.length || 0}

## Recomendación
Continúa con tu plan de entrenamiento y mantén la constancia para ver resultados.

¡Sigue así! 🎯`,
      ejerciciosRecomendados: [],
      metricas: metricasBasicas,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  console.log("✅ Test endpoint funcionando");
  res.json({ success: true, message: "IA endpoint funcionando" });
});

module.exports = router;