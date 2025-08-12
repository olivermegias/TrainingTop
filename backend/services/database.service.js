const { getDB } = require('../database');

async function getWorkoutHistory(userId, limit = 10) {
  try {
    const db = getDB();
    const workouts = await db.collection('workouts')
      .find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
    
    // Simplificar datos para ahorrar memoria
    return workouts.map(w => ({
      date: w.date,
      exercises: w.exercises.map(e => ({
        name: e.name,
        sets: e.sets.length,
        maxWeight: Math.max(...e.sets.map(s => s.weight || 0)),
        totalReps: e.sets.reduce((sum, s) => sum + (s.reps || 0), 0)
      }))
    }));
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

async function saveAIInteraction(userId, query, response) {
  try {
    const db = getDB();
    await db.collection('ai_interactions').insertOne({
      userId,
      query,
      response,
      model: process.env.OLLAMA_MODEL,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error guardando interacción:', error);
  }
}

module.exports = {
  getWorkoutHistory,
  saveAIInteraction
};