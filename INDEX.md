# Farm Health Management System - Project Index

## 📚 Documentation Files

### Getting Started
1. **[README.md](README.md)** - Complete project overview and feature list
2. **[INSTALLATION.md](INSTALLATION.md)** - Step-by-step setup instructions
3. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What's been delivered and implementation details
4. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Developer cheat sheet

### Quick Start
- **[start.bat](start.bat)** - Windows quick start script
- **[start.sh](start.sh)** - Mac/Linux quick start script

---

## 🏗️ Project Architecture

### Frontend Layer (React/Next.js)
```
pages/
├── index.js                    # Dashboard home page
├── login.js                    # User login page
├── register.js                 # User registration page
├── _app.js                     # Next.js app wrapper with styles
└── manage/
    ├── animals.js              # Animals management page
    ├── inventory.js            # Inventory management page
    └── users.js                # User management page
```

### API Layer (Next.js API Routes)
```
pages/api/
├── auth/
│   ├── login.js               # Authentication endpoint
│   └── register.js            # User registration endpoint
├── animals/
│   ├── index.js               # GET/POST animals
│   └── [id].js                # GET/PUT/DELETE individual animal
├── feeding/
│   └── index.js               # Feeding record management
├── treatment/
│   └── index.js               # Treatment record management
├── weight/
│   └── index.js               # Weight tracking
├── inventory/
│   └── index.js               # Inventory management
├── finance/
│   └── index.js               # Financial records
└── users/
    └── index.js               # User management (SuperAdmin only)
```

### Component Layer (React)
```
components/
├── animals/
│   ├── AddAnimalForm.js       # Form to add new animals
│   └── AnimalsList.js         # Display animals in table
├── dashboard/
│   └── DashboardStats.js      # Dashboard statistics cards
├── users/                     # User-related components
└── shared/
    ├── Navbar.js              # Main navigation bar
    └── StatCard.js            # Reusable statistic card
```

### Data Layer (MongoDB/Mongoose)
```
models/
├── Animal.js                  # Animal schema with health records
├── User.js                    # User authentication schema
├── Medication.js              # Medication inventory
├── Inventory.js               # General inventory items
└── Finance.js                 # Financial records
```

### Utilities
```
lib/
└── mongodb.js                 # MongoDB connection handler

utils/
├── auth.js                    # JWT token utilities
└── middleware.js              # Role-based access control

styles/
└── globals.css               # Global styles and utilities
```

---

## 🎯 Key Features by File

### Authentication & Security
- `pages/api/auth/login.js` - JWT login functionality
- `pages/api/auth/register.js` - User registration with password hashing
- `utils/auth.js` - Token generation and verification
- `utils/middleware.js` - RBAC enforcement

### Animal Management
- `pages/api/animals/index.js` - List and create animals
- `pages/api/animals/[id].js` - Individual animal operations
- `models/Animal.js` - Animal schema with embedded health records
- `components/animals/AnimalsList.js` - Display animals
- `components/animals/AddAnimalForm.js` - Add new animals

### Health Records
- `pages/api/feeding/index.js` - Feeding logs
- `pages/api/treatment/index.js` - Treatment history
- `pages/api/weight/index.js` - Weight tracking
- Embedded in `models/Animal.js`

### Inventory & Finance
- `pages/api/inventory/index.js` - Inventory management
- `pages/api/finance/index.js` - Financial records
- `models/Inventory.js` - Inventory schema
- `models/Finance.js` - Finance schema

### User Interface
- `pages/index.js` - Dashboard with statistics
- `components/dashboard/DashboardStats.js` - Stats display
- `components/shared/Navbar.js` - Navigation
- `pages/manage/animals.js` - Animal management page
- `pages/manage/inventory.js` - Inventory page
- `pages/manage/users.js` - User management page

### Database
- `lib/mongodb.js` - Connection pooling and handler
- `seeders/seed.js` - Database population script

---

## 📊 Database Schemas

### Animal
- tagId (unique)
- name, species, breed, gender
- date of birth, acquisition info
- location, paddock, status
- treatmentHistory (array)
- feedingHistory (array)
- weightHistory (array)
- vaccinationRecords (array)

### User
- name, email (unique)
- password (hashed)
- pin
- role (SuperAdmin, Manager, Attendant)

### Medication
- name, category
- purpose, dosage
- expiration date

### Inventory
- item, quantity
- category
- dateAdded

### Finance
- date, month
- item, category
- amount, status
- notes

---

## 🔌 API Endpoints Summary

### Authentication (Public)
```
POST   /api/auth/login              Login user
POST   /api/auth/register           Register new user
```

### Animals (Protected)
```
GET    /api/animals                 List all animals
POST   /api/animals                 Create new animal
GET    /api/animals/[id]            Get animal details
PUT    /api/animals/[id]            Update animal
DELETE /api/animals/[id]            Delete animal
```

### Health Records (Protected)
```
POST   /api/feeding                 Log feeding
GET    /api/feeding?animalId=x      Get feeding history
POST   /api/treatment               Log treatment
GET    /api/treatment?animalId=x    Get treatment history
POST   /api/weight                  Record weight
GET    /api/weight?animalId=x       Get weight history
```

### Inventory & Finance (Protected)
```
GET    /api/inventory               List inventory
POST   /api/inventory               Add inventory item
GET    /api/finance                 List financial records
POST   /api/finance                 Add financial record
```

### Users (SuperAdmin Only)
```
GET    /api/users                   List users
PUT    /api/users                   Update user
DELETE /api/users                   Delete user
```

---

## 🚀 Getting Started

### 1. Read Documentation
- Start with [README.md](README.md) for overview
- Then read [INSTALLATION.md](INSTALLATION.md) for setup

### 2. Install & Configure
```bash
npm install
# Edit .env.local with MongoDB URI
```

### 3. Seed Database
```bash
node seeders/seed.js
```

### 4. Start Development
```bash
npm run dev
```

### 5. Login
- Visit http://localhost:3000
- Use demo credentials from [INSTALLATION.md](INSTALLATION.md)

---

## 🔐 Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Authentication**: 7-day token expiration
- **Role-Based Access Control**: SuperAdmin, Manager, Attendant roles
- **Protected Routes**: Frontend pages require authentication
- **Protected APIs**: All endpoints validate JWT tokens
- **Error Handling**: No sensitive info in error messages

---

## 📱 User Interface

### Pages
- Dashboard (`/`) - Overview with statistics
- Login (`/login`) - User authentication
- Register (`/register`) - New user signup
- Animals (`/manage/animals`) - Animal management
- Inventory (`/manage/inventory`) - Inventory management
- Users (`/manage/users`) - User management (SuperAdmin)

### Components
- Navbar - Navigation and user menu
- DashboardStats - Statistics cards
- AnimalsList - Animals table
- AddAnimalForm - Add animal form
- StatCard - Reusable stat display

---

## 🧪 Testing

### Demo Credentials
```
SuperAdmin: admin@farm.com / admin123
Manager: manager@farm.com / manager123
Attendant: attendant@farm.com / attendant123
```

### Sample Data
- 3 users with different roles
- 3 animals with health histories
- 5 medications
- 4 inventory items
- 5 financial records
- Complete treatment, feeding, weight histories

---

## 📦 Dependencies

### Core
- next@16.1.3
- react@19.0.0
- react-dom@19.0.0

### Database
- mongoose@8.11.1

### Authentication
- jsonwebtoken@9.1.2
- bcryptjs@2.4.3

### Styling
- tailwindcss@4.0.0

### UI/Icons
- react-icons@6.2.0

### Charts
- chart.js@4.4.7
- react-chartjs-2@5.2.0

### Environment
- dotenv@16.4.7

---

## 📋 Configuration Files

- **package.json** - Dependencies and scripts
- **jsconfig.json** - Path aliases configuration
- **next.config.mjs** - Next.js configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **postcss.config.mjs** - PostCSS configuration
- **.env.local** - Environment variables
- **.gitignore** - Git ignore rules

---

## 🔄 Development Workflow

1. **Create Feature** → Add files to appropriate directory
2. **Database** → Update schema if needed in `models/`
3. **API** → Create endpoint in `pages/api/`
4. **Component** → Create React component in `components/`
5. **Page** → Create page in `pages/` if new route
6. **Test** → Test with dev server: `npm run dev`
7. **Build** → Build for production: `npm run build`

---

## 🐛 Troubleshooting

Refer to [INSTALLATION.md](INSTALLATION.md) for:
- MongoDB connection issues
- Port already in use
- Dependencies not installing
- JWT token problems
- Permission denied errors

---

## 📞 Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)

---

## ✅ Completion Status

- ✓ Project scaffolding complete
- ✓ All dependencies installed
- ✓ Database schemas created
- ✓ API endpoints implemented
- ✓ React components built
- ✓ Authentication system implemented
- ✓ RBAC middleware functional
- ✓ Sample data seeded
- ✓ Production build verified
- ✓ Documentation complete

---

## 🎉 Ready to Start!

The project is fully functional and ready for:
1. Development and feature enhancement
2. Testing with sample data
3. Production deployment
4. Team collaboration

**Next Step**: Read [INSTALLATION.md](INSTALLATION.md) and run `npm run dev`

---

**Last Updated**: January 17, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete & Ready
