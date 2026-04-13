// routes/uploads.js
// Image upload routes for menu items, restaurants, and other assets

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Create upload directories
const createUploadDirs = () => {
    const dirs = ['menu', 'restaurants', 'categories', 'temp'];
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, '..', 'uploads', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
};

createUploadDirs();

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Storage configuration
const createStorage = (uploadPath) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            const fullPath = path.join(__dirname, '..', 'uploads', uploadPath);
            cb(null, fullPath);
        },
        filename: (req, file, cb) => {
            const timestamp = Date.now();
            const ext = path.extname(file.originalname);
            const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
            const baseName = path.basename(safeName, ext);
            cb(null, `${timestamp}_${baseName}${ext}`);
        }
    });
};

// Upload configurations for different types
const menuUpload = multer({
    storage: createStorage('menu'),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const restaurantUpload = multer({
    storage: createStorage('restaurants'),
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for restaurant images
});

const categoryUpload = multer({
    storage: createStorage('categories'),
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for category images
});

// Validation middleware
const validateUpload = [
    body('type').isIn(['menu', 'restaurant', 'category']).withMessage('Invalid upload type'),
];

// POST /api/uploads/menu-image
router.post('/menu-image', menuUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        const imageUrl = `/uploads/menu/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Menu image uploaded successfully',
            data: {
                image_url: imageUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Menu image upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload menu image'
        });
    }
});

// POST /api/uploads/restaurant-image
router.post('/restaurant-image', restaurantUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        const imageUrl = `/uploads/restaurants/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Restaurant image uploaded successfully',
            data: {
                image_url: imageUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Restaurant image upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload restaurant image'
        });
    }
});

// POST /api/uploads/category-image
router.post('/category-image', categoryUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file uploaded'
            });
        }

        const imageUrl = `/uploads/categories/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Category image uploaded successfully',
            data: {
                image_url: imageUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Category image upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload category image'
        });
    }
});

// DELETE /api/uploads/image/:type/:filename
router.delete('/image/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;

        // Validate type
        const allowedTypes = ['menu', 'restaurants', 'categories'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid image type'
            });
        }

        // Construct file path
        const filePath = path.join(__dirname, '..', 'uploads', type, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Image file not found'
            });
        }

        // Delete file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete image'
        });
    }
});

module.exports = router;
