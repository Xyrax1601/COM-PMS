import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  onClick,
}) => {
  const colorMap = {
    green: {
      bg: 'bg-emerald-500/10',
      border: 'hover:border-mongo-green',
      icon: 'text-mongo-green',
      bar: 'bg-mongo-green',
    },
    blue: {
      bg: 'bg-sky-500/10',
      border: 'hover:border-sky-500',
      icon: 'text-sky-500',
      bar: 'bg-sky-500',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'hover:border-amber-500',
      icon: 'text-amber-500',
      bar: 'bg-amber-500',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'hover:border-purple-500',
      icon: 'text-purple-500',
      bar: 'bg-purple-500',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'hover:border-rose-500',
      icon: 'text-rose-500',
      bar: 'bg-rose-500',
    },
    slate: {
      bg: 'bg-slate-500/10',
      border: 'hover:border-slate-400',
      icon: 'text-slate-500',
      bar: 'bg-slate-400',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-mongo-lightBorder p-5 shadow-sm transition-all duration-200 relative overflow-hidden group ${
        onClick ? 'cursor-pointer hover:shadow-md ' + scheme.border : ''
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${scheme.bar}`}></div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">{value}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-1 font-sans">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${scheme.bg} ${scheme.icon} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
