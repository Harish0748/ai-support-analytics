import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService, userService } from '../services/api';
import {
  ArrowLeft, Brain, Send, Sparkles, Clock, User,
  Tag, AlertTriangle, CheckCircle, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'escalated'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function SentimentBadge({ sentiment, score }) {
  if (!sentiment) return null;
  const map = {
    positive: { label: '😊 Positive', class: 'sentiment-positive' },
    neutral: { label: '😐 Neutral', class: 'sentiment-neutral' },
    negative: { label: '😞 Negative', class: 'sentiment-negative' },
    very_negative: { label: '😡 Very Negative', class: 'sentiment-very_negative' },
  };
  const s = map[sentiment];
  return (
    <div className={`badge ${s.class} gap-1`}>
      {s.label}
      {score !== null && score !== undefined && (
        <span className="opacity-70">({score > 0 ? '+' : ''}{parseFloat(score).toFixed(2)})</span>
      )}
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const messagesEndRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getById(id),
    refetchInterval: 15000,
  });

  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: userService.getAgents,
  });

  const ticket = data?.data?.data;
  const agents = agentsData?.data?.data || [];

  const updateTicketMutation = useMutation({
    mutationFn: (updates) => ticketService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      toast.success('Ticket updated');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => ticketService.addMessage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
      setMessage('');
      toast.success('Message sent');
    },
  });

  const handleGetAISuggestion = async () => {
    setAiSuggesting(true);
    try {
      const { data } = await ticketService.getAIResponse(id);
      setMessage(data.data.suggested_response || '');
      toast.success('AI response generated');
    } catch {
      toast.error('Failed to generate AI response');
    } finally {
      setAiSuggesting(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <button onClick={() => navigate('/tickets')} className="btn-primary mt-4 text-sm">Back to tickets</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tickets')}
          className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
            <span className={`badge status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
            <span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span>
            <SentimentBadge sentiment={ticket.sentiment} score={ticket.sentiment_score} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mt-1 truncate">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main: conversation */}
        <div className="lg:col-span-2 space-y-4">
          {/* Messages */}
          <div className="card">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Conversation</h3>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {(ticket.messages || []).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender_type === 'customer' ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    msg.sender_type === 'customer' ? 'bg-gray-200 text-gray-700' :
                    msg.sender_type === 'ai' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-600 text-white'
                  }`}>
                    {msg.sender_type === 'ai' ? '✦' : msg.sender_name?.charAt(0)}
                  </div>
                  <div className={`flex-1 max-w-sm ${msg.sender_type === 'customer' ? '' : 'items-end'} flex flex-col`}>
                    <div className={`rounded-xl px-3.5 py-2.5 text-sm ${
                      msg.sender_type === 'customer'
                        ? 'bg-gray-100 text-gray-800'
                        : msg.sender_type === 'ai'
                        ? 'bg-purple-50 text-purple-900 border border-purple-100'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${msg.sender_type === 'customer' ? '' : 'flex-row-reverse'}`}>
                      <span className="text-xs text-gray-400">{msg.sender_name}</span>
                      <span className="text-xs text-gray-300">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                      {msg.sentiment && (
                        <span className={`text-xs badge sentiment-${msg.sentiment} py-0 px-1.5`}>
                          {msg.sentiment.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-gray-100">
              {ticket.ai_suggested_response && !message && (
                <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">AI suggested response</span>
                  </div>
                  <p className="text-xs text-purple-800 line-clamp-2">{ticket.ai_suggested_response}</p>
                  <button
                    onClick={() => setMessage(ticket.ai_suggested_response)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1"
                  >
                    Use this response →
                  </button>
                </div>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                className="input resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={handleGetAISuggestion}
                  disabled={aiSuggesting}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {aiSuggesting ? (
                    <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  )}
                  AI Suggest
                </button>
                <button
                  onClick={() => sendMessageMutation.mutate({ content: message, sender_type: 'agent' })}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="btn-primary text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: ticket info */}
        <div className="space-y-4">
          {/* Ticket details */}
          <div className="card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Ticket Details</h3>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => updateTicketMutation.mutate({ status: e.target.value })}
                className="input text-xs py-1.5"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select
                value={ticket.priority}
                onChange={(e) => updateTicketMutation.mutate({ priority: e.target.value })}
                className="input text-xs py-1.5"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Assigned Agent</label>
              <select
                value={ticket.assigned_agent_id || ''}
                onChange={(e) => updateTicketMutation.mutate({ assigned_agent_id: e.target.value || null })}
                className="input text-xs py-1.5"
              >
                <option value="">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Customer</span>
                <span className="text-xs font-medium text-gray-700">{ticket.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Email</span>
                <span className="text-xs text-blue-600">{ticket.customer_email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Channel</span>
                <span className="text-xs text-gray-700 capitalize">{ticket.channel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-xs text-gray-700">{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
              </div>
              {ticket.resolution_time_minutes && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Resolution time</span>
                  <span className="text-xs text-gray-700">{ticket.resolution_time_minutes}m</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">AI Analysis</h3>
            </div>
            <div className="space-y-3">
              {ticket.ai_category && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Category</p>
                  <span className="badge bg-purple-50 text-purple-700">{ticket.ai_category}</span>
                </div>
              )}
              {ticket.ai_summary && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Summary</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{ticket.ai_summary}</p>
                </div>
              )}
              {ticket.tags?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Satisfaction */}
          {ticket.status === 'resolved' && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Satisfaction</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => updateTicketMutation.mutate({ satisfaction_score: star })}
                    className={`text-xl transition-transform hover:scale-110 ${
                      star <= (ticket.satisfaction_score || 0) ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ticket.satisfaction_score && (
                <p className="text-xs text-gray-500 mt-1">{ticket.satisfaction_score}/5 stars</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
