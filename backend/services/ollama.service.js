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
      
      if (!models.find(m => m.name === this.model)) {
        throw new Error(`Modelo ${this.model} no encontrado. Ejecuta: ollama pull ${this.model}`);
      }
      
      console.log('✅ Ollama conectado correctamente');
      return true;
    } catch (error) {
      throw new Error(`Error conectando con Ollama: ${error.message}`);
    }
  }

  async generateResponse(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: options.model || this.model,
          prompt: this.optimizePromptForLowRAM(prompt),
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: 0.9,
            num_predict: options.maxTokens || 512,
            num_ctx: 2048, // Contexto reducido para tu RAM
            num_thread: 4, // Optimizado para tu CPU
            repeat_penalty: 1.1
          }
        },
        { timeout: this.timeout }
      );

      return response.data.response;
    } catch (error) {
      console.error('Error generando respuesta:', error.message);
      
      // Fallback a modelo más pequeño si falla
      if (this.model !== 'tinyllama' && error.code === 'ECONNABORTED') {
        console.log('Intentando con modelo más ligero...');
        return this.generateResponse(prompt, { ...options, model: 'tinyllama' });
      }
      
      throw error;
    }
  }

  async generateFitnessAnalysis(userData, workoutData, query) {
    const systemPrompt = `Eres un entrenador personal experto. Analiza datos de entrenamiento y proporciona recomendaciones precisas en español.
    
    IMPORTANTE: Sé conciso debido a limitaciones de memoria. Máximo 3-4 párrafos.`;

    const userPrompt = `
    Usuario: ${JSON.stringify(userData, null, 2)}
    Entrenamientos recientes: ${JSON.stringify(workoutData, null, 2)}
    Consulta: ${query}
    
    Proporciona análisis y recomendaciones específicas.`;

    return this.generateResponse(`${systemPrompt}\n\n${userPrompt}`);
  }

  optimizePromptForLowRAM(prompt) {
    // Limitar longitud del prompt para tu hardware
    const maxLength = 1500;
    if (prompt.length > maxLength) {
      return prompt.substring(0, maxLength) + '...';
    }
    return prompt;
  }

  // Método específico para respuestas rápidas
  async quickResponse(query) {
    return this.generateResponse(query, {
      model: 'tinyllama',
      maxTokens: 256,
      temperature: 0.5
    });
  }
}

module.exports = {
  ollamaService: new OllamaService(),
  initializeAI: () => new OllamaService().initializeAI()
};