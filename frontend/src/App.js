import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import FutureSimulator from './pages/FutureSimulator';
import VirtualTour from './pages/VirtualTour';
import Especialidades from './pages/Especialidades';
import AdminPanel from './pages/AdminPanel';
import CecyteAI from './pages/CecyteAI';
import Publicaciones from './pages/Publicaciones';
import ProgramacionHub from './pages/ProgramacionHub';
import MantenimientoHub from './pages/MantenimientoHub';

import './App.css';

function InstitutionalRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="spinner-cyber" />
      </div>
    );
  }

  const email = user?.email?.toLowerCase?.() || '';
  const isInstitutional = email.endsWith('@cecytlax.edu.mx');

  if (!user || !isInstitutional) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Router wrapper to handle auth callback
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id synchronously during render
  // This prevents race conditions by processing OAuth callback FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/simulator" element={<FutureSimulator />} />
      <Route path="/tour" element={<VirtualTour />} />
      <Route path="/especialidades" element={<Especialidades />} />
      <Route path="/simulation/:id" element={<FutureSimulator />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/ia-cecyte" element={<CecyteAI />} />
      <Route path="/publicaciones" element={<Publicaciones />} />
      <Route
        path="/especialidades/programacion"
        element={
          <InstitutionalRoute>
            <ProgramacionHub />
          </InstitutionalRoute>
        }
      />
      <Route
        path="/especialidades/mantenimiento-industrial"
        element={
          <InstitutionalRoute>
            <MantenimientoHub />
          </InstitutionalRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
