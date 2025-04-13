const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const cron = require('node-cron');
const { 
  processPreEnrollmentQueue,
  processTeamCommissions, 
  processMegaMatchingBonuses,
  processLeadershipPool 
} = require('./services/placement');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pre-enrollment', require('./routes/preEnrollment'));
app.use('/api/team', require('./routes/team'));
app.use('/api/admin', require('./routes/admin'));

// Error handler
app.use(errorHandler);

// Schedule tasks
// Process pre-enrollment queue every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running pre-enrollment queue processor...');
  try {
    await processPreEnrollmentQueue();
    console.log('Pre-enrollment queue processing completed');
  } catch (error) {
    console.error('Error processing pre-enrollment queue:', error);
  }
});

// Process team commissions weekly on Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('Running team commission processor...');
  try {
    // await processTeamCommissions(); // Commission code excluded as requested
    console.log('Team commission processing skipped as requested');
    
    // await processMegaMatchingBonuses(); // Commission code excluded as requested
    console.log('Mega matching bonus processing skipped as requested');
  } catch (error) {
    console.error('Error processing commissions:', error);
  }
});

// Process leadership pool monthly on the 1st at midnight
cron.schedule('0 0 1 * *', async () => {
  console.log('Running leadership pool processor...');
  try {
    // await processLeadershipPool(); // Commission code excluded as requested
    console.log('Leadership pool processing skipped as requested');
  } catch (error) {
    console.error('Error processing leadership pool:', error);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
