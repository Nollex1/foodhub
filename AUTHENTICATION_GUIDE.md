# FoodHub Authentication Setup Guide

## Overview
The login and signup system now has full backend integration. User data is saved to PostgreSQL database with encrypted passwords.

---

## 📁 Where Data is Saved

### Email & Password Storage
- **Location**: PostgreSQL database - `users` table
- **Fields**:
  - `id` - Unique user ID
  - `name` - Full name
  - `email` - Email address (unique)
  - `phone` - Phone number
  - `password` - Hashed password (using bcryptjs)
  - `created_at` - Account creation timestamp
  - `updated_at` - Last update timestamp

### Authentication Token
- **Location**: Browser's `localStorage`
- **Key**: `authToken`
- **User Data**: Stored as JSON in `localStorage` with key `user`
- **Duration**: Valid for 30 days (JWT expiry)

---

## 🔧 Setup Steps

### Step 1: Create the Users Table in Database

Run the SQL migration file to create the users table:

**File**: `Database/001_create_users_table.sql`

**Option A: Using Command Line (pgAdmin or psql)**
```bash
# Connect to your PostgreSQL database
psql -U postgres -d "restaurant platform" -f "Database/001_create_users_table.sql"
```

**Option B: Using pgAdmin GUI**
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "restaurant platform" database
4. Select "Query Tool"
5. Copy and paste the SQL from `Database/001_create_users_table.sql`
6. Click the "Execute" button

### Step 2: Verify Database Connection

Check if the users table was created:
```sql
SELECT * FROM users;
```
(Should return empty table if successful)

### Step 3: Start Backend Server

```bash
cd Backend
npm start
```

The server should start on `http://localhost:5001`

### Step 4: Access Frontend

Open your browser and go to:
```
http://localhost:5001
```

---

## ✅ Testing the Authentication

### Test Sign Up
1. Click "Sign Up" button in header
2. Fill in the form:
   - **Name**: John Doe
   - **Email**: john@example.com
   - **Phone**: 08012345678
   - **Password**: password123
   - **Confirm Password**: password123
3. Click "Create Account"
4. You should see: "Account created successfully, John Doe! 🎉"
5. The header should now show "👤 John Doe" with a "Logout" button

### Test Login
1. Click "Logout" button to log out
2. Click "Login" button in header
3. Fill in:
   - **Email**: john@example.com
   - **Password**: password123
4. Click "Login"
5. You should see: "Welcome back, John Doe! 🎉"

### Test Data Persistence
1. Refresh the page - you should stay logged in
2. Open browser DevTools (F12 → Application → Local Storage)
3. You'll see:
   - `authToken`: Your JWT token
   - `user`: Your user info in JSON format

### Test Failed Login
1. Try logging in with wrong email or password
2. You should see: "Invalid email or password"

---

## 🔐 Security Features

✅ **Hashed Passwords**: Passwords are encrypted using bcryptjs (10 rounds)
✅ **JWT Token**: Secure token-based authentication
✅ **Unique Email**: Each email can only register once
✅ **Email Validation**: Frontend and backend validation
✅ **Password Validation**: Minimum 6 characters required

---

## 📊 Database Query Examples

### View All Users
```sql
SELECT id, name, email, phone, created_at FROM users;
```

### Find User by Email
```sql
SELECT * FROM users WHERE email = 'john@example.com';
```

### Count Total Users
```sql
SELECT COUNT(*) as total_users FROM users;
```

### Delete a User (Testing)
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 🛠️ API Endpoints

### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678"
  }
}
```

### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678"
  }
}
```

---

## 📱 Frontend Features

- **Login Button**: Opens login modal
- **Sign Up Button**: Opens signup modal  
- **Auto-save**: User info saved to localStorage
- **Persistent Login**: User stays logged in after page refresh
- **Logout**: Clears localStorage and returns to login state
- **User Display**: Shows logged-in user name in header

---

## ⚠️ Troubleshooting

### "Email already registered"
- The email is already in the database
- Use a different email or reset the database

### "Failed to create account"
- Check if backend is running on port 5001
- Check database connection in `.env` file

### Button doesn't appear
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh the page

### Still logged in after closing browser
- localStorage persists across browser sessions
- Click "Logout" to clear the session

---

## 🔄 Next Steps

1. ✅ Database schema created
2. ✅ Backend API endpoints ready
3. ✅ Frontend UI implemented
4. ⏳ Optional: Email verification
5. ⏳ Optional: Password reset
6. ⏳ Optional: Social login (Google, Facebook)

---

**Created**: April 5, 2026
**Status**: Full authentication system operational
