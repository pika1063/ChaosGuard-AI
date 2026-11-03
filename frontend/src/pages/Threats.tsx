
import { useState } from 'react';
import {
  Upload,
  ShieldAlert,
  ShieldCheck,
  Search,
  Play,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

import { predict, Prediction } from '../api';
import { Badge, Card } from '../ui';

type Row = Record<string, string>;

const parseCSV = (text: string): Row[] => {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(v => v.trim());

  return lines.slice(1, 501).map(line => {
    const values = line.split(',').map(v => v.trim());

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ''])
    );
  });
};

export default function Threats() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<(Prediction & { row: number })[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCSV = (file?: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result));

        if (!parsed.length || !Object.keys(parsed[0]).length) {
          setError('The CSV file is empty or invalid.');
          return;
        }

        setRows(parsed);
        setSelected(null);
        setResult(null);
        setHistory([]);
        setError('');
      } catch {
        setError('Unable to read the CSV file.');
      }
    };

    reader.readAsText(file);
  };

  const runPrediction = async (index: number) => {
    setSelected(index);
    setResult(null);
    setError('');
    setLoading(true);

    const features: Record<string, number> = {};

    Object.entries(rows[index]).forEach(([key, value]) => {
      const number = Number(value);

      if (value !== '' && Number.isFinite(number)) {
        features[key] = number;
      }
    });

    if (Object.keys(features).length === 0) {
      setError('This record has no numeric features to predict.');
      setLoading(false);
      return;
    }

    try {
      const prediction = await predict(features);

      setResult(prediction);

      setHistory(previous => [
        { ...prediction, row: index },
        ...previous
      ]);
    } catch {
      setError('Prediction failed. Check whether the backend and model are running.');
    } finally {
      setLoading(false);
    }
  };

  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 4) : [];

  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase())
    );

  const visibleHistory = history.filter(item =>
    filter === 'ALL' || item.label === filter
  );

  const attackCount = history.filter(item => item.label === 'ATTACK').length;
  const benignCount = history.filter(item => item.label === 'BENIGN').length;

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-700 outline-none focus:border-blue-400';

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          SECURITY INTELLIGENCE / ANALYSIS
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Threat Detection
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Upload network traffic records and identify suspicious activity using ML.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <FileSpreadsheet size={23} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Loaded records</p>
            <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
            <ShieldAlert size={23} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Attacks detected</p>
            <p className="text-2xl font-bold text-slate-900">{attackCount}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={23} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Benign records</p>
            <p className="text-2xl font-bold text-slate-900">{benignCount}</p>
          </div>
        </div>
      </div>

      {/* UPLOAD */}
      <Card title="Upload Network Traffic Dataset">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50">
          <Upload size={32} className="text-blue-600" />

          <p className="mt-3 font-semibold text-slate-800">
            Click to upload your CSV file
          </p>

          <p className="mt-1 text-xs text-slate-500">
            CSV format supported · Maximum 500 records loaded
          </p>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={event => loadCSV(event.target.files?.[0])}
          />
        </label>

        <p className="mt-3 text-xs text-slate-500">
          Numeric columns are sent to the machine learning model as input features.
        </p>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="grid gap-5 xl:grid-cols-2">

        {/* RECORDS */}
        <Card title={`Network Traffic Records (${rows.length})`}>
          <div className="relative mb-4">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className={`${inputClass} pl-10`}
              placeholder="Search traffic records..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Record</th>
                  {columns.map(column => (
                    <th key={column} className="p-3">{column}</th>
                  ))}
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.slice(0, 100).map(({ row, index }) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-100 ${
                      selected === index ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-3 font-medium text-slate-600">
                      #{index + 1}
                    </td>

                    {columns.map(column => (
                      <td key={column} className="max-w-32 truncate p-3 text-slate-500">
                        {row[column]}
                      </td>
                    ))}

                    <td className="p-3">
                      <button
                        onClick={() => runPrediction(index)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Play size={12} />
                        Run
                      </button>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                      Upload a CSV dataset to view traffic records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PREDICTION RESULT */}
        <div className="space-y-5">
          <Card title="ML Prediction Result">
            {loading ? (
              <div className="py-12 text-center text-blue-600">
                Analyzing network traffic...
              </div>
            ) : result ? (
              <div className="space-y-5">

                <div className={`rounded-2xl p-5 ${
                  result.label === 'ATTACK'
                    ? 'border border-rose-200 bg-rose-50'
                    : 'border border-emerald-200 bg-emerald-50'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.label === 'ATTACK'
                      ? <ShieldAlert size={30} className="text-rose-600" />
                      : <ShieldCheck size={30} className="text-emerald-600" />
                    }

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Prediction
                      </p>
                      <h3 className={`text-2xl font-bold ${
                        result.label === 'ATTACK' ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {result.label}
                      </h3>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Confidence</span>
                    <strong className="text-slate-900">
                      {(result.confidence * 100).toFixed(2)}%
                    </strong>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        result.label === 'ATTACK' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, result.confidence * 100))}%`
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Record</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      #{(selected ?? 0) + 1}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Model source</p>
                    <div className="mt-1">
                      <Badge live={result.source === 'live'} />
                    </div>
                  </div>

                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <p className="text-slate-500">Prediction time</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {new Date(result.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <ShieldCheck size={38} className="mx-auto text-slate-300" />
                <p className="mt-3 font-medium text-slate-600">
                  No prediction selected
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Upload a dataset and press Run on any record.
                </p>
              </div>
            )}
          </Card>

          {/* HISTORY */}
          <Card title="Detection History">
            <div className="mb-4 flex gap-2">
              {['ALL', 'ATTACK', 'BENIGN'].map(option => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    filter === option
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {visibleHistory.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-400">
                No predictions yet.
              </p>
            ) : (
              <div className="max-h-52 space-y-2 overflow-auto">
                {visibleHistory.slice(0, 10).map((item, index) => (
                  <div
                    key={`${item.row}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      Record #{item.row + 1}
                    </span>

                    <span className={`text-xs font-bold ${
                      item.label === 'ATTACK' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {item.label}
                    </span>

                    <span className="text-xs text-slate-500">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
