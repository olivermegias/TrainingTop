const axios = require('axios');

async function testOllamaMinimo() {
  console.log('🔍 Test mínimo de Ollama\n');
  
  // 1. Verificar servicio
  try {
    const tags = await axios.get('http://localhost:11434/api/tags');
    console.log('✅ Servicio activo');
    console.log('📦 Modelos:', tags.data.models.map(m => m.name));
  } catch (error) {
    console.error('❌ Servicio no disponible: ' + error.message);
    return;
  }

  // 2. Probar con /api/chat (alternativa)
  console.log('\n🔄 Probando endpoint /api/chat...');
  try {
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'gemma:2b',
      messages: [
        {
          role: 'user',
          content: 'Responde solo: Hola'
        }
      ],
      stream: false
    });
    console.log('✅ Chat response:', response.data.message?.content);
  } catch (error) {
    console.error('❌ Error en /api/chat:', error.response?.data || error.message);
  }

  // 3. Probar con generate pero con formato diferente
  console.log('\n🔄 Probando /api/generate con formato básico...');
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'gemma:2b',
      prompt: 'Di hola',
      stream: false
    });
    console.log('✅ Generate response:', response.data.response);
  } catch (error) {
    console.error('❌ Error en /api/generate:', error.response?.data || error.message);
    
    // Mostrar detalles del error
    if (error.response?.data) {
      console.log('📝 Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // 4. Probar con tinyllama (más ligero)
  console.log('\n🔄 Probando con tinyllama...');
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'tinyllama',
      prompt: 'Hi',
      stream: false
    });
    console.log('✅ TinyLlama response:', response.data.response);
  } catch (error) {
    console.error('❌ Error con tinyllama:', error.response?.data || error.message);
  }
}

testOllamaMinimo();