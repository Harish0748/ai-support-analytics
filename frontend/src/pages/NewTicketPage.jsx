import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '../services/api';
import { ArrowLeft, Send, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    channel: 'web',
    priority: 'medium',
  });

  const createMutation = useMutation({
    mutationFn: ticketService.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['tickets']);
      toast.success('Ticket created — AI is analyzing it now');
      navigate(`/tickets/${res.data.data.id}`);
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Ticket</h1>
          <p className="text-gray-500 text-sm">AI will automatically analyze sentiment and categorize</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <Brain className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <p className="text-xs text-purple-700">After submission, AI will auto-categorize, analyze sentiment, and suggest a response.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name *</label>
              <input className="input" required value={form.customer_name} onChange={set('customer_name')} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Email *</label>
              <input className="input" type="email" required value={form.customer_email} onChange={set('customer_email')} placeholder="john@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
            <input className="input" required value={form.subject} onChange={set('subject')} placeholder="Brief description of the issue" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea className="input resize-none" rows={5} required value={form.description} onChange={set('description')} placeholder="Detailed description of the customer's issue..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel</label>
              <select className="input" value={form.channel} onChange={set('channel')}>
                {['web', 'email', 'chat', 'phone', 'social'].map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/tickets')} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {createMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Send className="w-4 h-4" />}
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
