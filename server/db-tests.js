// db-tests.js
const mongoose = require('mongoose');
const assert = require('assert');
const dotenv = require('dotenv');

// Load models
const User = require('./models/User');
const TeamStructure = require('./models/TeamStructure');
const PreEnrollment = require('./models/PreEnrollment');

// Load environment variables
dotenv.config();
// Set required environment variables for testing if not present
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
}
// Connect to database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Test variables
let testUserId = null;
let testTeamStructureId = null;
let testPreEnrollmentId = null;

// Test suite
async function runDatabaseTests() {
  try {
    console.log('🧪 Starting Database Tests...\n');
    
    await testUserModel();
    await testTeamStructureModel();
    await testPreEnrollmentModel();
    await testRelationships();
    
    console.log('\n✅ All database tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Cleanup test data
    await cleanup();
    mongoose.disconnect();
  }
}

// 1. User Model Tests
async function testUserModel() {
  console.log('Testing User Model...');
  
  // 1.1 Test user creation
  console.log('- Testing user creation');
  const user = new User({
    firstName: 'DB',
    lastName: 'Test',
    email: `db-test-${Date.now()}@example.com`,
    phone: '555-123-4567',
    country: 'US',
    password: 'password123',
    package: 'elite',
    role: 'pre-enrollee'
  });
  
  const savedUser = await user.save();
  testUserId = savedUser._id;
  
  // Verify saved user
  assert(savedUser._id, 'User should have an ID');
  assert(savedUser.firstName === 'DB', 'First name should match');
  assert(savedUser.email.includes('db-test'), 'Email should match');
  assert(savedUser.referralCode, 'User should have a referral code');
  console.log(`  ✓ User created with ID: ${savedUser._id}`);
  
  // 1.2 Test user password hashing
  console.log('- Testing password hashing');
  const userWithPassword = await User.findById(savedUser._id).select('+password');
  assert(userWithPassword.password !== 'password123', 'Password should be hashed');
  const passwordMatch = await userWithPassword.matchPassword('password123');
  assert(passwordMatch === true, 'Password should match when using matchPassword method');
  console.log('  ✓ Password hashed correctly');
  
  // 1.3 Test user JWT token generation
  console.log('- Testing JWT token generation');
  try {
  const token = savedUser.getSignedJwtToken();
  assert(token && typeof token === 'string', 'Should generate a JWT token');
  console.log('  ✓ JWT token generated correctly');
  } catch (error) {
    console.error('JWT Token Generation Error:', error);
    throw error;
}
}
async function testTeamStructureModel() {
  console.log('\nTesting Team Structure Model...');
  
  // 2.1 Test team structure creation
  console.log('- Testing team structure creation');
  const teamStructure = new TeamStructure({
    user: testUserId,
    position: 'root',
    enrollmentOrder: 1,
    depth: 0
  });
  
  const savedTeamStructure = await teamStructure.save();
  testTeamStructureId = savedTeamStructure._id;
  
  // Verify saved team structure
  assert(savedTeamStructure._id, 'Team structure should have an ID');
  assert(savedTeamStructure.user.toString() === testUserId.toString(), 'User ID should match');
  assert(savedTeamStructure.position === 'root', 'Position should be root');
  assert(savedTeamStructure.totalTeamSize === 1, 'Total team size should be 1');
  console.log(`  ✓ Team structure created with ID: ${savedTeamStructure._id}`);
  
  // 2.2 Test team structure update
  console.log('- Testing team structure update');
  savedTeamStructure.leftLegVolume = 100;
  savedTeamStructure.rightLegVolume = 200;
  await savedTeamStructure.save();
  
  const updatedTeamStructure = await TeamStructure.findById(savedTeamStructure._id);
  assert(updatedTeamStructure.leftLegVolume === 100, 'Left leg volume should be 100');
  assert(updatedTeamStructure.rightLegVolume === 200, 'Right leg volume should be 200');
  console.log('  ✓ Team structure updated correctly');
}

// 3. Pre-Enrollment Model Tests
async function testPreEnrollmentModel() {
  console.log('\nTesting Pre-Enrollment Model...');
  
  // 3.1 Test pre-enrollment creation
  console.log('- Testing pre-enrollment creation');
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
  
  const preEnrollment = new PreEnrollment({
    user: testUserId,
    queuePosition: 1,
    tentativeParent: testUserId, // Just for testing
    tentativePosition: 'left',
    status: 'waiting',
    expiryDate,
    placementPreference: 'auto'
  });
  
  const savedPreEnrollment = await preEnrollment.save();
  testPreEnrollmentId = savedPreEnrollment._id;
  
  // Verify saved pre-enrollment
  assert(savedPreEnrollment._id, 'Pre-enrollment should have an ID');
  assert(savedPreEnrollment.user.toString() === testUserId.toString(), 'User ID should match');
  assert(savedPreEnrollment.queuePosition === 1, 'Queue position should be 1');
  assert(savedPreEnrollment.status === 'waiting', 'Status should be waiting');
  console.log(`  ✓ Pre-enrollment created with ID: ${savedPreEnrollment._id}`);
  
  // 3.2 Test pre-enrollment update
  console.log('- Testing pre-enrollment update');
  savedPreEnrollment.status = 'processing';
  await savedPreEnrollment.save();
  
  const updatedPreEnrollment = await PreEnrollment.findById(savedPreEnrollment._id);
  assert(updatedPreEnrollment.status === 'processing', 'Status should be processing');
  console.log('  ✓ Pre-enrollment updated correctly');
}

// 4. Test Relationships Between Models
async function testRelationships() {
  console.log('\nTesting Relationships Between Models...');
  
  // 4.1 Test user -> team structure relationship
  console.log('- Testing user -> team structure relationship');
  const teamStructure = await TeamStructure.findOne({ user: testUserId });
  assert(teamStructure, 'Should find team structure by user ID');
  assert(teamStructure.user.toString() === testUserId.toString(), 'User ID should match');
  console.log('  ✓ User -> team structure relationship verified');
  
  // 4.2 Test user -> pre-enrollment relationship
  console.log('- Testing user -> pre-enrollment relationship');
  const preEnrollment = await PreEnrollment.findOne({ user: testUserId });
  assert(preEnrollment, 'Should find pre-enrollment by user ID');
  assert(preEnrollment.user.toString() === testUserId.toString(), 'User ID should match');
  console.log('  ✓ User -> pre-enrollment relationship verified');
  
  // 4.3 Test populating user in team structure
  console.log('- Testing populating user in team structure');
  const populatedTeamStructure = await TeamStructure.findById(testTeamStructureId).populate('user');
  assert(populatedTeamStructure.user.firstName === 'DB', 'User firstName should be populated');
  assert(populatedTeamStructure.user.email.includes('db-test'), 'User email should be populated');
  console.log('  ✓ User population in team structure verified');
}

// Cleanup test data
async function cleanup() {
  console.log('\nCleaning up test data...');
  
  if (testUserId) {
    await User.findByIdAndDelete(testUserId);
  }
  
  if (testTeamStructureId) {
    await TeamStructure.findByIdAndDelete(testTeamStructureId);
  }
  
  if (testPreEnrollmentId) {
    await PreEnrollment.findByIdAndDelete(testPreEnrollmentId);
  }
  
  console.log('  ✓ Test data cleaned up');
}

// Run tests
runDatabaseTests();