import React from 'react';
import { PatientStatus } from '../../types';

interface BadgeProps {
  status: PatientStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Registered and Completed FPE and Consultation':
      colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium';
      break;
    case 'Registered but No FPE':
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-300 font-medium';
      break;
    case 'Completed FPE but No Consultation':
      colorStyle = 'bg-blue-50 text-blue-700 border-blue-300 font-medium';
      break;
    case 'Completed FPE but Not Registered':
      colorStyle = 'bg-purple-50 text-purple-700 border-purple-300 font-medium';
      break;
    case 'FPE and Consultation but not registered':
      colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-300 font-medium';
      break;
    case 'Pending Follow-up':
    case 'Upcoming':
    case 'Pending':
      colorStyle = 'bg-sky-50 text-sky-700 border-sky-300 font-medium';
      break;
    case 'Overdue':
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      break;
    case 'Completed':
      colorStyle = 'bg-teal-50 text-teal-700 border-teal-300 font-medium';
      break;
    case 'Archived':
    case 'Cancelled':
      colorStyle = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      break;
    default:
      colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClass} ${colorStyle} font-sans tracking-tight`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {status}
    </span>
  );
};
