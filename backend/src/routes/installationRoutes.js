const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installationController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Assign team (Admin only)
router.post('/assign', requireRole('ADMIN'), installationController.assignTeam);

// List all assignments (Admin or Technician might need viewing)
router.get('/', installationController.getAssignments);

// Update status (Technician marking as pending, in-progress, completed)
router.put('/:id/status', installationController.updateStatus);

module.exports = router;
