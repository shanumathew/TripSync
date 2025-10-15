/**
 * Authentication Endpoints Test Script
 * Tests all authentication endpoints sequentially
 */

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUserId = null;

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

// Test functions
async function testHealthCheck() {
  console.log('\n🧪 TEST 1: Health Check Endpoint');
  console.log('=====================================');
  
  const result = await makeRequest('GET', '/api/health');
  
  if (result.ok && result.data.status === 'success') {
    console.log('✅ PASSED: Health check working');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ FAILED: Health check failed');
    console.log('Response:', JSON.stringify(result, null, 2));
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n🧪 TEST 2: User Registration');
  console.log('=====================================');
  
  const testUser = {
    email: `testuser${Date.now()}@university.edu`,
    password: 'Test123!',
    name: 'Test User',
    university: 'State University',
    phone: '1234567890'
  };
  
  console.log('Registering user:', testUser.email);
  
  const result = await makeRequest('POST', '/api/auth/register', testUser);
  
  if (result.ok && result.data.status === 'success') {
    authToken = result.data.data.token;
    testUserId = result.data.data.user.id;
    console.log('✅ PASSED: User registered successfully');
    console.log('User ID:', testUserId);
    console.log('Token:', authToken.substring(0, 50) + '...');
    console.log('User Data:', JSON.stringify(result.data.data.user, null, 2));
    return { success: true, email: testUser.email, password: testUser.password };
  } else {
    console.log('❌ FAILED: Registration failed');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return { success: false };
  }
}

async function testDuplicateEmail(email) {
  console.log('\n🧪 TEST 3: Duplicate Email Validation');
  console.log('=====================================');
  
  const duplicateUser = {
    email: email,
    password: 'Test123!',
    name: 'Duplicate User',
    university: 'State University',
    phone: '9876543210'
  };
  
  console.log('Attempting to register with existing email:', email);
  
  const result = await makeRequest('POST', '/api/auth/register', duplicateUser);
  
  if (!result.ok && result.status === 400) {
    console.log('✅ PASSED: Duplicate email correctly rejected');
    console.log('Error Message:', result.data.message);
    return true;
  } else {
    console.log('❌ FAILED: Duplicate email should be rejected');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testUserLogin(email, password) {
  console.log('\n🧪 TEST 4: User Login');
  console.log('=====================================');
  
  const credentials = { email, password };
  
  console.log('Logging in with:', email);
  
  const result = await makeRequest('POST', '/api/auth/login', credentials);
  
  if (result.ok && result.data.status === 'success') {
    const newToken = result.data.data.token;
    console.log('✅ PASSED: Login successful');
    console.log('Token:', newToken.substring(0, 50) + '...');
    console.log('User Data:', JSON.stringify(result.data.data.user, null, 2));
    return true;
  } else {
    console.log('❌ FAILED: Login failed');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testInvalidLogin(email) {
  console.log('\n🧪 TEST 5: Invalid Login Credentials');
  console.log('=====================================');
  
  const wrongCredentials = {
    email: email,
    password: 'WrongPassword123!'
  };
  
  console.log('Attempting login with wrong password');
  
  const result = await makeRequest('POST', '/api/auth/login', wrongCredentials);
  
  if (!result.ok && result.status === 401) {
    console.log('✅ PASSED: Invalid credentials correctly rejected');
    console.log('Error Message:', result.data.message);
    return true;
  } else {
    console.log('❌ FAILED: Invalid credentials should be rejected');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testGetProfile() {
  console.log('\n🧪 TEST 6: Get Current User Profile (Protected)');
  console.log('=====================================');
  
  console.log('Accessing protected route with token');
  
  const result = await makeRequest('GET', '/api/auth/me', null, authToken);
  
  if (result.ok && result.data.status === 'success') {
    console.log('✅ PASSED: Profile retrieved successfully');
    console.log('User Data:', JSON.stringify(result.data.data.user, null, 2));
    return true;
  } else {
    console.log('❌ FAILED: Could not retrieve profile');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 TEST 7: Unauthorized Access (No Token)');
  console.log('=====================================');
  
  console.log('Attempting to access protected route without token');
  
  const result = await makeRequest('GET', '/api/auth/me');
  
  if (!result.ok && result.status === 401) {
    console.log('✅ PASSED: Unauthorized access correctly blocked');
    console.log('Error Message:', result.data.message);
    return true;
  } else {
    console.log('❌ FAILED: Should require authentication');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n🧪 TEST 8: Update User Profile');
  console.log('=====================================');
  
  const updateData = {
    name: 'Updated Test User',
    phone: '9999999999'
  };
  
  console.log('Updating profile with:', updateData);
  
  const result = await makeRequest('PUT', '/api/auth/update-profile', updateData, authToken);
  
  if (result.ok && result.data.status === 'success') {
    console.log('✅ PASSED: Profile updated successfully');
    console.log('Updated User:', JSON.stringify(result.data.data.user, null, 2));
    return true;
  } else {
    console.log('❌ FAILED: Profile update failed');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testWeakPassword() {
  console.log('\n🧪 TEST 9: Weak Password Validation');
  console.log('=====================================');
  
  const weakPasswordUser = {
    email: `weak${Date.now()}@university.edu`,
    password: '123',
    name: 'Weak Password User',
    university: 'State University'
  };
  
  console.log('Attempting registration with weak password:', weakPasswordUser.password);
  
  const result = await makeRequest('POST', '/api/auth/register', weakPasswordUser);
  
  if (!result.ok && result.status === 400) {
    console.log('✅ PASSED: Weak password correctly rejected');
    console.log('Error Message:', result.data.message);
    return true;
  } else {
    console.log('❌ FAILED: Weak password should be rejected');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

async function testInvalidEmail() {
  console.log('\n🧪 TEST 10: Invalid Email Validation');
  console.log('=====================================');
  
  const invalidEmailUser = {
    email: 'notanemail',
    password: 'Test123!',
    name: 'Invalid Email User',
    university: 'State University'
  };
  
  console.log('Attempting registration with invalid email:', invalidEmailUser.email);
  
  const result = await makeRequest('POST', '/api/auth/register', invalidEmailUser);
  
  if (!result.ok && result.status === 400) {
    console.log('✅ PASSED: Invalid email correctly rejected');
    console.log('Error Message:', result.data.message);
    return true;
  } else {
    console.log('❌ FAILED: Invalid email should be rejected');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🧪 TRIPSYNC AUTHENTICATION TEST SUITE 🧪   ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log('Starting tests...\n');
  
  const results = [];
  
  // Test 1: Health Check
  results.push(await testHealthCheck());
  
  // Test 2: User Registration
  const registrationResult = await testUserRegistration();
  results.push(registrationResult.success);
  
  if (!registrationResult.success) {
    console.log('\n❌ Registration failed. Cannot continue with remaining tests.');
    return;
  }
  
  // Test 3: Duplicate Email
  results.push(await testDuplicateEmail(registrationResult.email));
  
  // Test 4: User Login
  results.push(await testUserLogin(registrationResult.email, registrationResult.password));
  
  // Test 5: Invalid Login
  results.push(await testInvalidLogin(registrationResult.email));
  
  // Test 6: Get Profile
  results.push(await testGetProfile());
  
  // Test 7: Unauthorized Access
  results.push(await testUnauthorizedAccess());
  
  // Test 8: Update Profile
  results.push(await testUpdateProfile());
  
  // Test 9: Weak Password
  results.push(await testWeakPassword());
  
  // Test 10: Invalid Email
  results.push(await testInvalidEmail());
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              📊 TEST SUMMARY                   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! Authentication system is working perfectly!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.\n');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return true;
  } catch (error) {
    console.log('\n❌ ERROR: Cannot connect to server at', BASE_URL);
    console.log('Please make sure the server is running with: npm start\n');
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runAllTests();
  }
})();
