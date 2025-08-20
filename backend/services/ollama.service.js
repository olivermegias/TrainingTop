const axios = require("axios");

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_HOST || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "gemma:2b";
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;
  }

  async initializeAI() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      const models = response.data.models || [];

      if (
        !models.find(
          (m) => m.name === this.model || m.name === `${this.model}:latest`
        )
      ) {
        console.log(`⚠️ Modelo ${this.model} no encontrado, usando tinyllama`);
        this.model = "tinyllama";
      }

      console.log("✅ Ollama conectado correctamente");
      console.log(
        "📦 Modelos disponibles:",
        models.map((m) => m.name)
      );
      return true;
    } catch (error) {
      console.error("❌ Error conectando con Ollama:", error.message);
      throw error;
    }
  }

  async generateResponse(prompt, options = {}) {
    try {
      console.log("🤖 Enviando prompt a Ollama...");
      const startTime = Date.now();

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: options.model || this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: 0.9,
            num_predict: options.maxTokens || 1024,
            num_ctx: 4096,
            repeat_penalty: 1.1,
          },
        },
        { timeout: this.timeout }
      );

      const endTime = Date.now();
      console.log(`✅ Respuesta recibida en ${(endTime - startTime) / 1000}s`);

      return response.data.response;
    } catch (error) {
      console.error("❌ Error generando respuesta:", error.message);

      // Si falla con gemma, intentar con tinyllama
      if (this.model !== "tinyllama" && options.model !== "tinyllama") {
        console.log("🔄 Intentando con tinyllama...");
        return this.generateResponse(prompt, {
          ...options,
          model: "tinyllama",
        });
      }

      throw error;
    }
  }

  async analizarEntrenamiento(datosEntrenamiento) {
    const prompt = this.construirPromptAnalisis(datosEntrenamiento);
    return this.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 1500, // Más tokens para análisis completo
    });
  }

  construirPromptAnalisis(datos) {
    const {
      entrenamientoData,
      duracionTotal,
      rutinaInfo,
      metricas,
      usuarioData,
      historial,
    } = datos;

    // Contexto físico del usuario (si está disponible)
    let contextoFisico = "";
    if (usuarioData?.peso && usuarioData?.altura) {
      const alturaMetros = usuarioData.altura / 100;
      const imc = (usuarioData.peso / (alturaMetros * alturaMetros)).toFixed(1);
      contextoFisico = `
DATOS DEL USUARIO:
- Peso actual: ${usuarioData.peso} kg
- Altura: ${usuarioData.altura} cm  
- IMC: ${imc}
${
  usuarioData.objetivoPeso
    ? `- Objetivo de peso: ${usuarioData.objetivoPeso} kg`
    : ""
}`;
    }

    // Historial de entrenamientos para ver evolución
    let contextoHistorial = "";
    if (historial && historial.length > 0) {
      const entrenamientosAnteriores = historial
        .slice(0, 3)
        .map((workout) => {
          const fecha = new Date(workout.date).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
          });
          const duracionMin = Math.round(workout.duracion / 60);
          return `  ${fecha}: ${workout.totalEjercicios} ejercicios, ${workout.totalSeries} series, ${duracionMin} minutos`;
        })
        .join("\n");

      // Calcular tendencia
      let analisisTendencia = "";
      if (historial.length >= 2) {
        const duracionActual = duracionTotal;
        const duracionAnterior = historial[0].duracion;
        const diffMinutos = Math.round(
          (duracionActual - duracionAnterior) / 60
        );

        if (Math.abs(diffMinutos) < 5) {
          analisisTendencia = "Mantienes constancia en los tiempos";
        } else if (diffMinutos > 0) {
          analisisTendencia = `Has aumentado ${Math.abs(
            diffMinutos
          )} minutos respecto al último entrenamiento`;
        } else {
          analisisTendencia = `Has optimizado ${Math.abs(
            diffMinutos
          )} minutos respecto al último entrenamiento`;
        }
      }

      contextoHistorial = `
HISTORIAL RECIENTE (últimos ${historial.length} entrenamientos):
${entrenamientosAnteriores}
  Evolución: ${analisisTendencia || "Primer entrenamiento registrado"}`;
    }

    return `Eres un entrenador personal experto. Analiza este entrenamiento de forma personalizada y profesional.
${contextoFisico}
${contextoHistorial}

ENTRENAMIENTO DE HOY:
- Rutina: ${rutinaInfo?.nombre || "Sin nombre"}
- Día ${(rutinaInfo?.diaIndex || 0) + 1} de ${rutinaInfo?.totalDias || 1}
- Duración total: ${Math.round(
      duracionTotal / 60
    )} minutos (incluyendo descansos)
- Ejercicios completados: ${entrenamientoData.length}

RENDIMIENTO DETALLADO:
${entrenamientoData
  .map((ejercicio, index) => {
    const v = ejercicio.valoracion || {};
    const seriesCompletadas =
      ejercicio.series?.filter((s) => s.completada).length || 0;
    const seriesTotales =
      (ejercicio.series?.length || 0) + (ejercicio.seriesSaltadas || 0);
    const pesoPromedio =
      ejercicio.series?.length > 0
        ? (
            ejercicio.series.reduce((sum, s) => sum + (s.peso || 0), 0) /
            ejercicio.series.length
          ).toFixed(1)
        : 0;
    const tiempoMin = Math.round((ejercicio.duracion || 0) / 60);

    return `${index + 1}. "${ejercicio.ejercicioNombre}"
   Valoración: Satisfacción=${v.satisfaccion || 0}/5, Esfuerzo=${
      v.esfuerzo || 0
    }/5, Dificultad=${v.dificultad || 0}/5
   Ejecución: ${seriesCompletadas}/${seriesTotales} series, ${pesoPromedio}kg promedio, ${tiempoMin} minutos
   ${
     ejercicio.seriesSaltadas > 0
       ? `⚠️ Series saltadas: ${ejercicio.seriesSaltadas}`
       : ""
   }
   ${v.notas ? `Notas: "${v.notas}"` : ""}`;
  })
  .join("\n")}

MÉTRICAS GLOBALES:
- Satisfacción promedio: ${metricas?.promedioSatisfaccion || 0}/5
- Esfuerzo promedio: ${metricas?.promedioEsfuerzo || 0}/5
- Dificultad promedio: ${metricas?.promedioDificultad || 0}/5
- Completado: ${metricas?.porcentajeCompletado || 0}%

INSTRUCCIONES PARA TU ANÁLISIS:

1. FORMATO MARKDOWN OBLIGATORIO:
   - Usa "## " para títulos principales
   - Usa "**texto**" para énfasis importantes
   - Usa "* " para listas de puntos

2. IDIOMA: Responde ÚNICAMENTE en español. Evita anglicismos ni palabras en inglés.

3. ESTRUCTURA DEL ANÁLISIS:

   ## Resumen del Entrenamiento
   - Haz un análisis general de 3-5 líneas sobre el rendimiento global
   - Comenta la evolución si hay historial disponible
   - Destaca los aspectos más relevantes del entrenamiento
   - Usa emojis para hacerlo más amigable (💪, 🎯, 🔥, etc.)

   ## Análisis por Ejercicio
   - Centra el análisis en cada ejercicio individual
   - Si el ejercicio fue bien ejecutado: motiva y felicita (sin sugerencias técnicas)
   - Si hubo problemas: 
    * Identifica el problema concreto (peso, esfuerzo, descanso, técnica, dificultad)
    * Da recomendaciones específicas y numéricas (ej: "reduce 5kg", "descansa 30s más") 
   - Atiende siempre las notas del usuario si indican alguna molestia o dificultad

   ## Optimización de la Rutina
   - Analiza la **estructura global de la rutina**, no ajustes de peso ni series (eso va en “Análisis por Ejercicio”).
   - Si hay menos de 4 ejercicios: sugiere añadir grupos musculares complementarios (ej: empuje, tirón, core, tren inferior).
   - Si hay más de 8 ejercicios: evalúa si reducir el volumen total para evitar sobrecarga.
   - Si los ejercicios son muy similares: sugiere variar los patrones de movimiento (ej: alternar empuje/tirón, incluir trabajo unilateral).
   - No menciones el número exacto de ejercicios a añadir ni ajustes de carga; céntrate en **equilibrio y variedad de la rutina**.

   ## Plan para Próxima Sesión
   - Da 3-4 recomendaciones **generales para toda la sesión**
   - Usa el historial y las métricas globales como referencia
   - No repitas ajustes ya dados en “Análisis por Ejercicio”
   - Enfócate en progresión global (ej: "mantén la constancia de tiempos", "incrementa 1 serie en todo el entrenamiento", "equilibra más trabajo de tirón/empuje")
   - Añade un consejo práctico de preparación o recuperación (ej: hidratación, sueño, movilidad antes de empezar)
   - Añade un peso recomendado si lo ves oportuno.

   ## Mensaje Motivacional
   - Personalizado según el rendimiento y evolución
   - Reconoce el esfuerzo y los logros
   - Si hay historial, menciona la consistencia o mejoras
   - Termina con energía positiva y emojis

4. CONSIDERACIONES ESPECIALES:
   - Si es el primer entrenamiento, enfócate en establecer una línea base
   - Si hay tendencia negativa en el historial, sé comprensivo y motivador
   - Si hay tendencia positiva, celebra el progreso
   - Ajusta el tono según el nivel de satisfacción general
   ${
     usuarioData?.peso && usuarioData?.objetivoPeso
       ? `- Considera el objetivo de peso del usuario en tus recomendaciones`
       : ""
   }

IMPORTANTE: Sé específico con números cuando des recomendaciones de ajuste, pero sé más general y motivador cuando las cosas van bien. El objetivo es guiar sin sobrecargar de información. SÉ MUY ESTRICTO CON EL FORMATO Y EL IDIOMA.`;
  }
}

module.exports = {
  ollamaService: new OllamaService(),
  initializeAI: () => new OllamaService().initializeAI(),
};
