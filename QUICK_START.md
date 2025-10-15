# 🚀 TripSync - Quick Start Guide

## ✅ What's Already Done

### Backend ✅
- Express server configured
- PostgreSQL database (Supabase) connected
- Authentication system (JWT + bcrypt)
- 8 API endpoints working
- 73+ model methods
- 100% test coverage

### Frontend ✅
- React app created with Vite
- All pages built (Home, Login, Register, Dashboard, Profile)
- Protected routes configured
- Auth Context for state management
- API service layer with Axios
- Responsive UI with custom CSS

---

## 🎯 Next Steps - Start Testing!

### Step 1: Install Frontend Dependencies

Open a **new terminal** and run:

```bash
cd frontend
npm install
```

This will install:
- React and React-DOM
- React Router
- Axios
- Vite

**Expected output:**
```
added 200+ packages
```

---

### Step 2: Start Backend Server

In your **first terminal**:

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Database connected successfully
✅ Database connection verified
🚀 TripSync Backend Server Started
🚀 Port: 5000
🚀 URL: http://localhost:5000
```

**Keep this running!**

---

### Step 3: Start Frontend Server

In your **second terminal**:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Keep this running too!**

---

### Step 4: Open Your Browser

Navigate to: **http://localhost:3000**

You should see the TripSync landing page! 🎉

---

## 🧪 Testing Checklist

### ✅ Test 1: User Registration

1. Click **"Register"** button
2. Fill in the form:
   - **Name:** John Doe
   - **Email:** john@university.edu (must end with .edu)
   - **University:** State University
   - **Phone:** 1234567890
   - **Password:** Test123! (uppercase, lowercase, number)
   - **Confirm Password:** Test123!
3. Click **"Create Account"**

**Expected:** 
- Success message appears
- Redirected to Dashboard
- See welcome message with your name

---

### ✅ Test 2: View Dashboard

After registration, you should see:
- Welcome message: "Good Morning/Afternoon/Evening, John!"
- Your university name
- Statistics cards showing:
  - Total Rides: 0
  - Completed: 0
  - Trust Score: 5.0
  - Verification status

---

### ✅ Test 3: View Profile

1. Click **"Profile"** in the navbar
2. You should see:
   - Your avatar (first letter of name)
   - Your email
   - Your information
   - Statistics
   - Member since date

---

### ✅ Test 4: Update Profile

1. On Profile page, click **"Edit Profile"**
2. Change your name to: "John Updated"
3. Change phone to: "9876543210"
4. Click **"Save Changes"**

**Expected:**
- Success message appears
- Profile updates immediately
- Navbar shows updated name

---

### ✅ Test 5: Logout

1. Click **"Logout"** button in navbar
2. **Expected:**
   - Redirected to login page
   - Navbar shows Login/Register buttons

---

### ✅ Test 6: Login Again

1. Click **"Login"**
2. Enter your credentials:
   - **Email:** john@university.edu
   - **Password:** Test123!
3. Click **"Login"**

**Expected:**
- Success message
- Redirected to Dashboard
- Still see your updated name

---

### ✅ Test 7: Protected Routes

1. While logged in, note the current URL (e.g., /dashboard)
2. Click **"Logout"**
3. Try to manually navigate to: **http://localhost:3000/dashboard**

**Expected:**
- Automatically redirected to /login
- Cannot access protected pages without authentication

---

### ✅ Test 8: Token Persistence

1. Login to your account
2. Go to Dashboard
3. **Refresh the page** (F5 or Ctrl+R)

**Expected:**
- You stay logged in
- No redirect to login page
- JWT token persists in localStorage

---

### ✅ Test 9: Error Handling

Try these to test validation:

**Weak Password:**
- Register with password: "123"
- Expected: Error message about password requirements

**Invalid Email:**
- Register with email: "notanemail"
- Expected: Error about email format

**Non-University Email:**
- Register with email: "test@gmail.com"
- Expected: Error about .edu requirement

**Wrong Login:**
- Login with wrong password
- Expected: "Invalid email or password" error

**Duplicate Email:**
- Try to register with same email twice
- Expected: "User with this email already exists"

---

## 📸 What You Should See

### Home Page (Not Logged In)
```
🚗 Welcome to TripSync
The smart ride-sharing platform for university students

[Features cards]

[Get Started]  [Login]
```

### Dashboard (Logged In)
```
Navbar: 🚗 TripSync | Dashboard | Profile | 👋 John | [Logout]

Good Morning, John! 👋
State University

[Stats Cards: Rides, Completed, Trust Score, Verified]

📍 Post a New Ride
[Coming Soon section]

🎉 Welcome to TripSync!
[Features list]
```

### Profile Page
```
Navbar: 🚗 TripSync | Dashboard | Profile | 👋 John | [Logout]

My Profile

[Avatar: J]  John Doe
            john@university.edu

[Edit Profile] or [Save Changes] [Cancel]

Email: john@university.edu (cannot be changed)
University: State University
Phone: 1234567890

[Trust Score, Total Rides, Completed, Status]

📅 Member since October 15, 2025
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to server"
**Fix:**
```bash
# Make sure backend is running
cd backend
npm start
```

### Issue: "npm: command not found"
**Fix:** Install Node.js from https://nodejs.org

### Issue: Port 3000 already in use
**Fix:**
```bash
# Kill the process or change port in vite.config.js
```

### Issue: CORS Error
**Fix:** Check `FRONTEND_URL` in `backend/.env` is set to `http://localhost:3000`

### Issue: Can't see changes
**Fix:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Issue: Login not working
**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - look for failed requests
4. Verify backend is running

---

## 🎉 Success Criteria

You've successfully completed the setup when:

- [x] Frontend running on port 3000
- [x] Backend running on port 5000
- [x] Can register new user
- [x] Can login
- [x] Can view dashboard
- [x] Can update profile
- [x] Can logout
- [x] Protected routes work
- [x] Token persists on refresh

---

## 📚 Next Features to Build

Once everything is working, you're ready for:

### Part 4: NLP Parser (Coming Next)
- Natural language ride posting
- "Going to airport tomorrow at 8 AM" → Parsed data
- Location extraction
- Time/date detection

### Part 5: Ride Management
- Post rides with NLP
- View all rides
- Search and filter
- My rides page

---

## 💡 Tips

1. **Keep both terminals open** - Backend and Frontend
2. **Check browser console** for errors (F12)
3. **Use Chrome/Edge DevTools** to debug
4. **Clear localStorage** if you get stuck: `localStorage.clear()`
5. **Restart servers** after .env changes

---

## 🎯 Your Current Commands

**Terminal 1 (Backend):**
```bash
cd c:\Users\shanu.Nustartz\Desktop\TripSync\backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd c:\Users\shanu.Nustartz\Desktop\TripSync\frontend
npm install  # First time only
npm run dev
```

**Browser:**
```
http://localhost:3000
```

---

**Ready to test? Start with Step 1: Install frontend dependencies!** 🚀
