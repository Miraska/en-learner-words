#!/bin/bash

echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend running on http://localhost:5000"
echo "Frontend running on http://localhost:3000"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
