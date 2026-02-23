const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Public routes for submitting and viewing basic info
router.post('/', reviewController.submitReview);
router.get('/ticket/:ticketId', reviewController.getReviewTicketInfo);

// Admin route for viewing all reviews
router.get('/admin/all', authMiddleware, requireRole('ADMIN'), reviewController.getAllReviews);

module.exports = router;
