require('dotenv').config();
const { connectDB } = require('../config/database');
const { User, Ticket, Message, AgentMetric } = require('../models');
const logger = require('./logger');

const sampleTickets = [
  { subject: 'Cannot login to my account', description: 'I have been trying to login for the past hour but keep getting an error message saying my password is incorrect. I have already tried resetting it twice.', sentiment: 'negative', priority: 'high', channel: 'email', ai_category: 'Account Management' },
  { subject: 'Billing charge is incorrect', description: 'I was charged $99 instead of the $49 plan I subscribed to. Please refund the difference immediately.', sentiment: 'very_negative', priority: 'critical', channel: 'chat', ai_category: 'Billing & Payment' },
  { subject: 'Feature request: Dark mode', description: 'Would love to see a dark mode option in the app. It would really help with eye strain during night usage.', sentiment: 'positive', priority: 'low', channel: 'web', ai_category: 'Feature Request' },
  { subject: 'App crashes on startup', description: 'After the latest update, the app crashes every time I try to open it. I am using iOS 17 on iPhone 14 Pro.', sentiment: 'negative', priority: 'critical', channel: 'phone', ai_category: 'Bug Report' },
  { subject: 'How to export data?', description: 'I need to export all my data to CSV format. I looked through the settings but cannot find the export option. Can you help?', sentiment: 'neutral', priority: 'medium', channel: 'web', ai_category: 'Product Question' },
  { subject: 'Excellent customer support!', description: 'Just wanted to say that Sarah from your team was incredibly helpful. She resolved my issue in minutes and was very professional.', sentiment: 'positive', priority: 'low', channel: 'email', ai_category: 'Compliment' },
  { subject: 'Order not delivered', description: 'My order #12345 was supposed to arrive 3 days ago but still hasn\'t shown up. The tracking shows it\'s been stuck in transit.', sentiment: 'negative', priority: 'high', channel: 'chat', ai_category: 'Shipping & Delivery' },
  { subject: 'API rate limit too low', description: 'Our integration keeps hitting the rate limit. We need higher limits for our enterprise use case. Currently limited to 100 req/min.', sentiment: 'neutral', priority: 'medium', channel: 'web', ai_category: 'Technical Issue' },
  { subject: 'Refund request for unused subscription', description: 'I cancelled my subscription last week but was still charged for this month. I would like a full refund as I did not use the service.', sentiment: 'negative', priority: 'high', channel: 'email', ai_category: 'Refund & Returns' },
  { subject: 'Security concern with shared account', description: 'I noticed unauthorized logins from an unknown location. I am concerned about the security of my account and need immediate assistance.', sentiment: 'very_negative', priority: 'critical', channel: 'phone', ai_category: 'Security Issue' },
];

const seed = async () => {
  await connectDB();
  logger.info('Seeding database...');

  try {
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@support.com',
      password: 'Admin@123',
      role: 'admin',
    });

    // Create manager
    const manager = await User.create({
      name: 'Sarah Manager',
      email: 'sarah@support.com',
      password: 'Manager@123',
      role: 'manager',
    });

    // Create agents
    const agents = await User.bulkCreate([
      { name: 'John Agent', email: 'john@support.com', password: 'Agent@123', role: 'agent' },
      { name: 'Emily Agent', email: 'emily@support.com', password: 'Agent@123', role: 'agent' },
      { name: 'Mike Agent', email: 'mike@support.com', password: 'Agent@123', role: 'agent' },
    ]);

    const allAgents = [manager, ...agents];
    const statuses = ['open', 'in_progress', 'resolved', 'closed'];
    const customers = [
      { name: 'Alice Johnson', email: 'alice@email.com' },
      { name: 'Bob Smith', email: 'bob@email.com' },
      { name: 'Carol White', email: 'carol@email.com' },
      { name: 'David Brown', email: 'david@email.com' },
      { name: 'Eve Wilson', email: 'eve@email.com' },
    ];

    // Create tickets with messages
    for (let i = 0; i < 50; i++) {
      const template = sampleTickets[i % sampleTickets.length];
      const customer = customers[i % customers.length];
      const agent = allAgents[i % allAgents.length];
      const status = statuses[i % statuses.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const ticket = await Ticket.create({
        ...template,
        customer_name: customer.name,
        customer_email: customer.email,
        status,
        assigned_agent_id: agent.id,
        sentiment_score: template.sentiment === 'positive' ? 0.7 :
                         template.sentiment === 'neutral' ? 0 :
                         template.sentiment === 'negative' ? -0.5 : -0.9,
        ai_summary: `${template.subject} - customer requires assistance`,
        satisfaction_score: status === 'resolved' ? Math.floor(Math.random() * 3) + 3 : null,
        resolution_time_minutes: status === 'resolved' ? Math.floor(Math.random() * 480) + 30 : null,
        resolved_at: status === 'resolved' ? new Date(createdAt.getTime() + Math.random() * 8 * 60 * 60 * 1000) : null,
        created_at: createdAt,
        tags: ['support', template.ai_category?.toLowerCase().replace(/\s/g, '-')],
      });

      // Add messages
      await Message.create({
        ticket_id: ticket.id,
        sender_type: 'customer',
        sender_name: customer.name,
        content: template.description,
        sentiment: template.sentiment,
        sentiment_score: ticket.sentiment_score,
        created_at: createdAt,
      });

      if (status !== 'open') {
        await Message.create({
          ticket_id: ticket.id,
          sender_type: 'agent',
          sender_id: agent.id,
          sender_name: agent.name,
          content: `Thank you for contacting us, ${customer.name}. I understand your concern and I'm here to help you resolve this issue.`,
          created_at: new Date(createdAt.getTime() + 30 * 60 * 1000),
        });
      }
    }

    // Create agent metrics for last 30 days
    for (const agent of allAgents) {
      for (let day = 0; day < 30; day++) {
        const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        await AgentMetric.create({
          agent_id: agent.id,
          date,
          tickets_handled: Math.floor(Math.random() * 15) + 5,
          tickets_resolved: Math.floor(Math.random() * 10) + 2,
          avg_resolution_time_minutes: Math.floor(Math.random() * 120) + 30,
          avg_first_response_time_minutes: Math.floor(Math.random() * 30) + 5,
          avg_satisfaction_score: (Math.random() * 2 + 3).toFixed(2),
          positive_sentiments: Math.floor(Math.random() * 8),
          negative_sentiments: Math.floor(Math.random() * 5),
          escalations: Math.floor(Math.random() * 2),
          messages_sent: Math.floor(Math.random() * 40) + 10,
          online_minutes: Math.floor(Math.random() * 120) + 360,
        });
      }
    }

    logger.info('✅ Database seeded successfully!');
    logger.info('Admin: admin@support.com / Admin@123');
    logger.info('Manager: sarah@support.com / Manager@123');
    logger.info('Agent: john@support.com / Agent@123');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
