 // middleware/auth.js
// Authentication middleware to verify JWT tokens

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';

// Middleware to verify token and attach user to request
function authenticateToken(req, res, next) {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access denied. Please login.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token. Please login again.'
        });
    }
}

// Optional auth - attach user if token exists, but don't require it
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token invalid, but we don't care - continue without user
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
}

module.exports = {
    authenticateToken,
    optionalAuth
};