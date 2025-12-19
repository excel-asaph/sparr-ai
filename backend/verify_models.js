const { ModelServiceClient, EndpointServiceClient } = require('@google-cloud/aiplatform').v1;
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

const PROJECT_ID = '';
const LOCATION = 'us-central1';
const KEY_PATH = path.join(__dirname, 'key.json');

// Set credentials for the client libraries
process.env.GOOGLE_APPLICATION_CREDENTIALS = KEY_PATH;

async function listMyModels() {
  console.log('\n--- Checking Your Registered Models (Custom Models) ---');
  try {
    const client = new ModelServiceClient({apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`});
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}`;
    const [response] = await client.listModels({ parent });
    
    if (response.length === 0) {
      console.log('No custom models found in your project registry.');
    } else {
      for (const model of response) {
        console.log(`- ${model.displayName} (${model.name})`);
      }
    }
  } catch (err) {
    console.error('Error listing custom models:', err.message);
  }
}

async function listMyEndpoints() {
  console.log('\n--- Checking Your Endpoints (Deployed Models) ---');
  try {
    const client = new EndpointServiceClient({apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`});
    const parent = `projects/${PROJECT_ID}/locations/${LOCATION}`;
    const [response] = await client.listEndpoints({ parent });

    if (response.length === 0) {
      console.log('No endpoints found.');
    } else {
      for (const endpoint of response) {
        console.log(`- Endpoint: ${endpoint.displayName}`);
        if (endpoint.deployedModels) {
          endpoint.deployedModels.forEach(dm => console.log(`  -> Deployed: ${dm.model}`));
        }
      }
    }
  } catch (err) {
    console.error('Error listing endpoints:', err.message);
  }
}

async function listPublisherModels() {
  console.log('\n--- Checking Google Publisher Models (Gemini, etc.) ---');
  // Note: The Node.js client library doesn't always expose ModelGardenService easily,
  // so we'll use the generic ModelServiceClient with the publisher parent path
  // OR fallback to REST if that fails.
  
  try {
    // Attempt 1: Use ModelServiceClient with publisher parent
    // The parent for Google models is usually: "publishers/google"
    // But the API expects "projects/.../locations/..." usually.
    // Let's try the REST API approach which is more reliable for this specific "Garden" lookup
    
    const auth = new GoogleAuth({ keyFile: KEY_PATH, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;
    
    // Correct URL for Publisher Models
    // Try using the global endpoint for publisher models
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/publishers/google/models`;
    console.log('Fetching URL:', url);
    
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${await res.text()}`);
    }
    
    const data = await res.json();
    const models = data.models || [];
    
    console.log(`Found ${models.length} publisher models.`);
    
    const gemini = models.filter(m => m.name.includes('gemini'));
    console.log(`\n*** Gemini Models Available (${gemini.length}) ***`);
    gemini.forEach(m => {
      // m.name is like "publishers/google/models/gemini-1.5-pro"
      const id = m.name.split('/').pop();
      console.log(`- ${id}`);
    });

  } catch (err) {
    console.error('Error listing publisher models:', err.message);
  }
}

async function main() {
  await listMyModels();
  await listMyEndpoints();
  await listPublisherModels();
}

main();
