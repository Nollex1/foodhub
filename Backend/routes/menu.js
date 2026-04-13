 // routes/menu.js
// Menu items management routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateMenuItem = [
    body('restaurant_id').isInt().withMessage('Valid restaurant ID is required'),
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
];

// GET all menu items for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { available } = req.query;
        
        let queryText = `
            SELECT * FROM menu_items 
            WHERE restaurant_id = $1
        `;
        
        const params = [restaurantId];
        
        if (available !== undefined) {
            queryText += ' AND is_available = $2';
            params.push(available === 'true');
        }
        
        queryText += ' ORDER BY category, name';
        
        const result = await query(queryText, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch menu items' 
        });
    }
});

// GET single menu item
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            SELECT m.*, r.name as restaurant_name 
            FROM menu_items m
            JOIN restaurants r ON m.restaurant_id = r.id
            WHERE m.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Menu item not found' 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch menu item' 
        });
    }
});

// POST create new menu item
router.post('/', validateMenuItem, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        
        const {
            restaurant_id, name, description, price, image_url,
            category, is_available, preparation_time
        } = req.body;
        
        const result = await query(`
            INSERT INTO menu_items (
                restaurant_id, name, description, price, image_url,
                category, is_available, preparation_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            restaurant_id, name, description, price, image_url,
            category, is_available !== false, preparation_time
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create menu item' 
        });
    }
});

// PUT update menu item
router.put('/:id', validateMenuItem, async (req, res) => {
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
            restaurant_id, name, description, price, image_url,
            category, is_available, preparation_time
        } = req.body;
        
        const result = await query(`
            UPDATE menu_items SET
                restaurant_id = $1, name = $2, description = $3, price = $4,
                image_url = $5, category = $6, is_available = $7,
                preparation_time = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `, [
            restaurant_id, name, description, price, image_url,
            category, is_available, preparation_time, id
        ]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Menu item not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update menu item' 
        });
    }
});

// DELETE menu item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            DELETE FROM menu_items 
            WHERE id = $1
            RETURNING id, name
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Menu item not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Menu item deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete menu item' 
        });
    }
});

module.exports = router;