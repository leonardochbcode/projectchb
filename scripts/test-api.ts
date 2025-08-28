#!/usr/bin/env tsx

const BASE_URL = 'http://localhost:9002/api';

async function testEndpoint(endpoint: string) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (response.ok) {
      console.log(`✅ ${endpoint} returned ${response.status}`);
      const data = await response.json();
      console.log(`  -> Response has ${Array.isArray(data) ? data.length : 1} items.`);
    } else {
      console.error(`❌ ${endpoint} returned ${response.status}`);
      const errorText = await response.text();
      console.error(`  -> ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error);
  }
}

async function main() {
  console.log('--- Starting API Endpoint Tests ---');

  await testEndpoint('/projects');
  await testEndpoint('/clients');
  await testEndpoint('/participants');
  await testEndpoint('/roles');

  // Test a route with a parameter. Using a known ID from the seed data.
  const testProjectId = 'proj-1';
  await testEndpoint(`/projects/${testProjectId}/tasks`);

  console.log('\n--- API Endpoint Tests Finished ---');
}

main();
