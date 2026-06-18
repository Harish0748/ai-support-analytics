import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api';
import { subDays } from 'date-fns';
import { Users, Star, Clock, Ticket, TrendingUp } from 'lucide-react';

function AgentCard({ agent, performance }) {
  const resRate = parseFloat(performance.resolution_rate);
  const satisfaction = parseFloat(performance.avg_satisfaction);

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {agent.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
          <p className="text-xs text-gray-500">{agent.email}</p>
          <span className="badge bg-blue-50 text-blue-700 mt-1 capitalize">{agent.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-gray-900">{performance.total_tickets}</p>
          <p className="text-xs text-gray-500">Tickets handled</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-green-600">{performance.resolution_rate}%</p>
          <p className="text-xs text-gray-500">Resolution rate</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-yellow-600">{satisfaction > 0 ? satisfaction : '—'}</p>
          <p className="text-xs text-gray-500">Avg satisfaction</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xl font-bold text-blue-600">{performance.avg_resolution_time_minutes}m</p>
          <p className="text-xs text-gray-500">Avg resolution</p>
        </div>
      </div>

      {/* Resolution rate bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Resolution rate</span>
          <span>{performance.resolution_rate}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${Math.min(100, resRate)}%` }}
          />
        </div>
      </div>

      {/* Sentiment breakdown */}
      {Object.keys(performance.sentiment_breakdown || {}).length > 0 && (
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {Object.entries(performance.sentiment_breakdown).map(([s, count]) => (
            <span key={s} className={`badge sentiment-${s} text-xs py-0.5`}>
              {s.replace('_', ' ')}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), 30).toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['agent-performance'],
    queryFn: () => analyticsService.getAgentPerformance({ startDate, endDate }),
  });

  const agents = data?.data?.data || [];
  const sorted = [...agents].sort((a, b) => b.performance.total_tickets - a.performance.total_tickets);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agent Performance</h1>
        <p className="text-gray-500 text-sm">30-day performance metrics for all agents</p>
      </div>

      {/* Summary stats */}
      {agents.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Agents', value: agents.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total Tickets', value: agents.reduce((s, a) => s + a.performance.total_tickets, 0), icon: Ticket, color: 'text-purple-600 bg-purple-50' },
            { label: 'Avg Resolution Rate', value: `${(agents.reduce((s, a) => s + parseFloat(a.performance.resolution_rate), 0) / agents.length).toFixed(1)}%`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Avg Satisfaction', value: (agents.filter(a => parseFloat(a.performance.avg_satisfaction) > 0).reduce((s, a) => s + parseFloat(a.performance.avg_satisfaction), 0) / Math.max(1, agents.filter(a => parseFloat(a.performance.avg_satisfaction) > 0).length)).toFixed(1), icon: Star, color: 'text-yellow-600 bg-yellow-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Agent cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No agent data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((item) => (
            <AgentCard key={item.agent.id} agent={item.agent} performance={item.performance} />
          ))}
        </div>
      )}
    </div>
  );
}
