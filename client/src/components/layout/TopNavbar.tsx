import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, User as UserIcon, Bell, Shield, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Patient } from '../../types';

export const TopNavbar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.data.success) {
          setSearchResults(res.data.patients);
          setDropdownOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = (id: string) => {
    setDropdownOpen(false);
    setSearchQuery('');
    navigate(`/patients/${id}`);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'medical':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'registration':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-mongo-lightBorder sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="relative w-96" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient name, PhilHealth, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setDropdownOpen(true);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-mongo-forest focus:border-transparent transition"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="w-3.5 h-3.5 border-2 border-mongo-forest border-t-transparent rounded-full animate-spin block"></span>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {dropdownOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
            <div className="p-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Matching Patient Documents
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelectPatient(p._id)}
                  className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between transition group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-mongo-forest">
                        {p.complete_name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.patient_id}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>PhilHealth: {p.philhealth_number || 'None'}</span>
                      <span>Status: {p.patient_status}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-mongo-forest transition" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Database Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB Engine Active</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <span
              className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border mt-0.5 ${getRoleBadgeColor(
                user?.role
              )}`}
            >
              {user?.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
