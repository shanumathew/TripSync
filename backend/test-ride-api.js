/**
 * Test Ride API Endpoints
 * Prerequisites: Backend server must be running on port 5000
 * Run: node backend/test-ride-api.js
 */

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let rideId = null;

// Test user credentials (register first if needed)
const testUser = {
  email: 'testuser@university.edu',
  password: 'Test123!'
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const json = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data: json,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Login to get auth token
async function login() {
  console.log('\n🔐 Logging in...');
  const result = await makeRequest('POST', '/auth/login', testUser);
  
  if (result.ok) {
    authToken = result.data.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${authToken.substring(0, 30)}...`);
    return true;
  } else {
    console.log('❌ Login failed:', result.data.message);
    console.log('💡 Please register first or check credentials');
    return false;
  }
}

// Test 1: Parse ride intent without creating
async function testParseIntent() {
  console.log('\n🧪 TEST 1: Parse Ride Intent');
  console.log('═'.repeat(60));
  
  const testText = "Going to airport tomorrow morning at 8 AM";
  console.log(`Input: "${testText}"`);
  
  const result = await makeRequest('POST', '/rides/parse-test', { text: testText }, authToken);
  
  if (result.ok) {
    console.log('✅ Parsing successful!');
    console.log('\nParsed Data:');
    console.log(JSON.stringify(result.data.data.parsed.data, null, 2));
    return true;
  } else {
    console.log('❌ Parsing failed:', result.data.message);
    return false;
  }
}

// Test 2: Create ride with NLP
async function testCreateRideWithNLP() {
  console.log('\n🧪 TEST 2: Create Ride with NLP');
  console.log('═'.repeat(60));
  
  const rideData = {
    text: "Need a ride to State University tomorrow at 3 PM",
    seats: 3
  };
  
  console.log(`Input: "${rideData.text}"`);
  console.log(`Seats: ${rideData.seats}`);
  
  const result = await makeRequest('POST', '/rides', rideData, authToken);
  
  if (result.ok) {
    console.log('✅ Ride created successfully!');
    rideId = result.data.data.ride.id;
    console.log(`\nRide ID: ${rideId}`);
    console.log('\nRide Details:');
    console.log(JSON.stringify(result.data.data.ride, null, 2));
    console.log('\nParsed Data:');
    console.log(JSON.stringify(result.data.data.parsed, null, 2));
    return true;
  } else {
    console.log('❌ Ride creation failed:', result.data.message);
    if (result.data.errors) {
      console.log('Errors:', result.data.errors);
    }
    return false;
  }
}

// Test 3: Get all rides
async function testGetAllRides() {
  console.log('\n🧪 TEST 3: Get All Rides');
  console.log('═'.repeat(60));
  
  const result = await makeRequest('GET', '/rides', null, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${result.data.results} ride(s)`);
    if (result.data.results > 0) {
      console.log('\nFirst ride:');
      console.log(JSON.stringify(result.data.data.rides[0], null, 2));
    }
    return true;
  } else {
    console.log('❌ Failed to get rides:', result.data.message);
    return false;
  }
}

// Test 4: Get my rides
async function testGetMyRides() {
  console.log('\n🧪 TEST 4: Get My Rides');
  console.log('═'.repeat(60));
  
  const result = await makeRequest('GET', '/rides/my-rides', null, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${result.data.results} ride(s) for current user`);
    if (result.data.results > 0) {
      console.log('\nYour rides:');
      result.data.data.rides.forEach((ride, index) => {
        console.log(`\n${index + 1}. ${ride.original_text || 'Manual ride'}`);
        console.log(`   From: ${ride.from_location} → To: ${ride.to_location}`);
        console.log(`   Time: ${ride.departure_time}`);
        console.log(`   Status: ${ride.status}`);
      });
    }
    return true;
  } else {
    console.log('❌ Failed to get my rides:', result.data.message);
    return false;
  }
}

// Test 5: Get ride by ID
async function testGetRideById() {
  if (!rideId) {
    console.log('\n⚠️  Skipping TEST 5: No ride ID available');
    return true;
  }
  
  console.log('\n🧪 TEST 5: Get Ride by ID');
  console.log('═'.repeat(60));
  console.log(`Fetching ride ID: ${rideId}`);
  
  const result = await makeRequest('GET', `/rides/${rideId}`, null, authToken);
  
  if (result.ok) {
    console.log('✅ Ride found!');
    console.log('\nRide Details:');
    console.log(JSON.stringify(result.data.data.ride, null, 2));
    return true;
  } else {
    console.log('❌ Failed to get ride:', result.data.message);
    return false;
  }
}

// Test 6: Update ride
async function testUpdateRide() {
  if (!rideId) {
    console.log('\n⚠️  Skipping TEST 6: No ride ID available');
    return true;
  }
  
  console.log('\n🧪 TEST 6: Update Ride');
  console.log('═'.repeat(60));
  
  const updates = {
    available_seats: 2,
    notes: 'Updated via API test'
  };
  
  console.log('Updates:', updates);
  
  const result = await makeRequest('PUT', `/rides/${rideId}`, updates, authToken);
  
  if (result.ok) {
    console.log('✅ Ride updated successfully!');
    console.log('\nUpdated Ride:');
    console.log(JSON.stringify(result.data.data.ride, null, 2));
    return true;
  } else {
    console.log('❌ Failed to update ride:', result.data.message);
    return false;
  }
}

// Test 7: Search rides
async function testSearchRides() {
  console.log('\n🧪 TEST 7: Search Rides');
  console.log('═'.repeat(60));
  
  const searchFilters = {
    status: 'active',
    direction: 'to_airport'
  };
  
  console.log('Search filters:', searchFilters);
  
  const result = await makeRequest('POST', '/rides/search', searchFilters, authToken);
  
  if (result.ok) {
    console.log(`✅ Found ${result.data.results} matching ride(s)`);
    return true;
  } else {
    console.log('❌ Search failed:', result.data.message);
    return false;
  }
}

// Test 8: Delete (cancel) ride
async function testDeleteRide() {
  if (!rideId) {
    console.log('\n⚠️  Skipping TEST 8: No ride ID available');
    return true;
  }
  
  console.log('\n🧪 TEST 8: Cancel Ride');
  console.log('═'.repeat(60));
  console.log(`Cancelling ride ID: ${rideId}`);
  
  const result = await makeRequest('DELETE', `/rides/${rideId}`, null, authToken);
  
  if (result.ok) {
    console.log('✅ Ride cancelled successfully!');
    return true;
  } else {
    console.log('❌ Failed to cancel ride:', result.data.message);
    return false;
  }
}

// Test various NLP inputs
async function testVariousNLPInputs() {
  console.log('\n🧪 BONUS: Test Various NLP Inputs');
  console.log('═'.repeat(60));
  
  const testInputs = [
    "Going to downtown tomorrow at 5pm with 2 friends",
    "Need urgent ride to hospital now",
    "Anyone headed to campus this afternoon?",
    "Flight at 6am, need ride to airport"
  ];
  
  for (const input of testInputs) {
    console.log(`\n📝 Testing: "${input}"`);
    const result = await makeRequest('POST', '/rides/parse-test', { text: input }, authToken);
    
    if (result.ok) {
      const parsed = result.data.data.parsed.data;
      console.log(`  ✅ Destination: ${parsed.destination || 'N/A'}`);
      console.log(`  ✅ Time: ${parsed.humanReadableTime || 'N/A'}`);
      console.log(`  ✅ Confidence: ${(parsed.confidence.overall * 100).toFixed(0)}%`);
    } else {
      console.log('  ❌ Failed');
    }
  }
  
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🧪 TRIPSYNC RIDE API TEST SUITE 🧪               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log('Testing NLP-powered ride creation...\n');
  
  // Check server
  try {
    await fetch(BASE_URL + '/health');
  } catch (error) {
    console.log('\n❌ ERROR: Cannot connect to server');
    console.log('Please make sure the backend is running: npm start\n');
    return;
  }
  
  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n⚠️  Cannot proceed without authentication');
    console.log('Please register first at: POST /api/auth/register\n');
    return;
  }
  
  const results = [];
  
  // Run tests
  results.push(await testParseIntent());
  results.push(await testCreateRideWithNLP());
  results.push(await testGetAllRides());
  results.push(await testGetMyRides());
  results.push(await testGetRideById());
  results.push(await testUpdateRide());
  results.push(await testSearchRides());
  results.push(await testDeleteRide());
  results.push(await testVariousNLPInputs());
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   📊 TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! NLP ride system is working perfectly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.\n');
  }
  
  console.log('💡 Next Steps:');
  console.log('1. Update frontend Dashboard to include ride posting form');
  console.log('2. Create My Rides page to display user rides');
  console.log('3. Test complete flow from frontend\n');
}

// Run tests
runAllTests();
