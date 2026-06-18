const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentMetric = sequelize.define('AgentMetric', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  agent_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  tickets_handled: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tickets_resolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  avg_resolution_time_minutes: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  avg_first_response_time_minutes: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  avg_satisfaction_score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  positive_sentiments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  negative_sentiments: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  escalations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  messages_sent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  online_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'agent_metrics',
  indexes: [
    { fields: ['agent_id'] },
    { fields: ['date'] },
    { unique: true, fields: ['agent_id', 'date'] },
  ],
});

module.exports = AgentMetric;
