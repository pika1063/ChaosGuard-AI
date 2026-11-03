
import { useEffect, useState } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Clock,
  BrainCircuit,
  AlertTriangle,
  RefreshCw,
  Server
} from 'lucide-react';

import { getSummary, Summary, Source } from '../api';

import { Badge, Card } from '../ui';

export default function Overview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [source, setSource] = useState<Source>('mock');
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    const result = await getSummary();

    setSummary(result.s);
    setSource(result.source);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(loadDashboard, 10000);

    return () => clearInterval(timer);
  }, []);

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';

    return `${(value <= 1 ? value * 100 : value).toFixed(2)}%`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';

    return value.toLocaleString('en-IN');
  };

  const formatLatency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—';

    return `${value.toFixed(2)} ms`;
  };

  const metrics = [
    {
      title: 'Model Accuracy',
      value: formatPercent(summary?.accuracy),
      icon: BrainCircuit,
      color: 'bg-blue-50 text-blue-600',
      description: 'Prediction accuracy'
    },
    {
      title: 'Precision',
      value: formatPercent(summary?.precision),
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Correct attack predictions'
    },
    {
      title: 'Recall',
      value: formatPercent(summary?.recall),
      icon: ShieldAlert,
      color: 'bg-violet-50 text-violet-600',
      description: 'Attacks correctly identified'
    },
    {
      title: 'F1 Score',
      value: formatPercent(summary?.f1),
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'Model performance balance'
    },
    {
      title: 'API Requests',
      value: formatNumber(summary?.requests),
      icon: Server,
      color: 'bg-cyan-50 text-cyan-600',
      description: 'Requests received'
    },
    {
      title: 'P95 Latency',
      value: formatLatency(summary?.latency_p95_ms),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      description: '95th percentile response time'
    }
  ];

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            SECURITY INTELLIGENCE / DASHBOARD
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Overview
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Monitor your network intrusion detection system and ML performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge live={source === 'live'} />

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="btn flex items-center gap-2"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* STATUS BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">
              ChaosGuard AI Monitoring
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {source === 'live'
                ? 'Monitoring metrics received from the backend.'
                : 'Backend metrics are currently unavailable.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              source === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />

          <span className="text-xs font-semibold text-slate-700">
            {source === 'live' ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Performance Metrics
          </h3>

          <p className="text-sm text-slate-500">
            Model and API performance from your monitoring service.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.title}
                className="card transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {metric.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      {loading ? '...' : metric.value}
                    </h3>
                  </div>

                  <div className={`rounded-xl p-3 ${metric.color}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* RELIABILITY */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-800">
          System Reliability
        </h3>

        <div className="grid gap-4 md:grid-cols-3">

          <Card title="API Errors">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                <AlertTriangle size={22} />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : formatNumber(summary?.errors)}
                </p>
                <p className="text-xs text-slate-500">
                  Total recorded errors
                </p>
              </div>
            </div>
          </Card>

          <Card title="Error Rate">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Activity size={22} />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? '...' : formatPercent(summary?.error_rate)}
                </p>
                <p className="text-xs text-slate-500">
                  Recorded API error percentage
                </p>
              </div>
            </div>
          </Card>

          <Card title="Data Drift">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <Activity size={22} />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {loading
                    ? '...'
                    : summary?.drift_score?.toFixed(4) ?? '—'}
                </p>
                <p className="text-xs text-slate-500">
                  Current drift score
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* INFORMATION */}
      <Card title="About this dashboard">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Activity size={20} />
          </div>

          <div>
            <h4 className="font-semibold text-slate-800">
              Real-time ML monitoring
            </h4>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              ChaosGuard AI uses a machine learning model to classify network
              traffic as BENIGN or ATTACK. The dashboard displays model
              performance, API activity, latency, errors and data drift
              received from the backend monitoring service.
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}
