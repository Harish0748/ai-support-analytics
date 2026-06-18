const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticket_number: {
    type: DataTypes.STRING(20),
    unique: true,
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  customer_email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed', 'escalated'),
    defaultValue: 'open',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
  },
  channel: {
    type: DataTypes.ENUM('email', 'chat', 'phone', 'social', 'web'),
    defaultValue: 'web',
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ai_category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'neutral', 'negative', 'very_negative'),
    allowNull: true,
  },
  sentiment_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: { min: -1, max: 1 },
  },
  ai_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ai_suggested_response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assigned_agent_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  first_response_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolution_time_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  satisfaction_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'tickets',
  hooks: {
    beforeCreate: async (ticket) => {
      if (!ticket.ticket_number) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        ticket.ticket_number = `TKT-${timestamp}-${random}`;
      }
    },
  },
  indexes: [
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['sentiment'] },
    { fields: ['assigned_agent_id'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Ticket;
