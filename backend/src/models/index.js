const User = require('./User');
const Ticket = require('./Ticket');
const Message = require('./Message');
const AgentMetric = require('./AgentMetric');

// Associations
User.hasMany(Ticket, { foreignKey: 'assigned_agent_id', as: 'assignedTickets' });
Ticket.belongsTo(User, { foreignKey: 'assigned_agent_id', as: 'assignedAgent' });

Ticket.hasMany(Message, { foreignKey: 'ticket_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

User.hasMany(AgentMetric, { foreignKey: 'agent_id', as: 'metrics' });
AgentMetric.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

module.exports = { User, Ticket, Message, AgentMetric };
