#!/bin/bash

# Swiss Bank App Demo Launcher
echo "🚀 Starting Swiss Bank App in Demo Mode"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm detected"

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi

# Install backend dependencies if backend/node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        cd ..
        exit 1
    fi
    cd ..
else
    echo "✅ Backend dependencies already installed"
fi

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "🔧 Creating backend environment file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env (please edit with your settings if needed)"
fi

echo ""
echo "🎯 Demo Mode Instructions:"
echo "=========================="
echo "1. The app will run with mock data for demonstration"
echo "2. No database required for basic functionality"
echo "3. All features work with simulated data"
echo ""
echo "🚀 Starting servers..."
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $backend_pid $frontend_pid 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
backend_pid=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🌐 Starting frontend server..."
npm start > frontend.log 2>&1 &
frontend_pid=$!

echo ""
echo "✅ Servers starting..."
echo "📊 Backend: http://localhost:5000/api"
echo "🖥️  Frontend: http://localhost:3000"
echo ""
echo "📝 Demo Accounts:"
echo "   Username: demo@example.com"
echo "   Password: demo123"
echo ""
echo "💡 Press Ctrl+C to stop all servers"

# Wait for background processes
wait
