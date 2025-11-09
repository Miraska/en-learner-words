#!/bin/bash

echo "Running backend tests..."
cd backend
npm test

echo "Running frontend tests..."
cd ../frontend
npm test

echo "All tests completed!"
