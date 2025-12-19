const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'resonant-augury-481716-m7';
const LOCATION = 'us-central1';
const KEY_PATH = path.join(__dirname, 'key.json');

console.log('Script started.');

if (!fs.existsSync(KEY_PATH)) {
    console.error('Error: key.json not found at', KEY_PATH);
    process.exit(1);
}

try {
    const vertex_ai = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      googleAuthOptions: { keyFilename: KEY_PATH }
    });

    const candidateModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro',
      'gemini-1.5-pro-preview-0409',
      'gemini-1.5-pro-001'
    ];

    async function checkModels() {
      console.log('Checking model availability...\n');

      for (const modelName of candidateModels) {
        console.log(`Testing ${modelName} ... `);
        try {
          const model = vertex_ai.preview.getGenerativeModel({
            model: modelName
          });
          
          // We need to actually generate content to verify access
          await model.generateContent('Hello');
          console.log('✅ AVAILABLE');
        } catch (error) {
          if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
            console.log('❌ NOT FOUND');
          } else {
            console.log(`⚠️ ERROR: ${error.message}`);
          }
        }
      }
    }

    checkModels().then(() => console.log('Script finished.')).catch(err => console.error('Script failed:', err));

} catch (err) {
    console.error('Initialization error:', err);
}
