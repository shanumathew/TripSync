# TripSync Backend API

University ride-sharing platform with NLP-powered matching system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- **Supabase account** (recommended - free online database)
  - Alternative: Local PostgreSQL installation
- Google Maps API key (for Part 4)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TripSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the values with your configuration:
     ```
     DATABASE_URL=your-postgres-connection-string
     JWT_SECRET=your-secret-key
     GOOGLE_MAPS_API_KEY=your-google-api-key
     ```

4. **Set up the database**
   - **Recommended**: Follow `SUPABASE_SETUP.md` for easy online database setup
   - Alternative: Install PostgreSQL locally
   - Run the schema: `database/schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Test the server**
   - Open browser: http://localhost:5000/api/health
   - You should see: `{"status": "success", "message": "TripSync API is running"}`

## 📁 Project Structure

```
TripSync/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database connection
│   │   └── index.js     # App configuration
│   ├── controllers/     # Request handlers (Part 3+)
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── models/          # Database models (Part 2)
│   ├── routes/          # API routes
│   │   └── index.js
│   ├── services/        # Business logic (Part 4+)
│   └── utils/           # Helper functions
├── .env                 # Environment variables (DO NOT COMMIT)
├── .env.example         # Environment template
├── .gitignore
├── package.json
└── server.js            # Entry point
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints (Part 1)
- `GET /api/health` - Server health check
- `GET /api/` - API information

### Coming in Future Parts
- `POST /api/auth/register` - User registration (Part 3)
- `POST /api/auth/login` - User login (Part 3)
- `POST /api/rides` - Create a ride (Part 5)
- `GET /api/rides` - Get user's rides (Part 5)
- `GET /api/matches/:rideId` - Find matches (Part 6)

## 🛠️ Available Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
npm test        # Run tests (coming in Part 11)
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing (Part 3)
- **jsonwebtoken** - JWT authentication (Part 3)
- **pg** - PostgreSQL client
- **socket.io** - Real-time communication (Part 8)
- **compromise** - NLP text parsing (Part 4)
- **chrono-node** - Natural language date parsing (Part 4)
- **axios** - HTTP client for Google Maps API (Part 4)
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **morgan** - Request logging

## 🔒 Security Features

✅ Helmet.js for security headers
✅ CORS configuration
✅ Rate limiting (100 requests per 15 minutes)
✅ Request body size limits
✅ Error handling middleware
✅ Request logging

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRE` | Token expiration time | `7d` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## ✅ Part 1 Completion Checklist

- [x] 1. Initialize Node.js project (package.json)
- [x] 2. Install all dependencies
- [x] 3. Create main server file (server.js)
- [x] 4. Set up Express app
- [x] 5. Enable CORS
- [x] 6. Enable JSON parsing
- [x] 7. Create environment variables file (.env)
- [x] 8. Set up database connection
- [x] 9. Test server runs

## 🎯 Next Steps

**Part 2: Database Schema & Models**
- Design and create database tables
- Set up SQL schema for Users, Rides, Matches, Messages

## 📝 Notes

- Make sure PostgreSQL is running before starting the server
- Update `.env` with your actual database credentials
- Never commit `.env` file to version control
- Google Maps API key is required for geocoding (Part 4)

## 🐛 Troubleshooting

**Server won't start:**
- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check if port 5000 is available

**Database connection error:**
- Verify your PostgreSQL credentials
- Check if the database exists
- Test connection string format

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Current Status:** Part 1 Complete ✅  
**Next:** Part 2 - Database Schema & Models
