const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function setup() {
  console.log('🚀 Configurando servidor de IA para fitness...\n');
  
  try {
    // Verificar si Ollama está instalado
    console.log('📦 Verificando Ollama...');
    try {
      await execPromise('ollama --version');
      console.log('✅ Ollama ya está instalado');
    } catch {
      console.log('⚠️  Ollama no encontrado. Por favor instala desde: https://ollama.ai');
      console.log('   Ejecuta: winget install Ollama.Ollama');
      process.exit(1);
    }
    
    // Descargar modelos optimizados para tu hardware
    console.log('\n📥 Descargando modelos optimizados para CPU con 8GB RAM...');
    
    console.log('Descargando Gemma 2B (1.5GB, mejor para tu hardware)...');
    await execPromise('ollama pull gemma:2b');
    
    console.log('Descargando TinyLlama (637MB, respuestas ultra-rápidas)...');
    await execPromise('ollama pull tinyllama');
    
    console.log('\n✨ Configuración completada!');
    console.log('Modelos disponibles:');
    console.log('  - gemma:2b (recomendado para análisis complejos)');
    console.log('  - tinyllama (para respuestas rápidas)');
    console.log('\nEjecuta "npm start" para iniciar el servidor');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

setup();