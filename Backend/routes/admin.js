// routes/admin.js
// Admin routes for user management

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET /api/admin/users - Get all users (without passwords)
router.get('/users', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                id,
                name,
                email,
                phone,
                created_at,
                updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// GET /api/admin/users/recent - Get recently registered users (last 30 days)
router.get('/users/recent', async (req, res) => {
    try {
        const result = await query(`
            SELECT
                id,
                name,
                email,
                phone,
                created_at
            FROM users
            WHERE created_at >= NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent users'
        });
    }
});

// GET /api/admin/stats - Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await query('SELECT COUNT(*) as count FROM users');
        const recentUsers = await query("SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'");
        const todayUsers = await query("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURRENT_DATE");

        res.json({
            success: true,
            stats: {
                total_users: parseInt(totalUsers.rows[0].count),
                recent_users_30_days: parseInt(recentUsers.rows[0].count),
                new_users_today: parseInt(todayUsers.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
