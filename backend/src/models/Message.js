const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticket_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  sender_type: {
    type: DataTypes.ENUM('customer', 'agent', 'ai', 'system'),
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  sender_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_internal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'neutral', 'negative', 'very_negative'),
    allowNull: true,
  },
  sentiment_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'messages',
  indexes: [
    { fields: ['ticket_id'] },
    { fields: ['sender_type'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Message;
