#!/bin/bash

# Farm Health Management System - Quick Start Script

echo "🐑 Farm Health Management System"
echo "=================================="
echo ""

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please ensure MongoDB is installed and running."
    echo "   Local: mongod"
    echo "   OR use MongoDB Atlas connection in .env.local"
    echo ""
fi

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Check .env.local
echo "Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cat > .env.local << EOF
MONGODB_URI=mongodb://localhost:27017/farm-health-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
    echo "✓ .env.local created. Please update MongoDB URI if needed."
    echo ""
fi

# Seed database
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    node seeders/seed.js
    echo ""
fi

# Start development server
echo "Starting development server..."
echo "Open http://localhost:3000 in your browser"
echo ""
echo "Demo credentials:"
echo "  SuperAdmin: admin@farm.com / admin123"
echo "  Manager: manager@farm.com / manager123"
echo "  Attendant: attendant@farm.com / attendant123"
echo ""
npm run dev
