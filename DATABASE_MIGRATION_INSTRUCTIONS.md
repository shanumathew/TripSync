# 🗄️ Database Migration Instructions

## Run Part 6 Migration in Supabase

### Step 1: Copy the SQL Script
The migration file is ready at:
```
backend/database/migrations/part6-tracking-maps.sql
```

### Step 2: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 3: Run the Migration
1. Open `part6-tracking-maps.sql` file
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" button (or press Ctrl+Enter)

### Step 4: Verify Success
You should see these messages:
```
✅ Part 6 Migration completed successfully!
✅ Rides table updated with tracking fields
✅ ride_tracking table created
✅ ride_location_history table created
✅ ride_notifications table created
✅ Indexes created for performance
✅ Triggers added for auto-updates
✅ Helper functions created
✅ Views created for common queries
🚀 Ready for Socket.io & Google Maps integration!
```

### Step 5: Check Tables
In Supabase, navigate to "Table Editor" and verify these tables exist:
- `ride_tracking` (new)
- `ride_location_history` (new)
- `ride_notifications` (new)
- `rides` (should have new columns: ride_status, driver_id, vehicle_id, etc.)

### Troubleshooting
If you get an error about UUID extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Run this first, then run the full migration.

---

## ✅ Once Complete

After the migration runs successfully, I'll start building:
1. Google Maps service (backend)
2. Location calculation service
3. Socket.io server
4. Tracking services
5. And all frontend components!

**Let me know once the migration is complete!** 🚀
