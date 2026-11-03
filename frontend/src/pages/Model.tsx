
import { useEffect, useState } from 'react';
import { Badge, Card } from '../ui';

const API = 'http://127.0.0.1:8000';

type ModelInfo = {
  name: string;
  version: string;
  loaded: boolean;
};

type Metrics = {
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  roc_auc: number | null;
  requests: number;
  errors: number;
  error_rate: number;
  latency_p95_ms: number;
  drift_score: number;
};

type Feature = {
  name: string;
  importance: number;
};

export default function Model() {
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const [m, s, f] = await Promise.all([
          fetch(`${API}/model-info`).then(r => {
            if (!r.ok) throw new Error('Model API failed');
            return r.json();
          }),
          fetch(`${API}/metrics-summary`).then(r => {
            if (!r.ok) throw new Error('Metrics API failed');
            return r.json();
          }),
          fetch(`${API}/feature-importance`).then(r => {
            if (!r.ok) throw new Error('Feature API failed');
            return r.json();
          })
        ]);

        if (!active) return;

        setModel(m);
        setMetrics(s);
        setFeatures(f.features || []);
        setConnected(true);
      } catch (error) {
        if (active) setConnected(false);
        console.error('Backend connection error:', error);
      }
    };

    refresh();
    const timer = setInterval(refresh, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const percent = (v: number | null | undefined) =>
    v == null ? 'N/A' : `${(v * 100).toFixed(2)}%`;

  const evaluation = [
    ['Accuracy', metrics?.accuracy],
    ['Precision', metrics?.precision],
    ['Recall', metrics?.recall],
    ['F1 Score', metrics?.f1],
    ['ROC-AUC', metrics?.roc_auc]
  ] as const;

  const monitoring = [
    ['API Requests', metrics?.requests],
    ['API Errors', metrics?.errors],
    ['Error Rate', metrics ? percent(metrics.error_rate) : null],
    ['P95 Latency', metrics ? `${metrics.latency_p95_ms.toFixed(2)} ms` : null],
    ['Drift Score', metrics?.drift_score?.toFixed(4)]
  ] as const;

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">ML Model Performance</h2>
          <p className="text-sm text-slate-500">
            Random Forest Network Intrusion Detection
          </p>
        </div>
        <Badge live={connected} />
      </div>

      <Card title="Model Information">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Algorithm</p>
            <p className="font-semibold">{model?.name ?? 'Unavailable'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Version</p>
            <p className="font-semibold">{model?.version ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className={`font-semibold ${model?.loaded ? 'text-emerald-600' : 'text-rose-600'}`}>
              {model?.loaded ? 'Loaded' : 'Unavailable'}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Model Evaluation - Hold-out Test Set">
        <p className="mb-4 text-sm text-slate-500">
          Saved evaluation results from the model's test dataset.
          These are not live prediction accuracy measurements.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {evaluation.map(([name, value]) => (
            <div key={name} className="rounded-xl border p-4">
              <p className="text-sm text-slate-500">{name}</p>
              <p className="mt-2 text-2xl font-bold">
                {percent(value)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Feature Importance - Random Forest">
        <p className="mb-5 text-sm text-slate-500">
          Actual feature importance values extracted from the trained model.
          Higher values indicate greater contribution to tree impurity reduction.
        </p>

        {features.length === 0 ? (
          <p className="text-sm text-amber-600">
            Feature importance data unavailable. Check backend connection.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold">
              Top 10 of {features.length} model features
            </p>

            {features.slice(0, 10).map((feature, index) => (
              <div key={feature.name}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-medium">
                    {index + 1}. {feature.name}
                  </span>
                  <span className="text-slate-500">
                    {(feature.importance * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(
                        (feature.importance / features[0].importance) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Live API Monitoring">
        <p className="mb-4 text-sm text-slate-500">
          Runtime measurements refresh every five seconds.
        </p>

        {!connected ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Backend unavailable. Start the FastAPI server.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {monitoring.map(([name, value]) => (
              <div key={name} className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">{name}</p>
                <p className="mt-2 text-xl font-bold">
                  {value ?? 'N/A'}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Model Configuration">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Dataset', 'CIC-IDS2017'],
            ['Algorithm', 'Random Forest'],
            ['Input Features', '78'],
            ['Number of Trees', '150'],
            ['Maximum Tree Depth', '18'],
            ['Output Classes', 'BENIGN / ATTACK']
          ].map(([name, value]) => (
            <div key={name}>
              <p className="text-sm text-slate-500">{name}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
