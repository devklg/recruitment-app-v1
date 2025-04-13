#!/bin/bash
echo "🧪 Running All Talk Fusion App Tests 🧪"
echo "========================================"

# Start backend server in test mode
echo "📡 Starting backend server..."
cd server
NODE_ENV=test node server.js &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Run backend API tests
echo "🔍 Running API tests..."
npm run test:api

# Run database tests
echo "💾 Running database tests..."
npm run test:db

# Start frontend dev server
echo "🖥️ Starting frontend server..."
cd ../client
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 10

# Run component tests
echo "🧩 Running component tests..."
npm test

# Run end-to-end tests
echo "🔄 Running end-to-end tests..."
npm run test:e2e

# Run load tests
echo "⚡ Running load tests..."
cd ../server
npm run test:load

# Cleanup
echo "🧹 Cleaning up processes..."
kill $BACKEND_PID
kill $FRONTEND_PID

echo "✅ All tests completed!"