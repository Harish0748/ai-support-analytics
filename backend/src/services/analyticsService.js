const { Op, fn, col, literal } = require('sequelize');
const { Ticket, Message, User, AgentMetric } = require('../models');
const aiService = require('./aiService');
const logger = require('../utils/logger');

class AnalyticsService {
  async getDashboardMetrics(startDate, endDate) {
    const dateFilter = {
      created_at: {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      },
    };

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime,
      sentimentDistribution,
      categoryDistribution,
      priorityDistribution,
      channelDistribution,
      dailyTicketVolume,
      satisfactionAvg,
    ] = await Promise.all([
      Ticket.count({ where: dateFilter }),
      Ticket.count({ where: { ...dateFilter, status: 'open' } }),
      Ticket.count({ where: { ...dateFilter, status: 'resolved' } }),
      Ticket.findOne({
        attributes: [[fn('AVG', col('resolution_time_minutes')), 'avg_time']],
        where: { ...dateFilter, resolution_time_minutes: { [Op.not]: null } },
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['sentiment', [fn('COUNT', col('id')), 'count']],
        where: { ...dateFilter, sentiment: { [Op.not]: null } },
        group: ['sentiment'],
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['ai_category', [fn('COUNT', col('id')), 'count']],
        where: { ...dateFilter, ai_category: { [Op.not]: null } },
        group: ['ai_category'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['priority', [fn('COUNT', col('id')), 'count']],
        where: dateFilter,
        group: ['priority'],
        raw: true,
      }),
      Ticket.findAll({
        attributes: ['channel', [fn('COUNT', col('id')), 'count']],
        where: dateFilter,
        group: ['channel'],
        raw: true,
      }),
      Ticket.findAll({
        attributes: [
          [fn('DATE', col('created_at')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: dateFilter,
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']],
        raw: true,
      }),
      Ticket.findOne({
        attributes: [[fn('AVG', col('satisfaction_score')), 'avg_score']],
        where: { ...dateFilter, satisfaction_score: { [Op.not]: null } },
        raw: true,
      }),
    ]);

    const resolutionRate =
      totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0;

    return {
      summary: {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        resolved_tickets: resolvedTickets,
        resolution_rate: parseFloat(resolutionRate),
        avg_resolution_time: parseFloat(avgResolutionTime?.avg_time || 0).toFixed(1),
        avg_satisfaction: parseFloat(satisfactionAvg?.avg_score || 0).toFixed(2),
      },
      sentiment_distribution: sentimentDistribution,
      category_distribution: categoryDistribution,
      priority_distribution: priorityDistribution,
      channel_distribution: channelDistribution,
      daily_volume: dailyTicketVolume,
    };
  }

  async getAgentPerformance(startDate, endDate, agentId = null) {
    const where = agentId ? { id: agentId } : {};
    const dateFilter = { date: { [Op.between]: [startDate, endDate] } };

    const agents = await User.findAll({
      where: { ...where, role: { [Op.in]: ['agent', 'manager'] } },
      include: [
        {
          model: AgentMetric,
          as: 'metrics',
          where: dateFilter,
          required: false,
        },
        {
          model: Ticket,
          as: 'assignedTickets',
          where: { created_at: { [Op.between]: [startDate, endDate] } },
          required: false,
          attributes: ['id', 'status', 'priority', 'sentiment', 'satisfaction_score', 'resolution_time_minutes'],
        },
      ],
    });

    return agents.map((agent) => {
      const metrics = agent.metrics || [];
      const tickets = agent.assignedTickets || [];

      const totalTickets = tickets.length;
      const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
      const avgSatisfaction =
        tickets.filter((t) => t.satisfaction_score).length > 0
          ? tickets.reduce((sum, t) => sum + (t.satisfaction_score || 0), 0) /
            tickets.filter((t) => t.satisfaction_score).length
          : 0;
      const avgResolutionTime =
        tickets.filter((t) => t.resolution_time_minutes).length > 0
          ? tickets.reduce((sum, t) => sum + (t.resolution_time_minutes || 0), 0) /
            tickets.filter((t) => t.resolution_time_minutes).length
          : 0;

      const sentimentCounts = tickets.reduce((acc, t) => {
        acc[t.sentiment] = (acc[t.sentiment] || 0) + 1;
        return acc;
      }, {});

      return {
        agent: {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
        },
        performance: {
          total_tickets: totalTickets,
          resolved_tickets: resolvedTickets,
          resolution_rate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(1) : 0,
          avg_satisfaction: avgSatisfaction.toFixed(2),
          avg_resolution_time_minutes: avgResolutionTime.toFixed(1),
          sentiment_breakdown: sentimentCounts,
        },
      };
    });
  }

  async getSentimentTrends(startDate, endDate) {
    const data = await Ticket.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        'sentiment',
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        sentiment: { [Op.not]: null },
      },
      group: [fn('DATE', col('created_at')), 'sentiment'],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    return data;
  }

  async generateAIInsights(startDate, endDate) {
    try {
      const metrics = await this.getDashboardMetrics(startDate, endDate);
      return await aiService.generateInsights(metrics);
    } catch (error) {
      logger.error('AI insights error:', error.message);
      return { insights: [], trends: [], recommendations: [] };
    }
  }

  async getLiveStats() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    const [
      activeTickets,
      ticketsLastHour,
      criticalTickets,
      recentMessages,
    ] = await Promise.all([
      Ticket.count({ where: { status: { [Op.in]: ['open', 'in_progress'] } } }),
      Ticket.count({ where: { created_at: { [Op.gte]: oneHourAgo } } }),
      Ticket.count({
        where: {
          priority: 'critical',
          status: { [Op.in]: ['open', 'in_progress'] },
        },
      }),
      Message.count({ where: { created_at: { [Op.gte]: oneHourAgo } } }),
    ]);

    return {
      active_tickets: activeTickets,
      tickets_last_hour: ticketsLastHour,
      critical_tickets: criticalTickets,
      messages_last_hour: recentMessages,
      timestamp: now,
    };
  }
}

module.exports = new AnalyticsService();
