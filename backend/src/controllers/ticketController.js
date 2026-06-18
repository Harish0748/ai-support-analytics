const { Op } = require('sequelize');
const { Ticket, Message, User } = require('../models');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const getTickets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      sentiment,
      category,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (sentiment) where.sentiment = sentiment;
    if (category) where.ai_category = category;
    if (search) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } },
        { customer_email: { [Op.like]: `%${search}%` } },
        { ticket_number: { [Op.like]: `%${search}%` } },
      ];
    }

    // Agents see only assigned tickets
    if (req.user.role === 'agent') {
      where.assigned_agent_id = req.user.id;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: [{ model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email'] }],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email', 'avatar'] },
        {
          model: Message,
          as: 'messages',
          order: [['created_at', 'ASC']],
          include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] }],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { customer_name, customer_email, subject, description, channel, priority } = req.body;

    const ticket = await Ticket.create({
      customer_name,
      customer_email,
      subject,
      description,
      channel: channel || 'web',
      priority: priority || 'medium',
    });

    // AI processing in background
    processTicketWithAI(ticket).catch((err) => logger.error('AI processing error:', err.message));

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

const processTicketWithAI = async (ticket) => {
  try {
    const [sentimentResult, categorizationResult] = await Promise.all([
      aiService.analyzeSentiment(`${ticket.subject} ${ticket.description}`),
      aiService.categorizeTicket(ticket.subject, ticket.description),
    ]);

    const suggestedResponse = await aiService.generateResponse({
      ...ticket.toJSON(),
      sentiment: sentimentResult.sentiment,
      ai_category: categorizationResult.category,
    });

    await ticket.update({
      sentiment: sentimentResult.sentiment,
      sentiment_score: sentimentResult.score,
      ai_category: categorizationResult.category,
      ai_summary: categorizationResult.summary,
      ai_suggested_response: suggestedResponse,
      priority: categorizationResult.priority !== 'medium' ? categorizationResult.priority : ticket.priority,
      tags: categorizationResult.keywords || [],
    });
  } catch (error) {
    logger.error('AI ticket processing failed:', error.message);
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { status, priority, assigned_agent_id, satisfaction_score, category } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
      if (status === 'resolved' && !ticket.resolved_at) {
        updates.resolved_at = new Date();
        const resolutionTime = Math.round(
          (new Date() - new Date(ticket.created_at)) / (1000 * 60)
        );
        updates.resolution_time_minutes = resolutionTime;
      }
    }
    if (priority) updates.priority = priority;
    if (assigned_agent_id !== undefined) updates.assigned_agent_id = assigned_agent_id;
    if (satisfaction_score) updates.satisfaction_score = satisfaction_score;
    if (category) updates.ai_category = category;

    await ticket.update(updates);

    const updated = await Ticket.findByPk(ticket.id, {
      include: [{ model: User, as: 'assignedAgent', attributes: ['id', 'name', 'email'] }],
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { content, is_internal, sender_type } = req.body;

    const message = await Message.create({
      ticket_id: ticket.id,
      sender_type: sender_type || 'agent',
      sender_id: req.user.id,
      sender_name: req.user.name,
      content,
      is_internal: is_internal || false,
    });

    // Analyze sentiment of new message
    if (!is_internal) {
      const sentimentResult = await aiService.analyzeSentiment(content);
      await message.update({
        sentiment: sentimentResult.sentiment,
        sentiment_score: sentimentResult.score,
      });

      // Set first response time
      if (!ticket.first_response_at && sender_type !== 'customer') {
        const responseTime = Math.round(
          (new Date() - new Date(ticket.created_at)) / (1000 * 60)
        );
        await ticket.update({
          first_response_at: new Date(),
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        });
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

const generateAIResponse = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{ model: Message, as: 'messages', limit: 10, order: [['created_at', 'DESC']] }],
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const response = await aiService.generateResponse(ticket.toJSON(), ticket.messages || []);
    res.json({ success: true, data: { suggested_response: response } });
  } catch (error) {
    next(error);
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    await ticket.destroy();
    res.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addMessage,
  generateAIResponse,
  deleteTicket,
};
