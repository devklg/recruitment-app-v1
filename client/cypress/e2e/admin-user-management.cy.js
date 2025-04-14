import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
const API_URL = 'http://localhost:5000/api';
let authToken = '';
describe('Admin User Management API', () => {
  beforeEach(async () => {
    // Login as admin to get auth token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'adminPassword123'
    });
    authToken = loginResponse.data.token;
  });
  it('should get user list with filters', async () => {
    const response = await axios.get(`${API_URL}/admin/users?role=pre-enrollee`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });
  it('should get user details', async () => {
    // First get a user ID
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const userId = usersResponse.data.data[0]._id;
    const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.user).toBeDefined();
  });
  it('should update user sponsor', async () => {
    // Get a user and a sponsor
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const userId = usersResponse.data.data[0]._id;
    const sponsorId = usersResponse.data.data[1]._id;
    const response = await axios.put(
      `${API_URL}/admin/users/${userId}/sponsor`,
      { sponsorId },
      { headers: { Authorization: `Bearer ${authToken}` }}
    );
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.sponsor.toString()).toBe(sponsorId);
  });
  it('should handle printing user list', async () => {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Accept': 'application/pdf'
      }
    });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(Array.isArray(response.data.data)).toBe(true);
  });
});