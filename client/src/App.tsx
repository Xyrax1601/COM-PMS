import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { PatientMonitoring } from './pages/PatientMonitoring';
import { FpeManagement } from './pages/FpeManagement';
import { Consultations } from './pages/Consultations';
import { Laboratory } from './pages/Laboratory';
import { Medications } from './pages/Medications';
import { FollowUps } from './pages/FollowUps';
import { Reports } from './pages/Reports';
import { ExcelManager } from './pages/ExcelManager';
import { UserManagement } from './pages/UserManagement';
import { ActivityLogs } from './pages/ActivityLogs';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, token, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-mongo-dark flex items-center justify-center text-mongo-green">
        <span className="w-8 h-8 border-2 border-mongo-green border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...(roles as any))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="monitoring" element={<PatientMonitoring />} />
            <Route path="fpe" element={<FpeManagement />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="laboratory" element={<Laboratory />} />
            <Route path="medications" element={<Medications />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="reports" element={<Reports />} />
            <Route path="excel" element={<ExcelManager />} />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="activity-logs" element={<ActivityLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
