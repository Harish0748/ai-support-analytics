const express = require('express');
const {
  getDashboard, getAgentPerformance, getSentimentTrends,
  getAIInsights, getLiveStats,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/agent-performance', authorize('admin', 'manager'), getAgentPerformance);
router.get('/sentiment-trends', getSentimentTrends);
router.get('/ai-insights', authorize('admin', 'manager'), getAIInsights);
router.get('/live', getLiveStats);

module.exports = router;
