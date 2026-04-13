// routes/search.js
// Search functionality routes - FIXED VERSION

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET search restaurants and menu items
router.get('/', async (req, res) => {
    try {
        const { q, city, state, category, latitude, longitude, radius = 10 } = req.query;
        
        if (!q && !city && !state && !category && !latitude) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide at least one search parameter' 
            });
        }
        
        let restaurantQuery = `
            SELECT 
                r.*,
                c.name as category_name,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', ri.id,
                            'image_url', ri.image_url,
                            'is_primary', ri.is_primary
                        )
                    ) FILTER (WHERE ri.id IS NOT NULL),
                    '[]'
                ) as images
        `;
        
        // Add distance calculation if coordinates provided
        if (latitude && longitude) {
            restaurantQuery += `,
                ROUND(
                    CAST(
                        6371 * acos(
                            cos(radians($1)) * cos(radians(r.latitude)) *
                            cos(radians(r.longitude) - radians($2)) +
                            sin(radians($1)) * sin(radians(r.latitude))
                        ) AS numeric
                    ), 2
                ) as distance_km
            `;
        }
        
        restaurantQuery += `
            FROM restaurants r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN restaurant_images ri ON r.id = ri.restaurant_id
            WHERE r.is_active = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        // Handle coordinates
        if (latitude && longitude) {
            params.push(parseFloat(latitude), parseFloat(longitude));
            paramCount = 3;
            restaurantQuery += ` AND (
                6371 * acos(
                    cos(radians($1)) * cos(radians(r.latitude)) *
                    cos(radians(r.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(r.latitude))
                ) <= $${paramCount}
            )`;
            params.push(parseFloat(radius));
            paramCount++;
        }
        
        // Text search
        if (q) {
            restaurantQuery += ` AND (
                r.name ILIKE $${paramCount} OR 
                r.description ILIKE $${paramCount} OR
                r.address ILIKE $${paramCount}
            )`;
            params.push(`%${q}%`);
            paramCount++;
        }
        
        // City filter
        if (city) {
            restaurantQuery += ` AND r.city ILIKE $${paramCount}`;
            params.push(`%${city}%`);
            paramCount++;
        }
        
        // State filter
        if (state) {
            restaurantQuery += ` AND r.state ILIKE $${paramCount}`;
            params.push(`%${state}%`);
            paramCount++;
        }
        
        // Category filter
        if (category) {
            restaurantQuery += ` AND c.name ILIKE $${paramCount}`;
            params.push(`%${category}%`);
            paramCount++;
        }
        
        restaurantQuery += `
            GROUP BY r.id, c.name
            ORDER BY r.rating DESC NULLS LAST, r.created_at DESC
            LIMIT 20
        `;
        
        const restaurantResults = await query(restaurantQuery, params);
        
        // Fix ratings in results
        const sanitizedRestaurants = restaurantResults.rows.map(row => ({
            ...row,
            rating: row.rating ? parseFloat(row.rating) : 4.5
        }));
        
        // Search menu items if text query provided
        let menuResults = { rows: [] };
        if (q) {
            const menuQuery = `
                SELECT 
                    m.*,
                    r.name as restaurant_name,
                    r.city,
                    r.state,
                    r.phone,
                    r.whatsapp
                FROM menu_items m
                JOIN restaurants r ON m.restaurant_id = r.id
                WHERE 
                    r.is_active = true AND
                    m.is_available = true AND
                    (m.name ILIKE $1 OR m.description ILIKE $1)
                ORDER BY m.name
                LIMIT 20
            `;
            menuResults = await query(menuQuery, [`%${q}%`]);
        }
        
        res.json({
            success: true,
            data: {
                restaurants: {
                    count: sanitizedRestaurants.length,
                    items: sanitizedRestaurants
                },
                menu_items: {
                    count: menuResults.rows.length,
                    items: menuResults.rows
                }
            }
        });
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Search failed',
            message: error.message
        });
    }
});

// GET search by location (coordinates)
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 10, limit = 20 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ 
                success: false, 
                error: 'Latitude and longitude are required' 
            });
        }
        
        const result = await query(`
            SELECT 
                r.*,
                c.name as category_name,
                ROUND(
                    CAST(
                        6371 * acos(
                            cos(radians($1)) * cos(radians(r.latitude)) *
                            cos(radians(r.longitude) - radians($2)) +
                            sin(radians($1)) * sin(radians(r.latitude))
                        ) AS numeric
                    ), 2
                ) as distance_km,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', ri.id,
                            'image_url', ri.image_url,
                            'is_primary', ri.is_primary
                        )
                    ) FILTER (WHERE ri.id IS NOT NULL),
                    '[]'
                ) as images
            FROM restaurants r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN restaurant_images ri ON r.id = ri.restaurant_id
            WHERE 
                r.is_active = true AND
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(r.latitude)) *
                        cos(radians(r.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(r.latitude))
                    ) <= $3
                )
            GROUP BY r.id, c.name
            ORDER BY distance_km ASC
            LIMIT $4
        `, [parseFloat(latitude), parseFloat(longitude), parseFloat(radius), parseInt(limit)]);
        
        // Fix ratings
        const sanitizedData = result.rows.map(row => ({
            ...row,
            rating: row.rating ? parseFloat(row.rating) : 4.5
        }));
        
        res.json({
            success: true,
            count: sanitizedData.length,
            data: sanitizedData
        });
    } catch (error) {
        console.error('Error searching nearby:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Nearby search failed',
            message: error.message
        });
    }
});

module.exports = router;