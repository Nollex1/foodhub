// routes/reviews.js
// Reviews management routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateReview = [
    body('restaurant_id').isInt().withMessage('Valid restaurant ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
];

// GET reviews for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get reviews with user info (anonymized)
        const reviewsResult = await query(`
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                r.is_verified,
                COALESCE(u.name, 'Anonymous') as reviewer_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.restaurant_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [restaurantId, limit, offset]);

        // Get average rating and total count
        const statsResult = await query(`
            SELECT
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating
            FROM reviews
            WHERE restaurant_id = $1
        `, [restaurantId]);

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            data: {
                reviews: reviewsResult.rows,
                stats: {
                    total_reviews: parseInt(stats.total_reviews),
                    average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(stats.total_reviews)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
});

// GET reviews for a menu item
router.get('/menu-item/:menuItemId', async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const reviewsResult = await query(`
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                r.is_verified,
                COALESCE(u.name, 'Anonymous') as reviewer_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.menu_item_id = $1
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [menuItemId, limit, offset]);

        const statsResult = await query(`
            SELECT
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating
            FROM reviews
            WHERE menu_item_id = $1
        `, [menuItemId]);

        const stats = statsResult.rows[0];

        res.json({
            success: true,
            data: {
                reviews: reviewsResult.rows,
                stats: {
                    total_reviews: parseInt(stats.total_reviews),
                    average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(stats.total_reviews)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching menu item reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
});

// POST create a new review
router.post('/', validateReview, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { restaurant_id, menu_item_id, rating, comment, user_id } = req.body;

        // Check if user already reviewed this item/restaurant
        if (user_id) {
            const existingReview = await query(`
                SELECT id FROM reviews
                WHERE user_id = $1 AND restaurant_id = $2 AND
                      (menu_item_id = $3 OR menu_item_id IS NULL)
            `, [user_id, restaurant_id, menu_item_id || null]);

            if (existingReview.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'You have already reviewed this item'
                });
            }
        }

        // Insert new review
        const result = await query(`
            INSERT INTO reviews (user_id, restaurant_id, menu_item_id, rating, comment, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, rating, comment, created_at
        `, [user_id || null, restaurant_id, menu_item_id || null, rating, comment || null, false]);

        // Update restaurant/menu item rating stats
        if (restaurant_id) {
            await updateRestaurantRating(restaurant_id);
        }
        if (menu_item_id) {
            await updateMenuItemRating(menu_item_id);
        }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit review'
        });
    }
});

// Helper function to update restaurant rating
async function updateRestaurantRating(restaurantId) {
    try {
        const result = await query(`
            UPDATE restaurants
            SET
                rating = (
                    SELECT AVG(rating) FROM reviews WHERE restaurant_id = $1
                ),
                total_reviews = (
                    SELECT COUNT(*) FROM reviews WHERE restaurant_id = $1
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [restaurantId]);
    } catch (error) {
        console.error('Error updating restaurant rating:', error);
    }
}

// Helper function to update menu item rating
async function updateMenuItemRating(menuItemId) {
    try {
        const result = await query(`
            UPDATE menu_items
            SET
                rating = (
                    SELECT AVG(rating) FROM reviews WHERE menu_item_id = $1
                ),
                total_reviews = (
                    SELECT COUNT(*) FROM reviews WHERE menu_item_id = $1
                ),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [menuItemId]);
    } catch (error) {
        console.error('Error updating menu item rating:', error);
    }
}

module.exports = router;