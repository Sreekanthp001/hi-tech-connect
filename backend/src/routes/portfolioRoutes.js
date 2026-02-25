const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public: Auto-synced portfolio from completed tickets with before/after photos
router.get('/public', portfolioController.getPublicPortfolio);

// Public route to view legacy portfolio
router.get('/', portfolioController.getWorkPhotos);

// Admin routes to manage legacy portfolio
router.post('/', authMiddleware, requireRole('ADMIN'), portfolioController.createWorkPhoto);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), portfolioController.deleteWorkPhoto);

module.exports = router;
