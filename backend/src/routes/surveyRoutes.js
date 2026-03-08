const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const authMiddleware = require('../middleware/authMiddleware');

// Worker site survey route
router.post('/submit', authMiddleware, surveyController.submitSurvey);

module.exports = router;
