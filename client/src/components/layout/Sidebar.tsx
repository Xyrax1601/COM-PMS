import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Activity,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Pill,
  CalendarClock,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  History,
  Database,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
      isActive
        ? 'bg-mongo-forestDark text-mongo-green border-l-4 border-mongo-green font-semibold shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-mongo-dark text-slate-200 flex flex-col h-screen fixed left-0 top-0 border-r border-mongo-border z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-mongo-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-mongo-forestDark border border-mongo-green/40 flex items-center justify-center text-mongo-green shadow-inner">
          <Database className="w-5 h-5 text-mongo-green" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-base font-mono">COM-PMS</span>
            <span className="text-[10px] bg-mongo-green/20 text-mongo-green font-semibold px-1.5 py-0.5 rounded border border-mongo-green/30">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans tracking-wide">College of Medicine</p>
        </div>
      </div>

      {/* Cluster Status Badge */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-mongo-border/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-mongo-green animate-pulse"></span>
          <span className="font-mono text-[11px]">COM-CLUSTER-01</span>
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">Atlas Mode</span>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
        {/* Main Section */}
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Core Collections
          </p>
          <div className="space-y-1">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/patients" className={navItemClass}>
              <Users className="w-4 h-4 text-slate-400" />
              <span>Patient Directory</span>
            </NavLink>
            <NavLink to="/monitoring" className={navItemClass}>
              <Activity className="w-4 h-4 text-mongo-green" />
              <div className="flex-1 flex items-center justify-between">
                <span>Patient Monitoring</span>
                <span className="bg-emerald-500/20 text-mongo-green text-[10px] font-mono px-1 rounded border border-mongo-green/30">
                  Live
                </span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Clinical Lifecycle */}
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Clinical Lifecycle
          </p>
          <div className="space-y-1">
            <NavLink to="/fpe" className={navItemClass}>
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>FPE Records</span>
            </NavLink>
            <NavLink to="/consultations" className={navItemClass}>
              <Stethoscope className="w-4 h-4 text-sky-400" />
              <span>Consultations</span>
            </NavLink>
            <NavLink to="/laboratory" className={navItemClass}>
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>Laboratory Requests</span>
            </NavLink>
            <NavLink to="/medications" className={navItemClass}>
              <Pill className="w-4 h-4 text-purple-400" />
              <span>Medication Records</span>
            </NavLink>
            <NavLink to="/follow-ups" className={navItemClass}>
              <CalendarClock className="w-4 h-4 text-teal-400" />
              <span>Follow-up Monitoring</span>
            </NavLink>
          </div>
        </div>

        {/* Intelligence & Data Tools */}
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Data Tools & Analytics
          </p>
          <div className="space-y-1">
            <NavLink to="/reports" className={navItemClass}>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Reports & Analytics</span>
            </NavLink>
            <NavLink to="/excel" className={navItemClass}>
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              <span>Excel Import / Export</span>
            </NavLink>
          </div>
        </div>

        {/* Governance */}
        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Governance
          </p>
          <div className="space-y-1">
            {hasRole('admin') && (
              <NavLink to="/users" className={navItemClass}>
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>User Management</span>
              </NavLink>
            )}
            <NavLink to="/activity-logs" className={navItemClass}>
              <History className="w-4 h-4 text-slate-400" />
              <span>Activity Audit Logs</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-mongo-border bg-slate-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-mongo-green">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
