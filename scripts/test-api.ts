#!/usr/bin/env tsx

const BASE_URL = 'http://localhost:9002/api';

async function testCollectionEndpoint(endpoint: string) {
  try {
    console.log(`Testing GET ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (response.ok) {
      console.log(`✅ GET ${endpoint} returned ${response.status}`);
      const data = await response.json();
      console.log(`  -> Response has ${Array.isArray(data) ? data.length : 0} items.`);
    } else {
      console.error(`❌ GET ${endpoint} returned ${response.status}`);
      const errorText = await response.text();
      console.error(`  -> ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Error testing GET ${endpoint}:`, error);
  }
}

async function testSingleResourceEndpoint(endpoint: string, id: string) {
    const url = `${BASE_URL}${endpoint}/${id}`;
    try {
        console.log(`Testing GET ${url}...`);
        const response = await fetch(url);
        if (response.ok) {
            console.log(`✅ GET ${url} returned ${response.status}`);
            await response.json();
        } else {
            console.error(`❌ GET ${url} returned ${response.status}`);
            const errorText = await response.text();
            console.error(`  -> ${errorText}`);
        }
    } catch (error) {
        console.error(`❌ Error testing GET ${url}:`, error);
    }
}

async function main() {
  console.log('--- Starting API Endpoint Tests ---');

  await testCollectionEndpoint('/projects');
  await testCollectionEndpoint('/clients');
  await testCollectionEndpoint('/participants');
  await testCollectionEndpoint('/roles');
  await testCollectionEndpoint('/leads');

  console.log('\n--- Testing Dynamic Routes ---');
  await testCollectionEndpoint(`/projects/proj-1/tasks`);
  // I am not testing single resource endpoints as they are not implemented for GET.
  // The user asked to fix the project tasks route, which is a collection.
  // The other dynamic routes I fixed are for PUT/DELETE, which are not tested here.

  console.log('\n--- API Endpoint Tests Finished ---');
}

main();
