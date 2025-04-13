 // api-tests.js
const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let preEnrollmentId = '';

// Test user data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test${Date.now()}@example.com`,
  phone: '555-123-4567',
  country: 'US',
  package: 'elite'
};

const adminCredentials = {
  email: 'admin@example.com',
  password: 'adminPassword123'
};

// Function to run all tests
async function runTests() {
  try {
    console.log('🧪 Starting API Tests...\n');
    
    await testAuthEndpoints();
    await testPreEnrollmentEndpoints();
    await testTeamEndpoints();
    await testAdminEndpoints();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

// 1. Authentication Endpoints
async function testAuthEndpoints() {
  console.log('Testing Authentication Endpoints...');
  
  // 1.1 Test registration (pre-enrollment)
  console.log('- Testing user registration');
  const regResponse = await axios.post(`${API_URL}/pre-enrollment`, testUser);
  assert(regResponse.status === 201, 'Registration should return 201 status');
  assert(regResponse.data.success === true, 'Registration should be successful');
  assert(regResponse.data.data.user.email === testUser.email, 'Email should match');
  userId = regResponse.data.data.user.id;
  preEnrollmentId = regResponse.data.data.preEnrollment.queuePosition;
  console.log(`  ✓ User registered with ID: ${userId}`);
  
  // 1.2 Test admin login
  console.log('- Testing admin login');
  const loginResponse = await axios.post(`${API_URL}/auth/login`, adminCredentials);
  assert(loginResponse.status === 200, 'Login should return 200 status');
  assert(loginResponse.data.token, 'Login should return auth token');
  authToken = loginResponse.data.token;
  console.log('  ✓ Admin logged in successfully');
  
  // 1.3 Test get current user
  console.log('- Testing get current user');
  const userResponse = await axios.get(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(userResponse.status === 200, 'Get user should return 200 status');
  assert(userResponse.data.data.email === adminCredentials.email, 'Email should match');
  console.log('  ✓ Retrieved current user successfully');
}

// 2. Pre-enrollment Endpoints
async function testPreEnrollmentEndpoints() {
  console.log('\nTesting Pre-enrollment Endpoints...');
  
  // 2.1 Test get pre-enrollment status
  console.log('- Testing get pre-enrollment status');
  const statusResponse = await axios.get(`${API_URL}/pre-enrollment/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(statusResponse.status === 200, 'Get status should return 200 status');
  assert(statusResponse.data.success === true, 'Request should be successful');
  assert(statusResponse.data.data.preEnrollment.status === 'waiting', 'Status should be waiting');
  console.log('  ✓ Retrieved pre-enrollment status successfully');
  
  // 2.2 Test activate pre-enrolled user
  console.log('- Testing pre-enrolled user activation');
  const activateResponse = await axios.put(`${API_URL}/pre-enrollment/activate/${userId}`, {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(activateResponse.status === 200, 'Activation should return 200 status');
  assert(activateResponse.data.success === true, 'Activation should be successful');
  assert(activateResponse.data.data.user.isActive === true, 'User should be active');
  assert(activateResponse.data.data.user.role === 'promoter', 'User should be promoter');
  console.log('  ✓ Activated pre-enrolled user successfully');
}

// 3. Team Endpoints
async function testTeamEndpoints() {
  console.log('\nTesting Team Endpoints...');
  
  // 3.1 Test get team structure
  console.log('- Testing get team structure');
  const structureResponse = await axios.get(`${API_URL}/team/structure`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(structureResponse.status === 200, 'Get structure should return 200 status');
  assert(structureResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved team structure successfully');
  
  // 3.2 Test get team downline
  console.log('- Testing get team downline');
  const downlineResponse = await axios.get(`${API_URL}/team/downline`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(downlineResponse.status === 200, 'Get downline should return 200 status');
  assert(downlineResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved team downline successfully');
  
  // 3.3 Test get team activity
  console.log('- Testing get team activity');
  const activityResponse = await axios.get(`${API_URL}/team/activity`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(activityResponse.status === 200, 'Get activity should return 200 status');
  assert(activityResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved team activity successfully');
  
  // 3.4 Test get team volume
  console.log('- Testing get team volume');
  const volumeResponse = await axios.get(`${API_URL}/team/volume`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(volumeResponse.status === 200, 'Get volume should return 200 status');
  assert(volumeResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved team volume successfully');
  
  // 3.5 Test get team growth metrics
  console.log('- Testing get team growth metrics');
  const growthResponse = await axios.get(`${API_URL}/team/growth`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(growthResponse.status === 200, 'Get growth should return 200 status');
  assert(growthResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved team growth metrics successfully');
}

// 4. Admin Endpoints
async function testAdminEndpoints() {
  console.log('\nTesting Admin Endpoints...');
  
  // 4.1 Test get all users
  console.log('- Testing get all users');
  const usersResponse = await axios.get(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(usersResponse.status === 200, 'Get users should return 200 status');
  assert(usersResponse.data.success === true, 'Request should be successful');
  assert(Array.isArray(usersResponse.data.data), 'Should return array of users');
  console.log('  ✓ Retrieved all users successfully');
  
  // 4.2 Test get user details
  console.log('- Testing get user details');
  const userDetailsResponse = await axios.get(`${API_URL}/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(userDetailsResponse.status === 200, 'Get user details should return 200 status');
  assert(userDetailsResponse.data.success === true, 'Request should be successful');
  assert(userDetailsResponse.data.data.user._id === userId, 'User ID should match');
  console.log('  ✓ Retrieved user details successfully');
  
  // 4.3 Test update user sponsor
  console.log('- Testing update user sponsor');
  // Get an admin user to set as sponsor
  const adminUsersResponse = await axios.get(`${API_URL}/admin/users?role=admin`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const adminUser = adminUsersResponse.data.data[0];
  
  const updateSponsorResponse = await axios.put(`${API_URL}/admin/users/${userId}/sponsor`, 
    { sponsorId: adminUser._id }, 
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  assert(updateSponsorResponse.status === 200, 'Update sponsor should return 200 status');
  assert(updateSponsorResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Updated user sponsor successfully');
  
  // 4.4 Test get dashboard stats
  console.log('- Testing get dashboard stats');
  const statsResponse = await axios.get(`${API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(statsResponse.status === 200, 'Get stats should return 200 status');
  assert(statsResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved dashboard stats successfully');
  
  // 4.5 Test system settings
  console.log('- Testing get system settings');
  const settingsResponse = await axios.get(`${API_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert(settingsResponse.status === 200, 'Get settings should return 200 status');
  assert(settingsResponse.data.success === true, 'Request should be successful');
  console.log('  ✓ Retrieved system settings successfully');
}

// Run all tests
runTests();