import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/api';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed', 'escalated'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const SENTIMENTS = ['', 'positive', 'neutral', 'negative', 'very_negative'];

export default function TicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', sentiment: '' });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, search, filters],
    queryFn: () => ticketService.getAll({ page, limit: 20, search, ...filters }),
    keepPreviousData: true,
  });

  const tickets = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagination?.total || 0} total tickets
          </p>
        </div>
        <Link to="/tickets/new" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Search and filters */}
      <div className="card p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets, customers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 py-1.5"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary text-xs flex items-center gap-1.5 ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {Object.values(filters).some(Boolean) && (
            <span className="w-4 h-4 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="w-full flex gap-2 flex-wrap pt-1 border-t border-gray-100">
            {[
              { key: 'status', label: 'Status', options: STATUSES },
              { key: 'priority', label: 'Priority', options: PRIORITIES },
              { key: 'sentiment', label: 'Sentiment', options: SENTIMENTS },
            ].map(({ key, label, options }) => (
              <select
                key={key}
                value={filters[key]}
                onChange={(e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); }}
                className="input py-1.5 text-xs w-36"
              >
                <option value="">All {label}s</option>
                {options.filter(Boolean).map((o) => (
                  <option key={o} value={o}>{o.replace('_', ' ')}</option>
                ))}
              </select>
            ))}
            <button
              onClick={() => { setFilters({ status: '', priority: '', sentiment: '' }); setPage(1); }}
              className="text-xs text-red-600 hover:text-red-700 px-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Tickets table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Ticket', 'Customer', 'Status', 'Priority', 'Sentiment', 'Category', 'Created', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-400">{ticket.ticket_number}</p>
                      <p className="text-sm font-medium text-gray-800 max-w-48 truncate">{ticket.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-400">{ticket.channel}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge status-${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge priority-${ticket.priority}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ticket.sentiment ? (
                        <span className={`badge sentiment-${ticket.sentiment}`}>
                          {ticket.sentiment.replace('_', ' ')}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{ticket.ai_category || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {format(new Date(ticket.created_at), 'MMM d, HH:mm')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">{page} / {pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
