import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api';
import { subDays, format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { Calendar } from 'lucide-react';

const CHANNEL_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#9333ea'];

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), range).toISOString().split('T')[0];

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard', range],
    queryFn: () => analyticsService.getDashboard({ startDate, endDate }),
  });

  const { data: sentimentData } = useQuery({
    queryKey: ['analytics', 'sentiment', range],
    queryFn: () => analyticsService.getSentimentTrends({ startDate, endDate }),
  });

  const metrics = dashData?.data?.data;
  const sentimentTrends = sentimentData?.data?.data || [];

  // Process sentiment trends into date-grouped data
  const sentimentByDate = {};
  sentimentTrends.forEach((s) => {
    if (!sentimentByDate[s.date]) sentimentByDate[s.date] = { date: format(new Date(s.date), 'MMM d') };
    sentimentByDate[s.date][s.sentiment] = parseInt(s.count);
  });
  const sentimentChartData = Object.values(sentimentByDate);

  const channelData = (metrics?.channel_distribution || []).map((c, i) => ({
    name: c.channel,
    value: parseInt(c.count),
    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
  }));

  const priorityData = (metrics?.priority_distribution || []).map((p) => ({
    priority: p.priority,
    count: parseInt(p.count),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Detailed metrics and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Ticket volume area chart */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ticket Volume Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={(metrics?.daily_volume || []).map((d) => ({
                date: format(new Date(d.date), 'MMM d'),
                tickets: parseInt(d.count),
              }))}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="tickets" stroke="#2563eb" strokeWidth={2} fill="url(#colorTickets)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment trends stacked bar */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sentimentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="positive" stackId="a" fill="#22c55e" name="Positive" radius={[0, 0, 0, 0]} />
                <Bar dataKey="neutral" stackId="a" fill="#94a3b8" name="Neutral" />
                <Bar dataKey="negative" stackId="a" fill="#f97316" name="Negative" />
                <Bar dataKey="very_negative" stackId="a" fill="#ef4444" name="Very Negative" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel + Priority split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tickets by Channel</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={2}>
                      {channelData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {channelData.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-gray-600 capitalize">{c.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="priority" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.priority === 'critical' ? '#ef4444' :
                        entry.priority === 'high' ? '#f97316' :
                        entry.priority === 'medium' ? '#eab308' : '#22c55e'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
