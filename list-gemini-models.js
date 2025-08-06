require('dotenv').config();
const axios = require('axios');

async function listGeminiModels() {
  try {
    console.log('🔍 Listing available Gemini models...\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    
    // List models endpoint
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    console.log('Fetching models from:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Models received:');
    console.log('Status:', response.status);
    console.log('\n📋 Available Models:');
    
    if (response.data.models && response.data.models.length > 0) {
      response.data.models.forEach((model, index) => {
        console.log(`\n${index + 1}. Model: ${model.name}`);
        console.log(`   Display Name: ${model.displayName || 'N/A'}`);
        console.log(`   Description: ${model.description || 'N/A'}`);
        console.log(`   Supported Generation Methods: ${model.supportedGenerationMethods ? model.supportedGenerationMethods.join(', ') : 'N/A'}`);
        console.log(`   Temperature: ${model.temperature || 'N/A'}`);
        console.log(`   Top P: ${model.topP || 'N/A'}`);
        console.log(`   Top K: ${model.topK || 'N/A'}`);
        console.log(`   Max Output Tokens: ${model.maxOutputTokens || 'N/A'}`);
      });
      
      // Filter for models that support generateContent
      const generateContentModels = response.data.models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      console.log('\n🎯 Models that support generateContent:');
      generateContentModels.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name} (${model.displayName || 'No display name'})`);
      });
      
    } else {
      console.log('No models found in the response.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

listGeminiModels(); 