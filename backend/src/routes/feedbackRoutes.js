const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

/**
 * Feedback Routes
 * Alias for /api/reviews — exposes a clean /api/feedback endpoint
 * as used in Telegram completion message links.
 */

// POST /api/feedback — Submit a review (public)
router.post('/', reviewController.submitReview);

// GET /api/feedback/ticket/:ticketId — Get ticket info for feedback form (public)
router.get('/ticket/:ticketId', reviewController.getReviewTicketInfo);

module.exports = router;
