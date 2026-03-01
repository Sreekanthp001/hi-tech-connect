const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Autocomplete (Authenticated users)
router.get('/search', authMiddleware, productController.search);

// Admin routes
router.get('/', authMiddleware, requireRole('ADMIN'), productController.getAll);
router.post('/', authMiddleware, requireRole('ADMIN'), productController.create);
router.put('/:id', authMiddleware, requireRole('ADMIN'), productController.update);

module.exports = router;
