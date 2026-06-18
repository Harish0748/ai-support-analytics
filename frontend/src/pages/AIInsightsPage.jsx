import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api';
import { subDays } from 'date-fns';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

const IMPACT_STYLES = {
  high: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
};

export default function AIInsightsPage() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), 30).toISOString().split('T')[0];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => analyticsService.getAIInsights({ startDate, endDate }),
    staleTime: 5 * 60 * 1000,
  });

  const insights = data?.data?.data || {};
  const { insights: insightsList = [], trends = [], recommendations = [] } = insights;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-500 text-sm">GPT-4 powered analytics on your last 30 days</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary text-xs flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-purple-500" />
          Regenerate Insights
        </button>
      </div>

      {isLoading ? (
        <div className="card p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-800">Analyzing your data with AI...</p>
            <p className="text-gray-500 text-sm mt-1">This may take 10–20 seconds</p>
          </div>
          <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Key Insights */}
          {insightsList.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Key Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightsList.map((insight, i) => {
                  const style = IMPACT_STYLES[insight.impact] || IMPACT_STYLES.low;
                  return (
                    <div key={i} className={`card p-4 border ${style.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{insight.title}</h3>
                            <span className={`badge text-xs ${style.bg} ${style.text}`}>{insight.impact} impact</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                          {insight.action && (
                            <p className="text-xs text-blue-600 mt-2 font-medium">→ {insight.action}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trends */}
          {trends.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Notable Trends
              </h2>
              <div className="card divide-y divide-gray-50">
                {trends.map((trend, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{trend}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Recommendations
              </h2>
              <div className="card divide-y divide-gray-50">
                {recommendations.map((rec, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 text-xs">✓</span>
                    </div>
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insightsList.length === 0 && trends.length === 0 && (
            <div className="card p-12 text-center">
              <Brain className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No insights generated yet. Add more ticket data and try again.</p>
              <button onClick={() => refetch()} className="btn-primary text-sm mt-4">Generate Insights</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
