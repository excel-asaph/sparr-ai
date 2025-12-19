const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');

const PROJECT_ID = '';
const LOCATION = 'us-central1';
const KEY_PATH = path.join(__dirname, 'key.json');

// Initialize Vertex AI
const vertex_ai = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
  googleAuthOptions: { keyFilename: KEY_PATH }
});

async function testGemini() {
  console.log('--- Testing Gemini Access ---');
  
  const modelsToTry = [
    'gemini-2.5-flash-lite', // User provided
    'gemini-1.5-flash-001',
    'gemini-1.5-pro-001',
    'gemini-1.0-pro-001',
    'gemini-pro',
    'gemini-1.5-pro'
  ];

  for (const modelName of modelsToTry) {
    console.log(`\nTesting Model ID: "${modelName}"...`);
    try {
      const model = vertex_ai.preview.getGenerativeModel({
        model: modelName
      });

      const result = await model.generateContent('Say "Hello"');
      const response = result.response;
      const text = response.candidates[0].content.parts[0].text;

      console.log(`✅ SUCCESS! This ID works: ${modelName}`);
      console.log(`Response: ${text}`);
      return; // Stop after finding one that works
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`❌ 404 Not Found (Project may not have access or ID is wrong)`);
      } else {
        console.log(`⚠️ Error: ${error.message.split('\n')[0]}`);
      }
    }
  }
  console.log('\n❌ All attempts failed. Please check if Vertex AI API is enabled in Cloud Console.');
}

testGemini();
