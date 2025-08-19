const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'gemma:2b';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;
  }

  async initializeAI() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      const models = response.data.models || [];
      
      if (!models.find(m => m.name === this.model || m.name === `${this.model}:latest`)) {
        console.log(`⚠️ Modelo ${this.model} no encontrado, usando tinyllama`);
        this.model = 'tinyllama';
      }
      
      console.log('✅ Ollama conectado correctamente');
      console.log('📦 Modelos disponibles:', models.map(m => m.name));
      return true;
    } catch (error) {
      console.error('❌ Error conectando con Ollama:', error.message);
      throw error;
    }
  }

  async generateResponse(prompt, options = {}) {
    try {
      console.log('🤖 Enviando prompt a Ollama...');
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
            repeat_penalty: 1.1
          }
        },
        { timeout: this.timeout }
      );

      const endTime = Date.now();
      console.log(`✅ Respuesta recibida en ${(endTime - startTime) / 1000}s`);
      
      return response.data.response;
    } catch (error) {
      console.error('❌ Error generando respuesta:', error.message);
      
      // Si falla con gemma, intentar con tinyllama
      if (this.model !== 'tinyllama' && options.model !== 'tinyllama') {
        console.log('🔄 Intentando con tinyllama...');
        return this.generateResponse(prompt, { ...options, model: 'tinyllama' });
      }
      
      throw error;
    }
  }

  async analizarEntrenamiento(datosEntrenamiento) {
    const prompt = this.construirPromptAnalisis(datosEntrenamiento);
    return this.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 1500 // Más tokens para análisis completo
    });
  }

  construirPromptAnalisis(datos) {
    const { entrenamientoData, ejerciciosRealizados, duracionTotal, rutinaInfo, metricas } = datos;
    
    return `Eres un entrenador personal experto. Analiza este entrenamiento y proporciona recomendaciones específicas y detalladas.

DATOS DEL ENTRENAMIENTO:
- Rutina: ${rutinaInfo?.nombre || 'Sin nombre'}
- Día: ${(rutinaInfo?.diaIndex || 0) + 1}
- Duración total: ${Math.round(duracionTotal / 60)} minutos
- Nivel de la rutina: ${rutinaInfo?.nivel || 'intermedio'}

EJERCICIOS REALIZADOS:
${entrenamientoData.map((ejercicio, index) => {
  const info = ejerciciosRealizados?.[index] || {};
  const v = ejercicio.valoracion || {};
  const seriesCompletadas = ejercicio.series?.filter(s => s.completada).length || 0;
  const pesoMax = Math.max(...(ejercicio.series?.map(s => s.peso || 0) || [0]));
  const pesoPromedio = ejercicio.series?.length > 0 
    ? (ejercicio.series.reduce((sum, s) => sum + (s.peso || 0), 0) / ejercicio.series.length).toFixed(1)
    : 0;
  
  return `
${index + 1}. ${info.nombre || ejercicio.ejercicioId}
   - Satisfacción: ${v.satisfaccion || 0}/5
   - Esfuerzo: ${v.esfuerzo || 0}/5
   - Dificultad: ${v.dificultad || 0}/5
   - Series completadas: ${seriesCompletadas}/${(ejercicio.series?.length || 0) + (ejercicio.seriesSaltadas || 0)}
   - Peso: promedio ${pesoPromedio}kg, máximo ${pesoMax}kg
   - Duración: ${ejercicio.duracion || 0} segundos
   - Series saltadas: ${ejercicio.seriesSaltadas || 0}
   ${v.notas ? `- Notas del usuario: "${v.notas}"` : ''}`;
}).join('\n')}

MÉTRICAS GLOBALES:
- Satisfacción promedio: ${metricas?.promedioSatisfaccion || 0}/5
- Esfuerzo promedio: ${metricas?.promedioEsfuerzo || 0}/5
- Dificultad promedio: ${metricas?.promedioDificultad || 0}/5
- Porcentaje de series completadas: ${metricas?.porcentajeCompletado || 0}%

INSTRUCCIONES PARA EL ANÁLISIS:
1. Analiza CADA ejercicio individualmente basándote en sus métricas específicas
2. Identifica problemas específicos (series saltadas, baja satisfacción, descansos largos)
3. Para cada ejercicio con problemas, da una recomendación ESPECÍFICA y CUANTIFICADA
4. Si un ejercicio tiene alta dificultad (4-5) y series saltadas, recomienda reducir peso
5. Si un ejercicio tiene baja dificultad (1-2) y alta satisfacción, recomienda aumentar peso
6. Identifica patrones generales del entrenamiento
7. Proporciona un plan de progresión específico
8. Sé motivador pero realista
9. Usa emojis para hacer el texto más amigable

FORMATO DE RESPUESTA ESPERADO:
- Título con resumen general
- Análisis detallado por ejercicio (con problemas y recomendaciones específicas)
- Patrones identificados
- Plan de progresión para la próxima sesión
- Mensaje motivacional personalizado

Responde en español, sé específico con números (kg, repeticiones, segundos).`;
  }
}

module.exports = {
  ollamaService: new OllamaService(),
  initializeAI: () => new OllamaService().initializeAI()
};