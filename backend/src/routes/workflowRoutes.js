const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. Create a Request
router.post('/requests', workflowController.createRequest);

// Below routes generally require auth
router.use(authMiddleware);

// 2. Assign Site Visit
router.put('/:id/assign-visit', workflowController.assignSiteVisit);

// 3. Complete Visit
router.put('/:id/complete-visit', workflowController.completeSiteVisit);

// 4. Quoting
router.put('/:id/quotation/send', workflowController.sendQuotation);
router.put('/:id/approve', workflowController.approveRequest);

// 5. Assignment
router.post('/:id/assign', workflowController.assignWork);

// 6. Complete Work
router.put('/:id/complete', workflowController.completeWork);

// 7. Dashboards
router.get('/dashboard/admin', workflowController.getAdminDashboard);
router.get('/dashboard/technician', workflowController.getTechnicianDashboard);
router.get('/dashboard/worker', workflowController.getWorkerDashboard);

module.exports = router;
