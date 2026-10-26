import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-2">
      <div>
        <h1 className="text-2xl font-display font-semibold text-cream-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-cream-700 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-16 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center text-cream-500 mb-4">
        {icon}
      </div>
      <p className="font-display text-lg text-cream-800">{title}</p>
      {hint && <p className="text-sm text-cream-600 mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 text-cream-700">
      <span className="w-5 h-5 rounded-full border-2 border-cream-300 border-t-terracotta-500 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Banner({ tone, children }: { tone: 'info' | 'warn' | 'error'; children: ReactNode }) {
  const tones = {
    info: 'bg-olive-50 text-olive-800 border-olive-200',
    warn: 'bg-terracotta-50 text-terracotta-800 border-terracotta-100',
    error: 'bg-terracotta-100 text-terracotta-900 border-terracotta-200',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
