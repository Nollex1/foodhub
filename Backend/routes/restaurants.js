// routes/restaurants.js - WITH OWNER AUTHENTICATION
// Restaurant management routes with proper authorization

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRestaurant = [
    body('name').trim().notEmpty().withMessage('Restaurant name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
];

// Middleware to verify restaurant ownership
async function verifyOwnership(req, res, next) {
    try {
        const restaurantId = req.params.id;
        const userId = req.user?.id; // From auth token
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Please login to manage your restaurant'
            });
        }
        
        const result = await query(
            'SELECT owner_id FROM restaurants WHERE id = $1',
            [restaurantId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Restaurant not found'
            });
        }
        
        if (result.rows[0].owner_id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to manage this restaurant'
            });
        }
        
        next();
    } catch (error) {
        console.error('Ownership verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify ownership'
        });
    }
}

// GET all restaurants (public - no auth needed)
router.get('/', async (req, res) => {
    try {
        const { city, state, category, limit = 50, offset = 0 } = req.query;
        
        let queryText = `
            SELECT 
                r.*,
                c.name as category_name,
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
            WHERE r.is_active = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (city) {
            queryText += ` AND r.city ILIKE $${paramCount}`;
            params.push(`%${city}%`);
            paramCount++;
        }
        
        if (state) {
            queryText += ` AND r.state ILIKE $${paramCount}`;
            params.push(`%${state}%`);
            paramCount++;
        }
        
        if (category) {
            queryText += ` AND c.name ILIKE $${paramCount}`;
            params.push(`%${category}%`);
            paramCount++;
        }
        
        queryText += `
            GROUP BY r.id, c.name
            ORDER BY r.rating DESC NULLS LAST, r.created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await query(queryText, params);
        
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
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch restaurants',
            message: error.message
        });
    }
});

// GET restaurants owned by current user
router.get('/my-restaurants', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Please login to view your restaurants'
            });
        }
        
        const result = await query(`
            SELECT 
                r.*,
                c.name as category_name
            FROM restaurants r
            LEFT JOIN categories c ON r.category_id = c.id
            WHERE r.owner_id = $1
            ORDER BY r.created_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching user restaurants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your restaurants'
        });
    }
});

// GET single restaurant by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
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
                ) as images,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', m.id,
                            'name', m.name,
                            'description', m.description,
                            'price', m.price,
                            'image_url', m.image_url,
                            'category', m.category,
                            'is_available', m.is_available,
                            'preparation_time', m.preparation_time
                        )
                    ) FILTER (WHERE m.id IS NOT NULL),
                    '[]'
                ) as menu_items
            FROM restaurants r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN restaurant_images ri ON r.id = ri.restaurant_id
            LEFT JOIN menu_items m ON r.id = m.restaurant_id AND m.is_available = true
            WHERE r.id = $1 AND r.is_active = true
            GROUP BY r.id, c.name
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Restaurant not found' 
            });
        }
        
        const restaurant = result.rows[0];
        restaurant.rating = restaurant.rating ? parseFloat(restaurant.rating) : 4.5;
        
        res.json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch restaurant',
            message: error.message
        });
    }
});

// POST create new restaurant (requires authentication)
router.post('/', validateRestaurant, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Please login to register a restaurant'
            });
        }
        
        const {
            name, description, phone, whatsapp, email, address, city, state,
            latitude, longitude, category_id, logo_url, cover_image_url,
            opening_time, closing_time, delivery_available, minimum_order, delivery_fee
        } = req.body;
        
        const finalWhatsapp = whatsapp || phone;
        const finalDeliveryAvailable = delivery_available !== false;
        const finalMinimumOrder = minimum_order || 0;
        const finalDeliveryFee = delivery_fee || 500;
        
        const result = await query(`
            INSERT INTO restaurants (
                name, description, phone, whatsapp, email, address, city, state,
                latitude, longitude, category_id, logo_url, cover_image_url,
                opening_time, closing_time, delivery_available, minimum_order, delivery_fee,
                owner_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `, [
            name, description, phone, finalWhatsapp, email, address, city, state,
            latitude, longitude, category_id, logo_url, cover_image_url,
            opening_time, closing_time, finalDeliveryAvailable, finalMinimumOrder, finalDeliveryFee,
            userId  // ADDED: Link restaurant to user
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Restaurant registered successfully! 🎉',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create restaurant',
            message: error.message
        });
    }
});

// PUT update restaurant (requires ownership)
router.put('/:id', validateRestaurant, verifyOwnership, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        
        const { id } = req.params;
        const {
            name, description, phone, whatsapp, email, address, city, state,
            latitude, longitude, category_id, logo_url, cover_image_url,
            opening_time, closing_time, delivery_available, minimum_order, delivery_fee
        } = req.body;
        
        const result = await query(`
            UPDATE restaurants SET
                name = $1, description = $2, phone = $3, whatsapp = $4, email = $5,
                address = $6, city = $7, state = $8, latitude = $9, longitude = $10,
                category_id = $11, logo_url = $12, cover_image_url = $13,
                opening_time = $14, closing_time = $15, delivery_available = $16,
                minimum_order = $17, delivery_fee = $18, updated_at = CURRENT_TIMESTAMP
            WHERE id = $19 AND is_active = true
            RETURNING *
        `, [
            name, description, phone, whatsapp, email, address, city, state,
            latitude, longitude, category_id, logo_url, cover_image_url,
            opening_time, closing_time, delivery_available, minimum_order, delivery_fee, id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Restaurant not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Restaurant updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update restaurant',
            message: error.message
        });
    }
});

// DELETE restaurant (requires ownership)
router.delete('/:id', verifyOwnership, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            UPDATE restaurants 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, name
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Restaurant not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Restaurant deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete restaurant',
            message: error.message
        });
    }
});

module.exports = router;