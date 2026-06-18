import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api';
import { subDays, format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SentimentPage() {
  const [range, setRange] = useState(30);
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), range).toISOString().split('T')[0];

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['sentiment-dashboard', range],
    queryFn: () => analyticsService.getDashboard({ startDate, endDate }),
  });

  const { data: trendsData } = useQuery({
    queryKey: ['sentiment-trends', range],
    queryFn: () => analyticsService.getSentimentTrends({ startDate, endDate }),
  });

  const metrics = dashData?.data?.data;
  const trends = trendsData?.data?.data || [];

  // Group trends by date
  const byDate = {};
  trends.forEach((t) => {
    const d = format(new Date(t.date), 'MMM d');
    if (!byDate[d]) byDate[d] = { date: d, positive: 0, neutral: 0, negative: 0, very_negative: 0 };
    byDate[d][t.sentiment] = parseInt(t.count);
  });
  const chartData = Object.values(byDate);

  // Compute sentiment score trend
  const sentimentDist = metrics?.sentiment_distribution || [];
  const total = sentimentDist.reduce((s, d) => s + parseInt(d.count), 0);
  const positiveCount = parseInt(sentimentDist.find(d => d.sentiment === 'positive')?.count || 0);
  const negativeCount = parseInt(sentimentDist.find(d => d.sentiment === 'negative')?.count || 0) +
                        parseInt(sentimentDist.find(d => d.sentiment === 'very_negative')?.count || 0);
  const sentimentScore = total > 0 ? ((positiveCount - negativeCount) / total * 100).toFixed(1) : 0;

  const cards = [
    { label: 'Positive', key: 'positive', color: '#22c55e', icon: TrendingUp, bg: 'bg-green-50', text: 'text-green-700' },
    { label: 'Neutral', key: 'neutral', color: '#94a3b8', icon: Minus, bg: 'bg-gray-100', text: 'text-gray-600' },
    { label: 'Negative', key: 'negative', color: '#f97316', icon: TrendingDown, bg: 'bg-orange-50', text: 'text-orange-700' },
    { label: 'Very Negative', key: 'very_negative', color: '#ef4444', icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sentiment Analysis</h1>
          <p className="text-gray-500 text-sm">NLP-powered customer sentiment tracking</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >{d}d</button>
          ))}
        </div>
      </div>

      {/* Overall score */}
      <div className="card p-6 flex items-center gap-6">
        <div className="text-center">
          <div className={`text-4xl font-bold ${sentimentScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {sentimentScore >= 0 ? '+' : ''}{sentimentScore}%
          </div>
          <p className="text-gray-500 text-sm mt-1">Net Sentiment Score</p>
        </div>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${parseFloat(sentimentScore) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, Math.abs(parseFloat(sentimentScore)))}%`, marginLeft: parseFloat(sentimentScore) >= 0 ? '50%' : `${50 - Math.abs(parseFloat(sentimentScore))}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 w-32 text-center">
          {parseFloat(sentimentScore) > 20 ? 'Customers are happy 😊' :
           parseFloat(sentimentScore) > 0 ? 'Slightly positive 🙂' :
           parseFloat(sentimentScore) > -20 ? 'Needs attention ⚠️' : 'Critical — act now 🚨'}
        </p>
      </div>

      {/* Sentiment cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, key, color, icon: Icon, bg, text }) => {
          const count = parseInt(sentimentDist.find(d => d.sentiment === key)?.count || 0);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
          return (
            <div key={key} className="stat-card">
              <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
                <Icon className={`w-4 h-4 ${text}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500">{label}</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Trend chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Over Time</h3>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                {[['green', '#22c55e'], ['gray', '#94a3b8'], ['orange', '#f97316'], ['red', '#ef4444']].map(([name, color]) => (
                  <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="positive" stroke="#22c55e" fill="url(#grad-green)" strokeWidth={2} name="Positive" />
              <Area type="monotone" dataKey="neutral" stroke="#94a3b8" fill="url(#grad-gray)" strokeWidth={2} name="Neutral" />
              <Area type="monotone" dataKey="negative" stroke="#f97316" fill="url(#grad-orange)" strokeWidth={2} name="Negative" />
              <Area type="monotone" dataKey="very_negative" stroke="#ef4444" fill="url(#grad-red)" strokeWidth={2} name="Very Negative" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
