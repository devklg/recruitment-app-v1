const mongoose = require('mongoose');
// Validate JWT_EXPIRE format
const validateJwtExpire = (value) => {
  if (!value) return false;
  // Check if it's a number (seconds)
  if (!isNaN(value)) return true;
  // Check if it's a valid time string (e.g., '60s', '2h', '1d', '7d')
  const timeRegex = /^(\d+)(s|m|h|d)$/;
  const match = value.match(timeRegex);
  if (!match) return false;
  
  const [, num, unit] = match;
  return parseInt(num) > 0;
};
// Database connection function with unified settings
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true // Build indexes
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn; // Return connection object for testing/verification
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};
// Export both functions
module.exports = { connectDB, validateJwtExpire };