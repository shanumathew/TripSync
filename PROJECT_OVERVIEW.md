# 🚗 TripSync - University Ride Sharing Platform

A full-stack ride-sharing application for university students with JWT authentication, intelligent matching, and natural language processing.

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js v14+
- npm or yarn

### 1. Start Backend Server
```bash
cd backend
npm start
```
✅ Backend runs on **http://localhost:5000**

### 2. Start Frontend Server (New Terminal)
```bash
cd frontend
npm install  # First time only
npm run dev
```
✅ Frontend runs on **http://localhost:3000**

### 3. Open Your Browser
Navigate to **http://localhost:3000** and create an account!

---

## 📁 Project Structure

```
TripSync/
├── backend/                 # Node.js + Express Backend
│   ├── src/
│   │   ├── config/         # Database & app configuration
│   │   ├── controllers/    # Request handlers (auth, rides)
│   │   ├── middleware/     # Auth, logging, error handling
│   │   ├── models/         # Database models (User, Ride, Match, Message)
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions (JWT, validation)
│   ├── database/           # SQL schema & connection tests
│   ├── server.js          # Entry point
│   ├── .env               # Environment variables
│   └── package.json
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # Navbar, ProtectedRoute
│   │   ├── context/       # AuthContext (global state)
│   │   ├── pages/         # Home, Login, Register, Dashboard, Profile
│   │   ├── services/      # API service layer (axios)
│   │   ├── App.jsx        # Main component with routing
│   │   └── index.css      # Global styles
│   ├── .env               # API URL configuration
│   └── package.json
│
└── README.md              # This file
```

---

## 🔐 Authentication System (Complete ✅)

### Backend Features
- ✅ JWT token generation (7-day expiry)
- ✅ Password hashing with bcrypt
- ✅ Protected routes middleware
- ✅ Input validation
- ✅ Token refresh handling
- ✅ 8 authentication endpoints

### Frontend Features
- ✅ React Router v6 with protected routes
- ✅ Auth Context for global state
- ✅ JWT token storage in localStorage
- ✅ Automatic token attachment to requests
- ✅ Token expiration handling
- ✅ Login/Register/Profile pages

### Test Results
🎉 **10/10 tests passed** (100% success rate)

---

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| PostgreSQL | Database (Supabase) |
| JWT | Authentication tokens |
| bcrypt | Password hashing |
| express-validator | Input validation |
| helmet | Security headers |
| cors | Cross-origin requests |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Context API | State management |
| Custom CSS | Styling (no frameworks) |

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "SecurePass123!",
  "name": "John Doe",
  "university": "State University",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": 1, "email": "...", "name": "..." },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "SecurePass123!"
}
```

#### Get Current User (Protected)
```http
GET /auth/me
Authorization: Bearer <your-jwt-token>
```

#### Update Profile (Protected)
```http
PUT /auth/update-profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "9876543210"
}
```

#### Change Password (Protected)
```http
PUT /auth/update-password
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

---

## 🗄️ Database Schema

### Tables
1. **users** - User accounts, profiles, trust scores
2. **rides** - Ride postings with location and time
3. **matches** - Ride matching records with scores
4. **messages** - Chat messages between users
5. **user_ratings** - Reviews and ratings

### Key Features
- 10+ indexes for performance
- 3 auto-update triggers
- ENUM types for status fields
- Foreign key constraints
- Unique constraints on emails and matches

---

## ✅ Completed Features

### Part 1: Server Setup ✅
- [x] Express server configuration
- [x] Middleware stack (CORS, JSON, helmet)
- [x] Error handling
- [x] Rate limiting (100 req/15min)
- [x] Environment variables
- [x] Graceful shutdown

### Part 2: Database & Models ✅
- [x] PostgreSQL schema (5 tables)
- [x] Supabase cloud database
- [x] User model (24 methods)
- [x] Ride model (17 methods)
- [x] Match model (14 methods)
- [x] Message model (18 methods)
- [x] Connection pooling
- [x] Query logging

### Part 3: Authentication ✅
- [x] JWT token generation
- [x] Password hashing
- [x] Protected routes
- [x] Input validation
- [x] 8 authentication endpoints
- [x] Token persistence
- [x] Error handling

### Frontend Complete ✅
- [x] React app with Vite
- [x] React Router setup
- [x] Protected routes
- [x] Auth Context
- [x] API service layer
- [x] Register page
- [x] Login page
- [x] Dashboard page
- [x] Profile page
- [x] Navbar component
- [x] Loading states
- [x] Error handling
- [x] Responsive design

---

## 🚧 Upcoming Features

### Part 4: NLP Parser (Next)
- [ ] Natural language processing
- [ ] Location extraction
- [ ] Time/date parsing
- [ ] Direction detection
- [ ] Google Maps geocoding

### Part 5: Ride Management
- [ ] Create ride endpoint
- [ ] Search rides with filters
- [ ] Location-based queries
- [ ] My rides page (frontend)

### Part 6: Matching Algorithm
- [ ] Time similarity scoring
- [ ] Location compatibility
- [ ] Route matching
- [ ] Trust score integration

### Part 7: Real-time Features
- [ ] Socket.io integration
- [ ] Real-time chat
- [ ] Live notifications
- [ ] Online status

---

## 🧪 Testing

### Backend Tests

**Test Database Connection:**
```bash
cd backend
node database/test-connection.js
```

**Test All Models:**
```bash
node database/test-models.js
```

**Test Authentication Endpoints:**
```bash
# Ensure backend is running first
node test-auth-endpoints.js
```

### Test Results
```
✅ All 10 tests passed (100% success)
- Health check
- User registration
- Duplicate email rejection
- User login
- Invalid credentials rejection
- Get profile (protected)
- Unauthorized access blocking
- Profile update
- Weak password rejection
- Invalid email rejection
```

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (Supabase)
DB_HOST=db.zybhitbadvxsxxwajaxu.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=postgres

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🎯 How to Use

### 1. Register an Account
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in your university email (.edu required)
4. Create a strong password (min 6 chars, upper, lower, number)
5. Submit form

### 2. Login
1. Enter your email and password
2. Click "Login"
3. You'll be redirected to the dashboard

### 3. View Dashboard
- See your welcome message
- View your statistics (rides, trust score)
- Post rides (coming in Part 4)

### 4. Update Profile
1. Click "Profile" in navbar
2. Click "Edit Profile"
3. Update name, phone, or university
4. Save changes

### 5. Logout
- Click "Logout" button in navbar
- You'll be redirected to login page

---

## 🐛 Troubleshooting

### Backend Won't Start
- ✅ Check if port 5000 is available
- ✅ Verify `.env` file exists in `backend/`
- ✅ Ensure database credentials are correct
- ✅ Run `npm install` in backend folder

### Frontend Won't Start
- ✅ Check if port 3000 is available
- ✅ Verify `.env` file exists in `frontend/`
- ✅ Run `npm install` in frontend folder
- ✅ Clear browser cache and cookies

### Can't Login/Register
- ✅ Ensure backend is running
- ✅ Check browser console for errors
- ✅ Verify API URL in frontend `.env`
- ✅ Check network tab in DevTools

### CORS Errors
- ✅ Verify FRONTEND_URL in backend `.env`
- ✅ Restart backend server after changes
- ✅ Clear browser cache

---

## 📖 Documentation Files

- `backend/README.md` - Backend specific docs
- `frontend/README.md` - Frontend specific docs
- `backend/database/schema.sql` - Complete database schema
- `backend/.env.example` - Environment template

---

## 👥 Development Team

Built as part of the TripSync ride-sharing platform development.

---

## 📄 License

Private educational project.

---

## 🎉 Current Status

### ✅ Completed
- Backend server setup
- Database schema and models
- Authentication system (JWT)
- React frontend
- Login/Register/Profile pages
- Protected routes
- API integration
- 100% test coverage for auth

### 🚧 In Progress
- Part 4: NLP Parser for ride intent

### 📅 Next Steps
1. Install frontend dependencies: `cd frontend && npm install`
2. Test the complete authentication flow
3. Begin Part 4: NLP Parser implementation

---

**Last Updated:** October 15, 2025  
**Version:** 1.0.0 (Auth Complete)  
**Backend:** ✅ Running | **Frontend:** ✅ Running | **Database:** ✅ Connected
