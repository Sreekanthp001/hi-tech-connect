const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public route to view portfolio
router.get('/', portfolioController.getWorkPhotos);

// Admin routes to manage portfolio
router.post('/', authMiddleware, requireRole('ADMIN'), portfolioController.createWorkPhoto);
router.delete('/:id', authMiddleware, requireRole('ADMIN'), portfolioController.deleteWorkPhoto);

module.exports = router;
