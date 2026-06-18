const openai = require('../config/openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzeSentiment(text) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert for customer support. 
            Analyze the sentiment of customer messages and return a JSON response with:
            - sentiment: one of "positive", "neutral", "negative", "very_negative"
            - score: float between -1 (very negative) and 1 (very positive)
            - emotions: array of detected emotions (e.g., "frustrated", "satisfied", "confused")
            - urgency: "low", "medium", "high"
            Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this customer message:\n\n"${text}"`,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      logger.error('Sentiment analysis error:', error.message);
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: [],
        urgency: 'medium',
      };
    }
  }

  async categorizeTicket(subject, description) {
    try {
      const categories = [
        'Technical Issue', 'Billing & Payment', 'Account Management',
        'Product Question', 'Feature Request', 'Bug Report',
        'Shipping & Delivery', 'Refund & Returns', 'General Inquiry',
        'Complaint', 'Compliment', 'Security Issue',
      ];

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a customer support ticket classifier. 
            Classify tickets into one of these categories: ${categories.join(', ')}.
            Also determine priority and provide a brief summary.
            Return ONLY valid JSON with:
            - category: string (one of the listed categories)
            - priority: "low", "medium", "high", or "critical"
            - summary: brief 1-2 sentence summary
            - keywords: array of 3-5 key terms
            No markdown in response.`,
          },
          {
            role: 'user',
            content: `Classify this support ticket:\n\nSubject: ${subject}\n\nDescription: ${description}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      logger.error('Ticket categorization error:', error.message);
      return {
        category: 'General Inquiry',
        priority: 'medium',
        summary: subject,
        keywords: [],
      };
    }
  }

  async generateResponse(ticketData, conversationHistory = []) {
    try {
      const systemPrompt = `You are a professional and empathetic customer support agent.
      Your goal is to resolve customer issues efficiently while maintaining a friendly, helpful tone.
      
      Ticket details:
      - Category: ${ticketData.ai_category || ticketData.category || 'General'}
      - Priority: ${ticketData.priority}
      - Customer sentiment: ${ticketData.sentiment || 'neutral'}
      
      Guidelines:
      1. Address the customer by name if possible
      2. Acknowledge their concern empathetically
      3. Provide a clear, actionable solution
      4. Keep response concise (under 200 words)
      5. End with a next step or offer further assistance`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.sender_type === 'customer' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: `Generate a helpful response for this ticket:\nSubject: ${ticketData.subject}\nDescription: ${ticketData.description}`,
        },
      ];

      const response = await openai.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 400,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Response generation error:', error.message);
      return null;
    }
  }

  async analyzeConversationTrends(messages) {
    try {
      const conversationText = messages
        .map((m) => `${m.sender_type}: ${m.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Analyze this customer support conversation and return JSON with:
            - overall_sentiment: final customer sentiment
            - sentiment_progression: "improving", "stable", "declining"
            - key_issues: array of main issues discussed
            - resolution_quality: "excellent", "good", "fair", "poor"
            - follow_up_needed: boolean
            - insights: brief string with key insights
            Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Analyze this conversation:\n\n${conversationText}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      logger.error('Conversation analysis error:', error.message);
      return null;
    }
  }

  async generateInsights(analyticsData) {
    try {
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a customer support analytics expert. 
            Analyze the provided metrics and generate actionable insights.
            Return JSON with:
            - insights: array of insight objects, each with { title, description, impact: "high/medium/low", action }
            - trends: array of notable trends
            - recommendations: array of improvement recommendations
            Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Generate insights from this analytics data:\n${JSON.stringify(analyticsData, null, 2)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      logger.error('Insights generation error:', error.message);
      return { insights: [], trends: [], recommendations: [] };
    }
  }
}

module.exports = new AIService();
