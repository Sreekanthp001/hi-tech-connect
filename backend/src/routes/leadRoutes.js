const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All lead routes require authentication
router.use(authMiddleware);

// Admin / Dashboard routes
router.get('/dashboard', requireRole('ADMIN'), leadController.getGroupedLeads);
router.get('/follow-ups', requireRole('ADMIN'), leadController.getFollowUpRequired);

// Action routes
router.post('/', requireRole('ADMIN'), leadController.createLead);
router.post('/:id/assign-visit', requireRole('ADMIN'), leadController.assignSiteVisit);

// Technician actions (or admin)
router.post('/:id/complete-visit', leadController.completeSiteVisit);

// Follow up and Status (Admin)
router.post('/:id/follow-up', requireRole('ADMIN'), leadController.logFollowUp);
router.put('/:id/status', requireRole('ADMIN'), leadController.updateStatus);

module.exports = router;
