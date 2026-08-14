import React from 'react';

export default function StatsCard({ label, value, subtext, icon: Icon, glowType = 'indigo' }) {
  const glowClasses = {
    indigo: 'glow-indigo border-brand-accent/20 hover:border-brand-accent/40',
    emerald: 'glow-emerald border-brand-emerald/20 hover:border-brand-emerald/40',
    amber: 'glow-amber border-brand-amber/20 hover:border-brand-amber/40',
    rose: 'border-brand-rose/20 hover:border-brand-rose/40',
  };

  const iconColors = {
    indigo: 'text-brand-accent bg-brand-accent/10',
    emerald: 'text-brand-emerald bg-brand-emerald/10',
    amber: 'text-brand-amber bg-brand-amber/10',
    rose: 'text-brand-rose bg-brand-rose/10',
  };

  return (
    <div className={`glass-panel glass-panel-hover p-6 rounded-2xl border ${glowClasses[glowType] || glowClasses.indigo} flex items-center justify-between`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-brand-dim uppercase tracking-wider block">{label}</span>
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {subtext && <p className="text-[11px] text-brand-dim font-medium">{subtext}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColors[glowType] || iconColors.indigo}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
