// routes/cities.js
// Cities management routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateCity = [
    body('city').trim().notEmpty().withMessage('City name is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
];

// GET all cities
router.get('/', async (req, res) => {
    try {
        const { country, state, limit = 100, offset = 0 } = req.query;

        let queryText = `
            SELECT c.*, 
                   COUNT(r.id) as restaurant_count
            FROM cities c
            LEFT JOIN restaurants r ON c.id = r.city_id AND r.is_active = true
            WHERE c.is_active = true
        `;

        const params = [];
        let paramCount = 1;

        if (country) {
            queryText += ` AND c.country ILIKE $${paramCount}`;
            params.push(`%${country}%`);
            paramCount++;
        }

        if (state) {
            queryText += ` AND c.state ILIKE $${paramCount}`;
            params.push(`%${state}%`);
            paramCount++;
        }

        queryText += `
            GROUP BY c.id
            ORDER BY c.country, c.state, c.city
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;
        params.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, params);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cities'
        });
    }
});

// GET single city by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT c.*,
                   COUNT(r.id) as restaurant_count
            FROM cities c
            LEFT JOIN restaurants r ON c.id = r.city_id AND r.is_active = true
            WHERE c.id = $1 AND c.is_active = true
            GROUP BY c.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'City not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch city'
        });
    }
});

// POST create new city
router.post('/', validateCity, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { city, state, country, latitude, longitude } = req.body;

        const result = await query(`
            INSERT INTO cities (city, state, country, latitude, longitude)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [city, state, country || 'Nigeria', latitude, longitude]);

        res.status(201).json({
            success: true,
            message: 'City added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating city:', error);
        if (error.code === '23505') { // Unique constraint violation
            res.status(400).json({
                success: false,
                error: 'City already exists in this state/country'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create city'
            });
        }
    }
});

// PUT update city
router.put('/:id', validateCity, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { city, state, country, latitude, longitude, is_active } = req.body;

        const result = await query(`
            UPDATE cities SET
                city = $1, state = $2, country = $3, latitude = $4, longitude = $5,
                is_active = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `, [city, state, country, latitude, longitude, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'City not found'
            });
        }

        res.json({
            success: true,
            message: 'City updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating city:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update city'
        });
    }
});

// DELETE city (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE cities
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, city, state
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'City not found'
            });
        }

        res.json({
            success: true,
            message: 'City deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete city'
        });
    }
});

module.exports = router;
