// load-tests.js
import http from 'k6/http';
import { sleep, check } from 'k6';

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: '1m', target: 50 },  // Stay at 50 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

// Shared variables
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Helper for generating random data
function generateRandomUser() {
  const id = Math.floor(Math.random() * 1000000);
  return {
    firstName: `Test${id}`,
    lastName: 'User',
    email: `test-user-${id}@example.com`,
    phone: `555-${id}`.substring(0, 10),
    country: 'US',
    package: ['starter', 'elite', 'pro'][Math.floor(Math.random() * 3)]
  };
}

// Test setup - runs once per VU
export function setup() {
  // Login as admin to get auth token
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: 'adminPassword123'
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginResponse = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  const token = JSON.parse(loginResponse.body).token;
  
  return { token };
}

// Default function that is run for each VU
export default function(data) {
  const authToken = data.token;
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  // 1. Test pre-enrollment endpoint
  const user = generateRandomUser();
  const preEnrollPayload = JSON.stringify(user);
  
  const preEnrollResponse = http.post(`${BASE_URL}/pre-enrollment`, preEnrollPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  check(preEnrollResponse, {
    'pre-enrollment successful': (r) => r.status === 201,
    'returned user data': (r) => JSON.parse(r.body).data.user !== undefined,
  });
  
  // Extract user ID for further tests
  let userId = '';
  try {
    userId = JSON.parse(preEnrollResponse.body).data.user.id;
  } catch (e) {
    console.error('Failed to extract user ID:', e);
  }
  
  // Small delay between requests
  sleep(1);
  
  // 2. Test get pre-enrollment status
  if (userId) {
    const statusResponse = http.get(`${BASE_URL}/pre-enrollment/${userId}`, authParams);
    
    check(statusResponse, {
      'get status successful': (r) => r.status === 200,
      'status is waiting': (r) => {
        try {
          return JSON.parse(r.body).data.preEnrollment.status === 'waiting';
        } catch (e) {
          return false;
        }
      },
    });
    
    // Small delay between requests
    sleep(1);
    
    // 3. Test activating pre-enrolled user
    const activateResponse = http.put(`${BASE_URL}/pre-enrollment/activate/${userId}`, {}, authParams);
    
    check(activateResponse, {
      'activation successful': (r) => r.status === 200,
      'user is now active': (r) => {
        try {
          return JSON.parse(r.body).data.user.isActive === true;
        } catch (e) {
          return false;
        }
      },
    });
  }
  
  // 4. Test get all users (admin endpoint)
  const usersResponse = http.get(`${BASE_URL}/admin/users?limit=10`, authParams);
  
  check(usersResponse, {
    'get users successful': (r) => r.status === 200,
    'returns users array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).data);
      } catch (e) {
        return false;
      }
    },
  });
  
  // 5. Test get dashboard stats
  const statsResponse = http.get(`${BASE_URL}/admin/dashboard`, authParams);
  
  check(statsResponse, {
    'get stats successful': (r) => r.status === 200,
    'returns stats data': (r) => {
      try {
        return JSON.parse(r.body).data.totalUsers !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  // Wait between iterations
  sleep(3);
}