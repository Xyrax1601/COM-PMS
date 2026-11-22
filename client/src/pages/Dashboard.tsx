import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  HeartPulse,
  Stethoscope,
  AlertCircle,
  CalendarClock,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Layers,
  ClipboardCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../api/client';
import { DashboardStats, Patient, ActivityLog } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2026');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/stats?year=${selectedYear}`);
      if (res.data.success) {
        setStats(res.data.stats);
        setCharts(res.data.charts);
        setRecentPatients(res.data.recentPatients);
        setRecentActivities(res.data.recentActivities);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear]);

  const PIE_COLORS = ['#00ED64', '#F59E0B', '#38BDF8', '#A855F7', '#EF4444', '#64748B'];

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-sans">Administrative Overview</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200">
              Active Cluster
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time patient demographics, First Patient Encounter (FPE), consultations, and lifecycle tracking.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filter Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none"
            >
              <option value="2026">2026 (Current Academic Year)</option>
              <option value="2025">2025 (Historical Baseline)</option>
              <option value="All">All Historical Years</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/monitoring')}
            className="px-3.5 py-1.5 bg-mongo-forest hover:bg-mongo-forestDark text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Patient Monitoring</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patients"
          value={loading ? '...' : stats?.totalPatients ?? 0}
          subtitle="Unique patient database records"
          icon={Users}
          color="green"
          onClick={() => navigate('/patients')}
        />

        <StatCard
          title="Completed FPE"
          value={loading ? '...' : stats?.totalFpeCompleted ?? 0}
          subtitle="First Patient Encounters completed"
          icon={HeartPulse}
          color="blue"
          onClick={() => navigate('/fpe')}
        />

        <StatCard
          title="Completed Consultations"
          value={loading ? '...' : stats?.totalConsultationsCompleted ?? 0}
          subtitle="Physician consultations evaluated"
          icon={Stethoscope}
          color="purple"
          onClick={() => navigate('/consultations')}
        />

        <StatCard
          title="Upcoming Follow-ups"
          value={loading ? '...' : stats?.upcomingFollowUps ?? 0}
          subtitle={`${stats?.overdueFollowUps ?? 0} appointments overdue`}
          icon={CalendarClock}
          color="amber"
          onClick={() => navigate('/follow-ups')}
        />
      </div>

      {/* Patient Lifecycle Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/monitoring')}
          className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Registered But No FPE
            </span>
            <h4 className="text-2xl font-bold font-mono text-amber-900 mt-1">
              {loading ? '...' : stats?.registeredNoFpe ?? 0}
            </h4>
            <p className="text-[11px] text-amber-600 mt-0.5">Needs first health assessment</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/monitoring')}
          className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              FPE But No Consultation
            </span>
            <h4 className="text-2xl font-bold font-mono text-blue-900 mt-1">
              {loading ? '...' : stats?.fpeNoConsultation ?? 0}
            </h4>
            <p className="text-[11px] text-blue-600 mt-0.5">Pending clinical evaluation</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/monitoring')}
          className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              FPE But Not Registered
            </span>
            <h4 className="text-2xl font-bold font-mono text-purple-900 mt-1">
              {loading ? '...' : stats?.fpeNotRegistered ?? 0}
            </h4>
            <p className="text-[11px] text-purple-600 mt-0.5">Needs PhilHealth documentation</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate('/monitoring')}
          className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              FPE & Consult Not Reg
            </span>
            <h4 className="text-2xl font-bold font-mono text-indigo-900 mt-1">
              {loading ? '...' : stats?.fpeConsultNotRegistered ?? 0}
            </h4>
            <p className="text-[11px] text-indigo-600 mt-0.5">Both done, needs PhilHealth</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                Monthly Registration & Clinical Volume
              </h3>
              <p className="text-xs text-slate-500">Intake volume for Academic Year {selectedYear}</p>
            </div>
            <TrendingUp className="w-4 h-4 text-mongo-forest" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.trendData || []}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ED64" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00ED64" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFpe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#00684A"
                  fillOpacity={1}
                  fill="url(#colorReg)"
                />
                <Area
                  type="monotone"
                  dataKey="fpe"
                  name="FPEs"
                  stroke="#0284C7"
                  fillOpacity={1}
                  fill="url(#colorFpe)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FPE vs Consultation Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">
                FPE vs Consultation Progression
              </h3>
              <p className="text-xs text-slate-500">Comparison of encounters vs doctor consultations</p>
            </div>
            <Stethoscope className="w-4 h-4 text-sky-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="fpe" name="FPE Completed" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="consultations"
                  name="Consultations Completed"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Distribution & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-sans">Patient Status Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.statusDistribution || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts?.statusDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {(charts?.statusDistribution || []).map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  ></span>
                  <span className="text-slate-600 truncate">{entry.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patient Registrations */}
        <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-sans">Recent Patient Registrations</h3>
              <p className="text-xs text-slate-500">Newly registered documents in the COM-PMS collection</p>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="text-xs font-semibold text-mongo-forest hover:text-mongo-forestDark flex items-center gap-1 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Complete Name</th>
                  <th className="py-2.5 px-3">PhilHealth No.</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPatients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-mono text-mongo-forest font-semibold">{p.patient_id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{p.complete_name}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">
                      {p.philhealth_number || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-2 px-3">
                      <Badge status={p.patient_status} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => navigate(`/patients/${p._id}`)}
                        className="text-mongo-forest hover:underline font-semibold"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Log Audit Trail */}
      <div className="bg-white p-5 rounded-xl border border-mongo-lightBorder shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans">System Activity Audit Trail</h3>
            <p className="text-xs text-slate-500">Live operational log of database transactions</p>
          </div>
          <button
            onClick={() => navigate('/activity-logs')}
            className="text-xs font-semibold text-mongo-forest hover:text-mongo-forestDark flex items-center gap-1 transition"
          >
            <span>Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentActivities.map((log) => (
            <div key={log._id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <div>
                  <span className="font-semibold text-slate-800">{log.user_name}</span>{' '}
                  <span className="text-slate-600">performed</span>{' '}
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                    {log.action}
                  </span>{' '}
                  <span className="text-slate-500">on {log.entity_type}</span>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
