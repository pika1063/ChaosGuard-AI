
import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  GitCompareArrows,
  AlertCircle
} from 'lucide-react';

import { getFeatures, predict, Prediction, Source } from '../api';
import { Badge, Card } from '../ui';

type HistoryItem = Prediction & {
  features: Record<string, number>;
};

export default function Lab() {
  const [names, setNames] = useState<string[]>([]);
  const [source, setSource] = useState<Source>('mock');
  const [values, setValues] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getFeatures()
      .then(data => {
        setNames(data.names);
        setSource(data.source);
      })
      .catch(() => setError('Could not load model features. Check the backend.'));
  }, []);

  const runPrediction = async () => {
    if (!names.length) {
      setError('No model features are available.');
      return;
    }

    const features: Record<string, number> = {};

    for (const name of names) {
      const raw = values[name] ?? '';

      if (raw.trim() === '' || !Number.isFinite(Number(raw))) {
        setError(`Please enter a valid number for ${name}.`);
        return;
      }

      features[name] = Number(raw);
    }

    setLoading(true);
    setError('');

    try {
      const result = await predict(features);

      setHistory(previous => [
        { ...result, features },
        ...previous
      ]);

      setSelected([]);
    } catch {
      setError('Prediction failed. Check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetInputs = () => {
    setValues({});
    setError('');
  };

  const toggleCompare = (index: number) => {
    setSelected(previous =>
      previous.includes(index)
        ? previous.filter(item => item !== index)
        : previous.length < 2
          ? [...previous, index]
          : [previous[1], index]
    );
  };

  const comparison = selected.length === 2
    ? selected.map(index => history[index])
    : null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          MACHINE LEARNING / EXPERIMENTATION
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Prediction Lab
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Test network traffic features and observe how the ML model classifies them.
        </p>

        <div className="mt-3">
          <Badge live={source === 'live'} />
        </div>
      </div>

      {/* INFO */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <BrainCircuit className="mt-1 text-blue-600" size={23} />
        <div>
          <p className="font-semibold text-slate-800">Interactive ML testing</p>
          <p className="mt-1 text-sm text-slate-600">
            Enter the network traffic feature values. The trained model will
            predict whether the traffic is BENIGN or an ATTACK.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">

        {/* INPUT FORM */}
        <Card title="Model Input Features">
          {names.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading model features...
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {names.map(name => (
                  <label key={name} className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      {name}
                    </span>

                    <input
                      type="number"
                      step="any"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-400"
                      placeholder="Enter value"
                      value={values[name] ?? ''}
                      onChange={event =>
                        setValues(previous => ({
                          ...previous,
                          [name]: event.target.value
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={runPrediction}
                  disabled={loading || names.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play size={16} />
                  {loading ? 'Analyzing...' : 'Run Prediction'}
                </button>

                <button
                  onClick={resetInputs}
                  className="btn inline-flex items-center gap-2"
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </>
          )}
        </Card>

        {/* HISTORY */}
        <Card title="Prediction History">
          <p className="mb-4 text-xs text-slate-500">
            Select two predictions to compare their input features and results.
          </p>

          {history.length === 0 ? (
            <div className="py-12 text-center">
              <BrainCircuit size={38} className="mx-auto text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                No experiments yet
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Run your first prediction to create history.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-auto">
              {history.map((item, index) => (
                <label
                  key={index}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition ${
                    selected.includes(index)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(index)}
                      onChange={() => toggleCompare(index)}
                    />

                    {item.label === 'ATTACK'
                      ? <ShieldAlert size={20} className="text-rose-600" />
                      : <ShieldCheck size={20} className="text-emerald-600" />
                    }

                    <div>
                      <p className={`text-sm font-bold ${
                        item.label === 'ATTACK'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}>
                        {item.label}
                      </p>

                      <p className="text-xs text-slate-400">
                        {new Date(item.at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-slate-700">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* COMPARISON */}
      {comparison && (
        <Card title="Prediction Comparison">
          <div className="mb-4 flex items-center gap-2 text-blue-600">
            <GitCompareArrows size={20} />
            <p className="text-sm font-semibold">
              Comparing two model experiments
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">Feature / Result</th>
                  <th className="p-3">Prediction A</th>
                  <th className="p-3">Prediction B</th>
                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3 font-semibold">Classification</td>
                  <td className="p-3">{comparison[0].label}</td>
                  <td className="p-3">{comparison[1].label}</td>
                </tr>

                <tr className="border-b border-slate-100">
                  <td className="p-3 font-semibold">Confidence</td>
                  <td className="p-3">
                    {(comparison[0].confidence * 100).toFixed(2)}%
                  </td>
                  <td className="p-3">
                    {(comparison[1].confidence * 100).toFixed(2)}%
                  </td>
                </tr>

                {names.map(name => {
                  const different =
                    comparison[0].features[name] !== comparison[1].features[name];

                  return (
                    <tr
                      key={name}
                      className={`border-b border-slate-100 ${
                        different ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <td className="p-3 font-medium">{name}</td>
                      <td className="p-3">{comparison[0].features[name]}</td>
                      <td className="p-3">{comparison[1].features[name]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Blue rows indicate features with different input values.
          </p>
        </Card>
      )}
    </div>
  );
}
