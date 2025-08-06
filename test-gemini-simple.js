require('dotenv').config();
const axios = require('axios');

async function testGeminiSimple() {
  try {
    console.log('�� Testing Gemini 2.0 Flash API with simple request...\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    
    // Updated to use Gemini 2.0 Flash
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestData = {
      contents: [{
        parts: [{
          text: "Hello! Please respond with 'OK' if you can read this message."
        }]
      }]
    };
    
    console.log('Sending request to:', url);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGeminiSimple();