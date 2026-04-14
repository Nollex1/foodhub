// server.js - FINAL VERSION
// Main Express server entry point with authentication


// Production environment check
const isProduction = process.env.NODE_ENV === 'production';

// Update CORS
app.use(cors({
    origin: isProduction 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : ['http://localhost:3000', 'http://localhost:5001'],
    credentials: true
}));




require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./config/database');

// Import middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');

// Import routes
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const categoryRoutes = require('./routes/categories');
const searchRoutes = require('./routes/search');
const citiesRoutes = require('./routes/cities');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const reviewsRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================
// MIDDLEWARE
// ==========================

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ==========================
// FRONTEND ROUTES
// ==========================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.get('/restaurant-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/restaurant-dashboard.html'));
});

app.get('/restaurant-dashboard.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/restaurant-dashboard.js'));
});

app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/app.js'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/style.css'));
});

// ==========================
// API ROUTES
// ==========================

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ 
            status: 'healthy', 
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Auth routes (no auth required for login/signup)
app.use('/api/auth', authRoutes);

// Restaurant routes (mixed auth)
app.use('/api/restaurants', optionalAuth, restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reviews', reviewsRoutes);

// ==========================
// ERROR HANDLING
// ==========================

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==========================
// START SERVER
// ==========================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║  🍽️  FoodHub Restaurant Platform     ║
║  Server running on port ${PORT}       ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database: PostgreSQL                 ║
║  🔐 Auth: Enabled                     ║
╚═══════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});