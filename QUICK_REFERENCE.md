# Developer Quick Reference

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Seed database
node seeders/seed.js

# Windows quick start
start.bat

# Mac/Linux quick start
bash start.sh
```

## Environment Setup

### .env.local Configuration
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/farm-health-app

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farm-health-app

# Security
JWT_SECRET=your-secret-key-change-in-production

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## API Endpoints Reference

### Authentication (Public)
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Animals (Protected)
- `GET /api/animals` - List animals
- `POST /api/animals` - Create animal
- `GET /api/animals/[id]` - Get animal details
- `PUT /api/animals/[id]` - Update animal
- `DELETE /api/animals/[id]` - Delete animal

### Health Records (Protected)
- `POST /api/feeding` - Log feeding
- `GET /api/feeding?animalId=[id]` - Get feeding history
- `POST /api/treatment` - Log treatment
- `GET /api/treatment?animalId=[id]` - Get treatment history
- `POST /api/weight` - Record weight
- `GET /api/weight?animalId=[id]` - Get weight history

### Inventory (Protected)
- `GET /api/inventory` - List items
- `POST /api/inventory` - Add item

### Finance (Protected)
- `GET /api/finance` - List records
- `POST /api/finance` - Add record

### Users (SuperAdmin Only)
- `GET /api/users` - List users
- `PUT /api/users` - Update user
- `DELETE /api/users` - Delete user

## Authentication Flow

```javascript
// 1. Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await res.json();

// 2. Store token
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// 3. Use token in requests
fetch('/api/animals', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Role-Based Access Control

### API Request Example
```javascript
// Requires: SuperAdmin, Manager, or Attendant role
fetch('/api/animals', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Role Permissions
| Endpoint | SuperAdmin | Manager | Attendant |
|----------|-----------|---------|-----------|
| GET /api/animals | ✓ | ✓ | ✓ |
| POST /api/animals | ✓ | ✓ | ✗ |
| PUT /api/animals/[id] | ✓ | ✓ | ✗ |
| DELETE /api/animals/[id] | ✓ | ✓ | ✗ |
| POST /api/feeding | ✓ | ✓ | ✓ |
| POST /api/treatment | ✓ | ✓ | ✓ |
| GET/POST /api/finance | ✓ | ✓ | ✗ |
| GET/PUT/DELETE /api/users | ✓ | ✗ | ✗ |

## Database Models

### Animal Schema
```javascript
{
  tagId: String (unique),
  name: String,
  species: String,
  breed: String,
  gender: String,
  dob: Date,
  status: String,
  location: String,
  paddock: String,
  treatmentHistory: [TreatmentSchema],
  feedingHistory: [FeedingSchema],
  weightHistory: [WeightSchema],
  vaccinationRecords: [VaccinationSchema],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  pin: String,
  role: Enum["SuperAdmin", "Manager", "Attendant"],
  createdAt: Date,
  updatedAt: Date
}
```

## Component Structure

### Pages
- `/` - Dashboard
- `/login` - Login page
- `/register` - Registration
- `/manage/animals` - Animal management
- `/manage/inventory` - Inventory management
- `/manage/users` - User management

### Components
- `Navbar` - Navigation and logout
- `DashboardStats` - Statistics display
- `AnimalsList` - Animals table
- `AddAnimalForm` - Add animal form
- `StatCard` - Stats card component

## File Organization

```
pages/                    # Page components
├── api/                  # API routes
│   ├── animals/
│   ├── auth/
│   ├── feeding/
│   ├── treatment/
│   ├── weight/
│   ├── inventory/
│   ├── finance/
│   └── users/
├── manage/              # Management pages
└── index.js            # Dashboard

components/              # React components
├── animals/
├── dashboard/
├── users/
└── shared/

lib/                     # Utilities
├── mongodb.js          # DB connection

models/                  # Mongoose schemas
├── Animal.js
├── User.js
├── Medication.js
├── Inventory.js
└── Finance.js

utils/                  # Helper functions
├── auth.js            # JWT functions
└── middleware.js      # RBAC middleware

styles/                # Global styles
└── globals.css
```

## Common Tasks

### Add New API Endpoint
```javascript
// pages/api/your-route.js
import dbConnect from "@/lib/mongodb";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  
  if (req.method === "GET") {
    // GET logic
  } else if (req.method === "POST") {
    // POST logic
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
```

### Add New Component
```javascript
// components/your-component.js
import { useState, useEffect } from "react";

export default function YourComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return (
    <div>
      {/* JSX here */}
    </div>
  );
}
```

### Fetch with Authentication
```javascript
const token = localStorage.getItem("token");

fetch("/api/animals", {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

## Testing Credentials

```
Admin:     admin@farm.com / admin123
Manager:   manager@farm.com / manager123
Attendant: attendant@farm.com / attendant123
```

## Debug Tips

### Check Browser Console
```javascript
// View stored token
console.log(localStorage.getItem('token'));

// View user info
console.log(JSON.parse(localStorage.getItem('user')));

// Clear storage
localStorage.clear();
```

### MongoDB Commands
```bash
# Connect to local database
mongosh

# Switch to farm database
use farm-health-app

# View collections
show collections

# Check documents
db.animals.find()
db.users.find()
```

## Performance Tips

1. **API Calls**: Minimize requests by combining data fetching
2. **Re-rendering**: Use `useCallback` and `useMemo` for optimization
3. **Images**: Optimize and compress before using
4. **Bundle**: Use `npm run build` to check bundle size
5. **Caching**: Implement proper cache headers in production

## Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Update `MONGODB_URI` to production database
- [ ] Set `NEXT_PUBLIC_API_URL` to production domain
- [ ] Run `npm run build` and test production build
- [ ] Set environment variables in hosting platform
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Enable monitoring/logging

## Error Messages

| Error | Solution |
|-------|----------|
| `EADDRINUSE: port 3000` | Port in use, kill process or use different port |
| `MongoError: connect ECONNREFUSED` | MongoDB not running, start MongoDB service |
| `JWT malformed` | Invalid token format, re-login |
| `Unauthorized: Invalid token` | Token expired or invalid, re-login |
| `Forbidden: Insufficient permissions` | User role doesn't have access |
| `Cannot find module '@/...'` | Check jsconfig.json path aliases |

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Docs](https://docs.mongodb.com)
- [Mongoose Guide](https://mongoosejs.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Docs](https://react.dev)
- [JWT.io](https://jwt.io)

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
