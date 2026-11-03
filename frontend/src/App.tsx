
import { useState } from 'react';

import {
  Activity,
  Bell,
  ChevronRight,
  LayoutDashboard,
  ShieldAlert,
  Network,
  FlaskConical,
  BrainCircuit,
  Zap,
  Microscope,
  FileText,
  Settings,
  ShieldCheck,
  Search,
  Menu,
  X
} from 'lucide-react';

import {
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom';

import Traffic from './pages/Traffic';
import Experiments from './pages/Experiments';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Model from './pages/Model';
import Overview from './pages/Overview';
import Lab from './pages/Lab';
import Chaos from './pages/Chaos';
import Threats from './pages/Threats';
import Landing from './pages/Landing';
import Auth from './pages/Auth';

const NAV = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'MAIN MENU' },
  { path: 'threats', label: 'Threat Detection', icon: ShieldAlert },
  { path: 'traffic', label: 'Live Traffic', icon: Network },
  { path: 'lab', label: 'Prediction Lab', icon: FlaskConical },
  { path: 'model', label: 'Model Monitoring', icon: BrainCircuit, section: 'MONITORING' },
  { path: 'chaos', label: 'Failure Simulation', icon: Zap },
  { path: 'experiments', label: 'Experiments', icon: Microscope },
  { path: 'reports', label: 'Reports', icon: FileText, section: 'MANAGEMENT' },
  { path: 'settings', label: 'Settings', icon: Settings }
];

const DONE = [
  'overview',
  'threats',
  'lab',
  'chaos',
  'traffic',
  'model',
  'experiments',
  'reports',
  'settings'
];

const Soon = ({ n }: { n: string }) => (
  <div className="card">
    <h2 className="text-xl font-bold text-slate-800">{n}</h2>
    <p className="mt-2 text-sm text-slate-500">
      This feature is coming soon.
    </p>
  </div>
);

const Shell = () => {
  const go = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const navigateToPage = (path: string) => {
    go('/' + path);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6">

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        {/* BRAND */}
        <NavLink to="/overview" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              ChaosGuard <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Security Intelligence
            </p>
          </div>
        </NavLink>

        {/* SEARCH */}
        <div className="relative ml-auto hidden w-full max-w-xs md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            aria-label="Search dashboard pages"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const found = NAV.find(item =>
                  item.label.toLowerCase().includes(search.toLowerCase())
                );

                if (found) {
                  navigateToPage(found.path);
                  setSearch('');
                }
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        {/* SYSTEM STATUS */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">
            Monitoring Console
          </span>
        </div>

        {/* NOTIFICATIONS */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <h3 className="font-semibold text-slate-800">
                Notifications
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Your notification panel is ready. System alerts will appear here.
              </p>
              <button
                onClick={() => setNotificationOpen(false)}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* USER */}
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Analyst
            </p>
            <p className="text-xs text-slate-400">
              Security Team
            </p>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-64px)]">

        {/* MOBILE OVERLAY */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside
          className={`fixed bottom-0 left-0 top-16 z-20 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 md:sticky md:top-16 md:block md:h-[calc(100vh-64px)] md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >

          <div className="mb-5 rounded-xl bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Security Workspace
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-600">
              Network monitoring and analysis
            </p>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.path}>
                  {item.section && (
                    <p className="mb-2 mt-5 px-3 text-[10px] font-bold tracking-widest text-slate-400">
                      {item.section}
                    </p>
                  )}

                  <NavLink
                    to={'/' + item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight
                      size={15}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </NavLink>
                </div>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">
                ChaosGuard AI
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Network Intrusion Detection
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/forgot" element={<Auth mode="forgot" />} />

      <Route element={<Shell />}>
        <Route path="/overview" element={<Overview />} />
        <Route path="/threats" element={<Threats />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/chaos" element={<Chaos />} />
        <Route path="/traffic" element={<Traffic />} />
        <Route path="/model" element={<Model />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />

        {NAV.filter(item => !DONE.includes(item.path)).map(item => (
          <Route
            key={item.path}
            path={'/' + item.path}
            element={<Soon n={item.label} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
