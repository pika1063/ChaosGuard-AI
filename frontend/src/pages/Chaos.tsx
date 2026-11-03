
import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  ShieldAlert,
  Zap
} from 'lucide-react';

import { badInput, ping, probe, simCall, simReset } from '../api';
import { Badge, Card } from '../ui';

const SIMS = [
  {
    id: 'drift',
    name: 'Data Drift',
    description: 'Simulates a shift in incoming network traffic features.',
    expected: 'Drift score increases and monitoring detects the change.',
    kind: 'drift',
    destructive: false,
    icon: Activity
  },
  {
    id: 'invalid',
    name: 'Invalid Input',
    description: 'Sends an invalid request to the prediction API.',
    expected: 'API rejects the request with HTTP 422.',
    kind: '',
    destructive: false,
    icon: AlertTriangle
  },
  {
    id: 'latency',
    name: 'High Latency',
    description: 'Introduces artificial delay in the inference service.',
    expected: 'Latency monitoring detects the threshold breach.',
    kind: 'latency',
    destructive: false,
    icon: Clock
  },
  {
    id: 'artifact',
    name: 'Model Artifact Failure',
    description: 'Temporarily makes the model unavailable.',
    expected: 'Health check fails and service recovery is attempted.',
    kind: 'artifact',
    destructive: true,
    icon: ShieldAlert
  },
  {
    id: 'api',
    name: 'API Failure',
    description: 'Simulates temporary prediction API unavailability.',
    expected: 'API errors increase and recovery is checked.',
    kind: 'fail',
    destructive: true,
    icon: Zap
  },
  {
    id: 'spike',
    name: 'Traffic Spike',
    description: 'Represents a sudden increase in incoming requests.',
    expected: 'Throughput monitoring can identify unusual traffic.',
    kind: '',
    destructive: false,
    icon: Activity
  }
] as const;

const MOCK = [
  'Failure triggered',
  'Monitoring alert generated',
  'Failure detected',
  'Recovery attempted',
  'Service restored'
];

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export default function Chaos() {
  const [live, setLive] = useState(false);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [finished, setFinished] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ping()
      .then(setLive)
      .finally(() => setLoading(false));
  }, []);

  const addLog = (id: string, message: string) => {
    setLogs(previous => ({
      ...previous,
      [id]: [...(previous[id] ?? []), message]
    }));
  };

  const runSimulation = async (
    id: string,
    kind: string,
    destructive: boolean
  ) => {
    if (busy) return;

    if (
      destructive &&
      !window.confirm(
        'Run this failure drill? It temporarily affects the test API. Continue?'
      )
    ) {
      return;
    }

    setBusy(id);
    setLogs(previous => ({ ...previous, [id]: [] }));
    setFinished(previous => ({ ...previous, [id]: '' }));

    const start = Date.now();
    const elapsed = () => ((Date.now() - start) / 1000).toFixed(1) + ' s';

    try {
      if (!live) {
        for (const message of MOCK) {
          await sleep(500);
          addLog(id, message);
        }

        setFinished(previous => ({
          ...previous,
          [id]: 'Simulated only — backend not involved'
        }));

        return;
      }

      if (id === 'invalid') {
        addLog(id, 'Sending invalid request...');

        const status = await badInput();

        addLog(
          id,
          status === 422
            ? 'Failure detected: HTTP 422 validation response'
            : `Unexpected response: HTTP ${status}`
        );

        addLog(id, 'Service remains available');

        setFinished(previous => ({
          ...previous,
          [id]: `Completed in ${elapsed()}`
        }));

        return;
      }

      if (!kind) {
        addLog(id, 'This drill requires a separate load-test script.');
        addLog(id, 'No backend failure was triggered.');

        setFinished(previous => ({
          ...previous,
          [id]: 'Informational drill — no backend simulation'
        }));

        return;
      }

      addLog(id, 'Triggering failure simulation...');

      const started = await simCall(kind, 900);

      if (!started) {
        addLog(id, 'Simulation could not start.');
        addLog(id, 'Check CHAOS_ENABLED=true on the backend.');

        return;
      }

      addLog(id, 'Failure triggered. Checking monitoring probes...');

      let detected = false;

      for (let i = 0; i < 10 && !detected; i++) {
        await sleep(700);

        const status = await probe();

        detected =
          !status.ok ||
          status.ms > 500 ||
          status.drift > 1;
      }

      addLog(
        id,
        detected
          ? 'Failure detected by monitoring probes.'
          : 'Failure NOT detected by the monitoring probes.'
      );

      addLog(id, 'Attempting service recovery...');

      await simReset();

      let recovered = false;

      for (let i = 0; i < 15 && !recovered; i++) {
        await sleep(700);

        const status = await probe();

        recovered =
          status.ok &&
          status.ms < 500 &&
          status.drift < 1;
      }

      addLog(
        id,
        recovered
          ? 'Service recovery confirmed.'
          : 'Recovery could not be confirmed.'
      );

      setFinished(previous => ({
        ...previous,
        [id]: `Measured end-to-end time: ${elapsed()}`
      }));
    } catch {
      addLog(id, 'Simulation request failed. Check backend connectivity.');

      setFinished(previous => ({
        ...previous,
        [id]: 'Simulation ended with an error'
      }));
    } finally {
      setBusy('');
    }
  };

  const completed = Object.values(finished).filter(Boolean).length;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          RELIABILITY ENGINEERING / CHAOS TESTING
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Chaos Simulation Center
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Test how the ML service responds to failures and whether monitoring
          can detect and recover from them.
        </p>

        <div className="mt-3">
          <Badge live={live} />
        </div>
      </div>

      {/* CONNECTION STATUS */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${
        live
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}>
        {live
          ? <CheckCircle2 size={24} className="text-emerald-600" />
          : <AlertTriangle size={24} className="text-amber-600" />
        }

        <div>
          <p className="font-semibold text-slate-800">
            {loading
              ? 'Checking backend connection...'
              : live
                ? 'Backend connected'
                : 'Backend unavailable'}
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {live
              ? 'Failure drills can use the backend simulation endpoints. CHAOS_ENABLED=true is required.'
              : 'Only browser-based demonstration logs will be generated until the backend is reachable.'}
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Available drills</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">06</p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Completed drills</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {completed}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-slate-500">Current activity</p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {busy ? 'Running' : 'Idle'}
          </p>
        </div>
      </div>

      {/* SIMULATIONS */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Failure Scenarios
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select a scenario to test the system's resilience.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {SIMS.map(sim => {
            const Icon = sim.icon;
            const messages = logs[sim.id] ?? [];
            const isRunning = busy === sim.id;
            const isFinished = Boolean(finished[sim.id]);

            return (
              <Card key={sim.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Icon size={23} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {sim.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Failure scenario
                      </p>
                    </div>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isRunning
                      ? 'bg-amber-50 text-amber-700'
                      : isFinished
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isRunning ? 'Running' : isFinished ? 'Completed' : 'Idle'}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {sim.description}
                </p>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    Expected behaviour
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {sim.expected}
                  </p>
                </div>

                <button
                  onClick={() =>
                    runSimulation(sim.id, sim.kind, sim.destructive)
                  }
                  disabled={Boolean(busy) || loading}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRunning
                    ? <RotateCcw size={15} className="animate-spin" />
                    : <Play size={15} />
                  }

                  {isRunning ? 'Running simulation...' : 'Run simulation'}
                </button>

                {messages.length > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Execution log
                    </p>

                    <ol className="space-y-2">
                      {messages.map((message, index) => (
                        <li key={index} className="flex gap-2 text-xs text-slate-600">
                          <span className="font-bold text-blue-500">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {message}
                        </li>
                      ))}
                    </ol>

                    {finished[sim.id] && (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700">
                        {finished[sim.id]}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
