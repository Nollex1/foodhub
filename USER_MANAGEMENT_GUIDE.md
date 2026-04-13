# FoodHub User Management & Email Follow-up Guide

## 📧 How to Get User Emails for Follow-up

### Method 1: Admin Dashboard (Easiest)
**URL**: `http://localhost:5001/admin`

**Features:**
- ✅ Real-time user statistics
- ✅ Complete user list with emails, names, phones
- ✅ Filter by recent users (last 30 days)
- ✅ Export to CSV for email marketing
- ✅ Auto-refresh every 30 seconds

### Method 2: Direct API Calls

#### Get All Users:
```bash
curl http://localhost:5001/api/admin/users
```

#### Get Recent Users (30 days):
```bash
curl http://localhost:5001/api/admin/users/recent
```

#### Get Statistics:
```bash
curl http://localhost:5001/api/admin/stats
```

### Method 3: Direct Database Queries

#### Connect to PostgreSQL:
```bash
psql -U postgres -d "restaurant platform"
```

#### Get All Users (without passwords):
```sql
SELECT id, name, email, phone, created_at
FROM users
ORDER BY created_at DESC;
```

#### Get Recent Users (last 30 days):
```sql
SELECT id, name, email, phone, created_at
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

#### Get Today's New Users:
```sql
SELECT id, name, email, phone, created_at
FROM users
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

#### Export to CSV (from psql):
```sql
\COPY (
    SELECT id, name, email, phone, created_at
    FROM users
    ORDER BY created_at DESC
) TO 'foodhub_users.csv' WITH CSV HEADER;
```

---

## 📊 User Data Available

**Fields you can access:**
- `id` - User ID
- `name` - Full name
- `email` - Email address (for follow-up)
- `phone` - Phone number
- `created_at` - Registration date

**What you CANNOT access:**
- ❌ `password` - Hashed and secure

---

## 🎯 Email Follow-up Ideas

### Welcome Emails
Send to new users within 24 hours of registration:
- Welcome message
- Platform features
- Special offers

### Engagement Emails
Send to users who haven't logged in recently:
- "We miss you!" messages
- New restaurant updates
- Special promotions

### Newsletter
Weekly/monthly updates:
- New restaurants added
- Platform updates
- User testimonials

---

## 🔧 Setup Instructions

### 1. Start Backend Server
```bash
cd Backend
npm start
```

### 2. Access Admin Dashboard
Go to: `http://localhost:5001/admin`

### 3. Export User Data
- Click "Export to CSV" button
- Or use database queries above
- Import CSV into email marketing tools

---

## 📈 User Statistics

The admin dashboard shows:
- **Total Users**: All registered accounts
- **Last 30 Days**: New registrations in past month
- **New Today**: Registrations today

---

## 🔒 Security Notes

- Admin endpoints are currently open (no authentication required)
- For production, add authentication to `/api/admin/*` routes
- User passwords are never exposed in any endpoint
- All data is read-only (no delete/modify via admin API)

---

## 📧 Email Marketing Integration

### Popular Tools:
- **Mailchimp**: Import CSV directly
- **Sendinblue**: API integration available
- **ConvertKit**: Email automation
- **Google Sheets**: For manual management

### CSV Format:
```csv
ID,Name,Email,Phone,Registered Date
1,"John Doe","john@example.com","08012345678","2024-01-15"
2,"Jane Smith","jane@example.com","08087654321","2024-01-16"
```

---

## 🚀 Next Steps

1. ✅ Create users table (already done)
2. ✅ Add admin API endpoints (done)
3. ✅ Create admin dashboard (done)
4. ⏳ Optional: Add email verification
5. ⏳ Optional: Add email marketing automation
6. ⏳ Optional: Add user segmentation

---

**Access your user data now at:** `http://localhost:5001/admin`
