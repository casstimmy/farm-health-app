# Installation & Setup Guide

## System Requirements

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **MongoDB**: v4.4 or higher (local or Atlas cloud)
- **RAM**: 2GB minimum
- **Disk Space**: 500MB minimum

## Installation Steps

### Step 1: Verify Node.js Installation

```bash
node --version   # Should be v16+
npm --version    # Should be v7+
```

### Step 2: MongoDB Setup

#### Option A: Local MongoDB (Windows)

1. Download MongoDB from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB will start automatically as a service
4. Verify: `mongosh --version`

#### Option B: MongoDB Atlas (Cloud - Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and database name

### Step 3: Configure Environment Variables

Create/update `.env.local` in the project root:

```env
# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/farm-health-app

# OR For MongoDB Atlas (replace credentials)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farm-health-app?retryWrites=true&w=majority

# JWT Secret (Change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 4: Install Dependencies

```bash
npm install
```

This installs all required packages:
- next, react, react-dom
- mongoose (MongoDB ODM)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- tailwindcss (styling)
- react-icons (UI icons)
- chart.js, react-chartjs-2 (charts)

### Step 5: Seed the Database

Populate with sample data for testing:

```bash
node seeders/seed.js
```

**Expected Output:**
```
Old data cleared.
Users seeded.
Animals seeded.
Medications seeded.
Inventory seeded.
Finance records seeded.
Weight history seeded.
Treatment history seeded.
Feeding history seeded.
Vaccination history seeded.
✓ Seeding complete. Database is ready.
```

### Step 6: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
> farm-health-app@0.1.0 dev
> next dev

  ▲ Next.js 16.1.3
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

Open your browser to [http://localhost:3000](http://localhost:3000)

## Quick Start (Windows Users)

Run the provided batch file:

```bash
start.bat
```

This will:
1. Install dependencies if needed
2. Create `.env.local` if missing
3. Optionally seed the database
4. Start the development server

## Quick Start (Mac/Linux Users)

Run the provided shell script:

```bash
bash start.sh
```

## Demo Credentials

After seeding, use these accounts to test:

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | admin@farm.com | admin123 |
| Manager | manager@farm.com | manager123 |
| Attendant | attendant@farm.com | attendant123 |

## Verify Installation

### Check MongoDB Connection

```bash
# Test connection with mongosh
mongosh mongodb://localhost:27017/farm-health-app

# Or test with Node.js
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/farm-health-app').then(() => console.log('✓ Connected')).catch(e => console.error('✗ Error:', e.message))"
```

### Check API Health

After starting the server:

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@farm.com","password":"admin123"}'
```

You should receive a JSON response with a token.

## Build for Production

```bash
# Build optimized version
npm run build

# Start production server
npm start
```

The production build will be in the `.next` folder.

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseError: Cannot connect to MongoDB`

**Solutions:**
1. Ensure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Check connection string in `.env.local`

3. For Atlas, ensure:
   - Username and password are correct
   - IP address is whitelisted (0.0.0.0/0 for development)
   - Database name exists

### Port 3000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill the process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # Mac/Linux

# Or use different port
npm run dev -- -p 3001
```

### Dependencies Not Installing

**Error:** `npm ERR! code ERESOLVE`

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### JWT Token Issues

**Error:** `Unauthorized: Invalid token`

**Solutions:**
1. Clear browser localStorage: `localStorage.clear()`
2. Re-login to get a fresh token
3. Ensure `JWT_SECRET` is set in `.env.local`
4. Check token hasn't expired (tokens last 7 days)

### Permission Denied (seeders/seed.js)

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Use node explicitly
node seeders/seed.js

# Or on Mac/Linux, add executable permission
chmod +x seeders/seed.js
node seeders/seed.js
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/farm-health-app` |
| `JWT_SECRET` | Secret for JWT signing | `your-secret-key` |
| `NEXT_PUBLIC_API_URL` | Frontend API endpoint | `http://localhost:3000` |

**Security Note:** Never commit `.env.local` to version control. Add it to `.gitignore`.

## Next Steps

1. **Login** to the application with demo credentials
2. **Explore** the dashboard and existing data
3. **Create** new animals and records
4. **Review** the API documentation in README.md
5. **Customize** styles in `styles/globals.css`
6. **Extend** features by adding new components

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

## Getting Help

If you encounter issues:

1. Check error messages carefully
2. Review this troubleshooting guide
3. Check `.env.local` configuration
4. Verify MongoDB is running
5. Check network connectivity (for Atlas)

---

**Happy Farming! 🐑🐄** Ready to manage your farm's health records.
