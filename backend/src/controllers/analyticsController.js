const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

const getDashboard = async (req, res, next) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
    } = req.query;

    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getAgentPerformance = async (req, res, next) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
      agentId,
    } = req.query;

    const performance = await analyticsService.getAgentPerformance(startDate, endDate, agentId);
    res.json({ success: true, data: performance });
  } catch (error) {
    next(error);
  }
};

const getSentimentTrends = async (req, res, next) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
    } = req.query;

    const trends = await analyticsService.getSentimentTrends(startDate, endDate);
    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};

const getAIInsights = async (req, res, next) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
    } = req.query;

    const insights = await analyticsService.generateAIInsights(startDate, endDate);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

const getLiveStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getLiveStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getAgentPerformance, getSentimentTrends, getAIInsights, getLiveStats };
