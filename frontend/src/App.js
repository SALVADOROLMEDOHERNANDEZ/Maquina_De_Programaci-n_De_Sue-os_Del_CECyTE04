import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import FutureSimulator from './pages/FutureSimulator';
import VirtualTour from './pages/VirtualTour';
import Especialidades from './pages/Especialidades';
import AdminPanel from './pages/AdminPanel';

import './App.css';

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
