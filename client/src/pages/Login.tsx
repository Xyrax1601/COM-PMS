import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@compms.edu');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    {
      role: 'Administrator',
      email: 'admin@compms.edu',
      pass: 'Admin@123',
      color: 'border-purple-500/40 text-purple-300 hover:bg-purple-950/40',
      badge: 'bg-purple-500/20 text-purple-300',
    },
    {
      role: 'Medical Staff',
      email: 'medical@compms.edu',
      pass: 'Medical@123',
      color: 'border-blue-500/40 text-blue-300 hover:bg-blue-950/40',
      badge: 'bg-blue-500/20 text-blue-300',
    },
    {
      role: 'Registration Staff',
      email: 'registration@compms.edu',
      pass: 'Reg@123',
      color: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40',
      badge: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      role: 'Viewer / Auditor',
      email: 'viewer@compms.edu',
      pass: 'Viewer@123',
      color: 'border-slate-500/40 text-slate-300 hover:bg-slate-800/40',
      badge: 'bg-slate-500/20 text-slate-300',
    },
  ];

  const handleQuickSwitch = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mongo-dark text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mongo-forestDark/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mongo-green/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mongo-card border border-mongo-green/40 text-mongo-green shadow-xl shadow-mongo-green/10 mb-2">
            <Database className="w-8 h-8 text-mongo-green" />
          </div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white">
            COM-PMS <span className="text-mongo-green font-sans font-light">| College of Medicine</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
            Centralized Patient Information Management & Healthcare Monitoring Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-mongo-card/90 backdrop-blur-md border border-mongo-border rounded-2xl p-7 shadow-2xl shadow-black/40 space-y-5">
          <div className="flex items-center justify-between border-b border-mongo-border/80 pb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Staff Authentication
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-mongo-green font-mono">
              <span className="w-2 h-2 rounded-full bg-mongo-green animate-pulse"></span>
              Secure Session
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-mongo-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mongo-green focus:border-transparent transition"
                  placeholder="name@compms.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-mongo-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-mongo-green focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-mongo-green hover:bg-mongo-greenHover text-mongo-dark font-semibold text-sm rounded-lg shadow-lg shadow-mongo-green/20 transition flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-mongo-dark border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Switcher for Evaluation */}
          <div className="pt-4 border-t border-mongo-border space-y-2">
            <p className="text-[11px] text-slate-400 font-medium">Quick Role Demo Switcher:</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickSwitch(acc.email, acc.pass)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition flex flex-col ${acc.color}`}
                >
                  <span className="font-semibold">{acc.role}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-sans">
          Protected under Republic Act 10173 (Philippine Data Privacy Act).
        </p>
      </div>
    </div>
  );
};
