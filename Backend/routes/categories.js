// routes/categories.js
// Categories management routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// GET all categories
router.get('/', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                c.*,
                COUNT(r.id) as restaurant_count
            FROM categories c
            LEFT JOIN restaurants r ON c.id = r.category_id AND r.is_active = true
            GROUP BY c.id
            ORDER BY c.name
        `);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch categories' 
        });
    }
});

// GET single category with restaurants
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const categoryResult = await query(`
            SELECT * FROM categories WHERE id = $1
        `, [id]);
        
        if (categoryResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Category not found' 
            });
        }
        
        const restaurantsResult = await query(`
            SELECT 
                r.*,
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
            LEFT JOIN restaurant_images ri ON r.id = ri.restaurant_id
            WHERE r.category_id = $1 AND r.is_active = true
            GROUP BY r.id
            ORDER BY r.rating DESC
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...categoryResult.rows[0],
                restaurants: restaurantsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch category' 
        });
    }
});

module.exports = router; 