const express = require('express');
const router = express.Router();
const { ollamaService } = require('../services/ollama.service');
const { getWorkoutHistory } = require('../services/database.service');

// Análisis de rutina
router.post('/analyze-routine', async (req, res) => {
  try {
    const { userId, question } = req.body;
    
    // Obtener historial del usuario (limitado para ahorrar memoria)
    const recentWorkouts = await getWorkoutHistory(userId, 5);
    
    const analysis = await ollamaService.generateFitnessAnalysis(
      { id: userId },
      recentWorkouts,
      question || 'Analiza mi progreso y sugiere mejoras'
    );
    
    res.json({
      success: true,
      analysis,
      model: process.env.OLLAMA_MODEL,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Intenta con una consulta más corta'
    });
  }
});

// Recomendación rápida
router.post('/quick-tip', async (req, res) => {
  try {
    const { exercise, context } = req.body;
    
    const prompt = `Dame un consejo breve sobre ${exercise}. Contexto: ${context}. Máximo 2 frases.`;
    const tip = await ollamaService.quickResponse(prompt);
    
    res.json({
      success: true,
      tip,
      model: 'tinyllama'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calcular progresión
router.post('/calculate-progression', async (req, res) => {
  try {
    const { currentWeight, currentReps, goal } = req.body;
    
    const prompt = `
    Peso actual: ${currentWeight}kg
    Repeticiones: ${currentReps}
    Objetivo: ${goal}
    
    Calcula la progresión semanal óptima. Sé muy específico con números.
    `;
    
    const progression = await ollamaService.generateResponse(prompt, {
      temperature: 0.3, // Más determinista para cálculos
      maxTokens: 256
    });
    
    res.json({
      success: true,
      progression
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generar rutina personalizada
router.post('/generate-routine', async (req, res) => {
  try {
    const { userProfile, preferences, availableTime } = req.body;
    
    const prompt = `
    Crea rutina de gimnasio:
    - Nivel: ${userProfile.level}
    - Objetivo: ${userProfile.goal}
    - Tiempo disponible: ${availableTime} minutos
    - Preferencias: ${preferences.join(', ')}
    
    Formato: Lista de ejercicios con series y repeticiones.
    `;
    
    const routine = await ollamaService.generateResponse(prompt);
    
    res.json({
      success: true,
      routine
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;