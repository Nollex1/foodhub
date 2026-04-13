# 🍽️ Multi-Restaurant Food Ordering Platform

A complete full-stack restaurant marketplace platform where restaurants can register, manage menus, and receive orders via WhatsApp.

## 📋 Features

### For Customers
- Browse restaurants by location and category
- Search restaurants and menu items
- View detailed restaurant information and menus
- Add items to cart and place orders
- Direct WhatsApp ordering integration
- Responsive design for mobile and desktop

### For Restaurants
- Easy restaurant registration
- Menu management
- Multiple images support
- Category-based organization
- Delivery settings and fees
- Direct customer communication via WhatsApp

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database (PgAdmin4)
- RESTful API architecture
- Input validation with express-validator
- CORS enabled for cross-origin requests

### Frontend
- Pure HTML, CSS, JavaScript (no frameworks)
- Modern ES6+ JavaScript
- Responsive CSS Grid & Flexbox
- Fetch API for HTTP requests

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── routes/
│   │   ├── restaurants.js       # Restaurant CRUD operations
│   │   ├── menu.js             # Menu items management
│   │   ├── categories.js       # Categories endpoints
│   │   └── search.js           # Search functionality
│   ├── server.js               # Express server setup
│   ├── package.json            # Dependencies
│   └── .env.example            # Environment variables template
├── database/
│   └── schema.sql              # PostgreSQL database schema
├── frontend/
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Styling
│   └── app.js                  # Frontend JavaScript
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- PgAdmin4 (for database management)
- Git

### 1. Database Setup

1. **Install PostgreSQL and PgAdmin4**
   - Download from https://www.postgresql.org/download/
   - Install and set up a master password

2. **Create Database**
   ```sql
   -- In PgAdmin4 or psql:
   CREATE DATABASE restaurant_platform;
   ```

3. **Run Schema**
   - Open PgAdmin4
   - Right-click on your database → Query Tool
   - Copy and paste contents of `database/schema.sql`
   - Execute the script (F5)

### 2. Backend Setup

1. **Navigate to backend folder**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your settings
   ```

4. **Update .env file** with your PostgreSQL credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=restaurant_platform
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   
   JWT_SECRET=your_secret_key_here
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5500
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Or production mode
   npm start
   ```

   Server will run on http://localhost:5000

### 3. Frontend Setup

1. **Update API URL in app.js** (if needed)
   ```javascript
   // Line 3 in frontend/app.js
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. **Serve the frontend**
   
   **Option A: Using Live Server (VS Code)**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"
   
   **Option B: Using Python**
   ```bash
   cd frontend
   python -m http.server 3000
   # Or for Python 2
   python -m SimpleHTTPServer 3000
   ```
   
   **Option C: Using Node.js http-server**
   ```bash
   npx http-server frontend -p 3000
   ```

3. **Access the application**
   - Open browser to http://localhost:3000

## 📡 API Endpoints

### Restaurants
```
GET    /api/restaurants           # Get all restaurants
GET    /api/restaurants/:id       # Get single restaurant with menu
POST   /api/restaurants           # Create new restaurant
PUT    /api/restaurants/:id       # Update restaurant
DELETE /api/restaurants/:id       # Delete restaurant (soft delete)
```

### Menu Items
```
GET    /api/menu/restaurant/:id   # Get menu items for restaurant
GET    /api/menu/:id              # Get single menu item
POST   /api/menu                  # Create menu item
PUT    /api/menu/:id              # Update menu item
DELETE /api/menu/:id              # Delete menu item
```

### Categories
```
GET    /api/categories            # Get all categories
GET    /api/categories/:id        # Get category with restaurants
```

### Search
```
GET    /api/search                # Search restaurants and menu
GET    /api/search/nearby         # Search by coordinates
```

### Health Check
```
GET    /api/health                # Check API and database status
```

## 🗄️ Database Schema

### Tables

**restaurants**
- Restaurant information, contact details, location
- Rating system, delivery settings
- Active/inactive status

**menu_items**
- Menu items linked to restaurants
- Pricing, descriptions, availability
- Preparation time

**categories**
- Food categories (Nigerian, Chinese, etc.)
- Category descriptions

**restaurant_images**
- Multiple images per restaurant
- Primary image designation

## 🎨 Customization

### Adding New Categories
```sql
INSERT INTO categories (name, description) 
VALUES ('Italian', 'Italian cuisine and pizzas');
```

### Updating Restaurant
```javascript
// PUT /api/restaurants/:id
{
  "name": "Updated Name",
  "phone": "08012345678",
  "delivery_fee": 1000.00
  // ... other fields
}
```

### Adding Menu Items
```javascript
// POST /api/menu
{
  "restaurant_id": 1,
  "name": "Egusi Soup",
  "description": "Traditional Nigerian soup",
  "price": 2500.00,
  "category": "Main Course"
}
```

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Check connection settings in .env
```

### CORS Errors
- Ensure `ALLOWED_ORIGINS` in `.env` includes your frontend URL
- Check that backend server is running

### API 404 Errors
- Verify backend is running on correct port
- Check `API_BASE_URL` in `frontend/app.js`

## 📱 Testing the Platform

1. **Register a Restaurant**
   - Click "Register Your Restaurant" button
   - Fill in the form
   - Submit

2. **Browse Restaurants**
   - View restaurant listings
   - Click on a restaurant to view menu

3. **Place an Order**
   - Add items to cart
   - Click "Place Order"
   - Order details sent via WhatsApp

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, DigitalOcean, or AWS
- Set environment variables in hosting platform
- Ensure PostgreSQL database is accessible

### Frontend
- Deploy to Netlify, Vercel, or GitHub Pages
- Update `API_BASE_URL` to production backend URL

### Database
- Use managed PostgreSQL (Heroku Postgres, AWS RDS)
- Or self-host on VPS

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Email: support@foodhub.ng

## 🎯 Future Enhancements

- [ ] User authentication and accounts
- [ ] Order history tracking
- [ ] Payment gateway integration
- [ ] Restaurant dashboard
- [ ] Real-time order notifications
- [ ] Ratings and reviews system
- [ ] Advanced search filters
- [ ] Mobile app (React Native)

---

Built with ❤️ for food lovers and local restaurants 