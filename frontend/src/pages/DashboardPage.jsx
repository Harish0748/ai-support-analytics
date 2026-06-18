import { useQuery } from '@tanstack/react-query';
import { analyticsService, ticketService } from '../services/api';
import {
  Ticket, TrendingUp, Clock, Star, AlertTriangle,
  CheckCircle, Activity, Users, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#f97316',
  very_negative: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

function StatCard({ icon: Icon, label, value, subValue, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), 30).toISOString().split('T')[0];

  const { data: dashData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => analyticsService.getDashboard({ startDate, endDate }),
    refetchInterval: 60000,
  });

  const { data: recentTickets } = useQuery({
    queryKey: ['tickets', 'recent'],
    queryFn: () => ticketService.getAll({ limit: 5, sortBy: 'created_at', sortOrder: 'DESC' }),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = dashData?.data?.data;
  const { summary, daily_volume, sentiment_distribution, category_distribution, priority_distribution } = metrics || {};

  // Transform daily volume for chart
  const volumeData = (daily_volume || []).map((d) => ({
    date: format(new Date(d.date), 'MMM d'),
    tickets: parseInt(d.count),
  }));

  const sentimentData = (sentiment_distribution || []).map((s) => ({
    name: s.sentiment?.replace('_', ' '),
    value: parseInt(s.count),
    color: SENTIMENT_COLORS[s.sentiment] || '#94a3b8',
  }));

  const categoryData = (category_distribution || []).slice(0, 6).map((c) => ({
    category: c.ai_category?.replace(/ & /g, '\n&\n') || 'Other',
    count: parseInt(c.count),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Last 30 days overview</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Total Tickets"
          value={summary?.total_tickets?.toLocaleString() || 0}
          subValue={`${summary?.open_tickets || 0} open`}
          color="blue"
          trend={12}
        />
        <StatCard
          icon={CheckCircle}
          label="Resolution Rate"
          value={`${summary?.resolution_rate || 0}%`}
          subValue={`${summary?.resolved_tickets || 0} resolved`}
          color="green"
          trend={5}
        />
        <StatCard
          icon={Clock}
          label="Avg Resolution"
          value={`${Math.round(summary?.avg_resolution_time || 0)}m`}
          subValue="minutes to resolve"
          color="orange"
          trend={-8}
        />
        <StatCard
          icon={Star}
          label="Satisfaction"
          value={parseFloat(summary?.avg_satisfaction || 0).toFixed(1)}
          subValue="out of 5.0"
          color="purple"
          trend={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket volume chart */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Ticket Volume (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sentiment pie chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">Sentiment Distribution</h3>
          {sentimentData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Tickets']} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sentimentData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 capitalize">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Category bar chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Top Categories</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent tickets */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Tickets</h3>
          <a href="/tickets" className="text-blue-600 hover:text-blue-700 text-xs font-medium">View all →</a>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentTickets?.data?.data || []).map((ticket) => (
            <div key={ticket.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{ticket.ticket_number}</span>
                    <span className={`badge ${`status-${ticket.status}`}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${`priority-${ticket.priority}`}`}>
                      {ticket.priority}
                    </span>
                    {ticket.sentiment && (
                      <span className={`badge sentiment-${ticket.sentiment}`}>
                        {ticket.sentiment.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">{ticket.customer_name} · {ticket.channel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
