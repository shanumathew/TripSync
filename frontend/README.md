# 🎨 TripSync Frontend

React frontend for the TripSync university ride-sharing platform.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Runs on http://localhost:3000

### Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.jsx      # Navigation bar
│   │   └── ProtectedRoute.jsx  # Route guard
│   │
│   ├── context/            # React Context
│   │   └── AuthContext.jsx # Authentication state
│   │
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page
│   │   ├── Login.jsx       # Login page
│   │   ├── Register.jsx    # Registration page
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   └── Profile.jsx     # User profile
│   │
│   ├── services/           # API layer
│   │   ├── api.js          # Axios instance
│   │   └── authService.js  # Auth API calls
│   │
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
│
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
└── .env                    # Environment variables
```

## 🔐 Authentication Flow

### Register
1. User fills registration form
2. Frontend validates input (email format, password strength, etc.)
3. API call to `/api/auth/register`
4. JWT token saved to localStorage
5. User redirected to dashboard

### Login
1. User enters email and password
2. Frontend validates input
3. API call to `/api/auth/login`
4. JWT token saved to localStorage
5. Auth context updated with user data
6. User redirected to dashboard

### Protected Routes
1. ProtectedRoute component checks for user in context
2. If not authenticated, redirect to login
3. If authenticated, render the requested component

### Logout
1. Clear localStorage (token and user)
2. Clear auth context state
3. Redirect to login page

## 🛠️ Components

### Navbar
- Displays logo and app name
- Shows login/register buttons when logged out
- Shows user name and logout button when logged in
- Responsive navigation links

### ProtectedRoute
- Wraps protected pages
- Checks authentication status
- Shows loading spinner while checking
- Redirects to login if not authenticated

### Pages

#### Home
- Landing page with features
- Redirects to dashboard if already logged in
- Call-to-action buttons

#### Register
- Full registration form
- Client-side validation
- Password strength requirements
- University email validation (.edu)
- Error handling

#### Login
- Simple login form
- Email and password fields
- Remember me option
- Link to registration

#### Dashboard
- Welcome message with user name
- Statistics cards (rides, trust score, etc.)
- Post ride section (coming soon)
- User info display

#### Profile
- View user profile
- Edit profile information
- Update name, phone, university
- Display statistics and verification status

## 🎨 Styling

Custom CSS with CSS variables for theming:

### Colors
- Primary: #2563eb (blue)
- Secondary: #64748b (slate)
- Success: #10b981 (green)
- Error: #ef4444 (red)
- Warning: #f59e0b (amber)

### Components
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- Forms: `.form-group`, `.form-input`, `.form-label`
- Cards: `.card`
- Alerts: `.alert-success`, `.alert-error`, etc.
- Utilities: `.container`, flex utilities, spacing

## 🔌 API Integration

### Axios Configuration
- Base URL from environment variable
- Request interceptor: Attaches JWT token
- Response interceptor: Handles 401 errors (token expiration)

### API Functions

```javascript
// Register
authAPI.register(userData)

// Login
authAPI.login({ email, password })

// Get current user
authAPI.getMe()

// Update profile
authAPI.updateProfile({ name, phone, university })

// Update password
authAPI.updatePassword({ currentPassword, newPassword, confirmPassword })

// Logout
authAPI.logout()
```

## 🧪 Testing Checklist

- [ ] Register with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Register with weak password (should fail)
- [ ] Register with invalid email format (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Access dashboard when logged in
- [ ] Access dashboard when logged out (should redirect)
- [ ] View profile
- [ ] Edit profile and save
- [ ] Logout and verify redirect
- [ ] Refresh page while logged in (should stay logged in)
- [ ] Token expiration handling

## ⚙️ Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-production-api.com/api
```

## 📱 Responsive Design

- Desktop: Full layout with sidebar
- Tablet: Adapted grid layouts
- Mobile: Single column, hamburger menu (future)

## 🚧 Coming Soon

### Part 4 Integration (NLP Parser)
- [ ] Ride posting with natural language
- [ ] Parse location from text
- [ ] Extract time and date
- [ ] Show parsed data preview

### Part 5 Integration (Ride Management)
- [ ] My Rides page
- [ ] Ride list component
- [ ] Ride card component
- [ ] Search and filter

### Part 6 Integration (Matching)
- [ ] Find matches page
- [ ] Match cards
- [ ] Accept/reject matches
- [ ] Match details

### Part 7 Integration (Real-time)
- [ ] Socket.io integration
- [ ] Real-time chat
- [ ] Live notifications
- [ ] Online status indicators

## 🐛 Common Issues

### CORS Errors
Ensure backend CORS is configured to allow http://localhost:3000

### API Connection Failed
Check that backend is running on port 5000

### Token Expiration
Tokens expire after 7 days. Login again if session expires.

### 404 on Refresh
Vite handles this automatically in dev mode. For production, configure server for SPA routing.

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

---

**Frontend Status:** ✅ Complete - Authentication System Fully Functional  
**Next:** Integrate NLP Parser (Backend Part 4)
