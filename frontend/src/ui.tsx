
import type { ReactNode } from 'react';

// Backend connection status
export const Badge = ({ live }: { live: boolean }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        live
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          live ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      {live ? 'Live backend' : 'Demo data'}
    </span>
  );
};

// Reusable dashboard card
export const Card = ({
  title,
  children
}: {
  title?: string;
  children: ReactNode;
}) => {
  return (
    <div className="card">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          {title}
        </h3>
      )}

      {children}
    </div>
  );
};
