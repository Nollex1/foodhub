// server.js - FINAL COMPLETE VERSION
// Fixes: Blank page, Admin access, Database connection, Mobile support

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./config/database');

// Import middleware
const { authenticateToken, optionalAuth } = require('../middleware/auth');

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
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Starting FoodHub Server...');
console.log('📍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🔌 Port:', PORT);
console.log('📂 Directory:', __dirname);

// ==========================
// MIDDLEWARE
// ==========================

// CORS - Allow all origins
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== SERVE FRONTEND STATIC FILES =====
const frontendPath = path.join(__dirname, '../Frontend');
console.log('📁 Frontend path:', frontendPath);

app.use(express.static(frontendPath));

// Request logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ==========================
// API ROUTES
// ==========================

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbResult = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'healthy', 
            database: 'connected',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            db_time: dbResult.rows[0].now
        });
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        res.status(500).json({ 
            status: 'unhealthy', 
            database: 'disconnected',
            error: isProduction ? 'Database connection failed' : error.message
        });
    }
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'FoodHub Restaurant Platform API',
        version: '1.0.0',
        status: 'running',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth (login, signup)',
            restaurants: '/api/restaurants',
            menu: '/api/menu',
            categories: '/api/categories',
            search: '/api/search',
            cities: '/api/cities',
            uploads: '/api/uploads',
            reviews: '/api/reviews',
            admin: '/api/admin (stats, users)'
        }
    });
});

// ==========================
// ADMIN API ROUTES
// ==========================

// Admin stats endpoint
app.get('/api/admin/stats', async (req, res) => {
    try {
        // Total users
        const totalResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const total_users = parseInt(totalResult.rows[0].count);

        // Users from last 30 days
        const recentResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);
        const recent_users_30_days = parseInt(recentResult.rows[0].count);

        // Users from today
        const todayResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE DATE(created_at) = CURRENT_DATE
        `);
        const new_users_today = parseInt(todayResult.rows[0].count);

        res.json({
            success: true,
            stats: {
                total_users,
                recent_users_30_days,
                new_users_today
            }
        });
    } catch (error) {
        console.error('❌ Admin stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load stats',
            message: isProduction ? undefined : error.message
        });
    }
});

// Get all users (for admin)
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Admin users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load users',
            message: isProduction ? undefined : error.message
        });
    }
});

// Get recent users (last 30 days)
app.get('/api/admin/users/recent', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, email, phone, created_at 
            FROM users 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            users: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('❌ Admin recent users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load recent users',
            message: isProduction ? undefined : error.message
        });
    }
});

// ==========================
// OTHER API ROUTES
// ==========================

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', optionalAuth, restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reviews', reviewsRoutes);

// ==========================
// FRONTEND ROUTES
// ==========================
// IMPORTANT: These must come AFTER API routes

// Homepage
app.get('/', (req, res) => {
    console.log('📄 Serving homepage (index.html)');
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    console.log('🔐 Serving admin page');
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Restaurant dashboard
app.get('/restaurant-dashboard', (req, res) => {
    console.log('📊 Serving restaurant dashboard');
    res.sendFile(path.join(frontendPath, 'restaurant-dashboard.html'));
});

// Catch-all for SPA routing (MUST BE LAST)
app.get('*', (req, res, next) => {
    // Don't catch API routes
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    console.log('🔄 Catch-all route - serving index.html for:', req.path);
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ==========================
// ERROR HANDLING
// ==========================

// 404 for API routes only
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'API endpoint not found',
        path: req.path,
        available_endpoints: '/api'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    
    const errorResponse = {
        success: false,
        error: err.message || 'Internal Server Error'
    };
    
    if (!isProduction) {
        errorResponse.stack = err.stack;
    }
    
    res.status(err.status || 500).json(errorResponse);
});

// ==========================
// START SERVER
// ==========================

// CRITICAL: Bind to 0.0.0.0 for cloud hosting (Render, Railway, etc.)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════╗
║  🍽️  FoodHub Server Running          ║
║  Port: ${PORT}                             ║
║  Env: ${isProduction ? 'PRODUCTION ✅' : 'DEVELOPMENT 🔧'}              ║
║  Database: ${process.env.DATABASE_URL ? 'Connected ✅' : 'NOT SET ❌'}       ║
║  Admin: /admin                        ║
╚═══════════════════════════════════════╝
    `);
    
    if (!isProduction) {
        console.log('\n📝 Available URLs:');
        console.log('   🏠 Homepage: http://localhost:' + PORT);
        console.log('   🔐 Admin: http://localhost:' + PORT + '/admin');
        console.log('   📊 Dashboard: http://localhost:' + PORT + '/restaurant-dashboard');
        console.log('   🔧 API Health: http://localhost:' + PORT + '/api/health');
        console.log('   📋 API Info: http://localhost:' + PORT + '/api\n');
    }
});

// ==========================
// GRACEFUL SHUTDOWN
// ==========================

const shutdown = (signal) => {
    console.log(`\n${signal} received: closing server gracefully...`);
    pool.end(() => {
        console.log('✅ Database pool closed');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Error logging
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    if (isProduction) {
        shutdown('uncaughtException');
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});