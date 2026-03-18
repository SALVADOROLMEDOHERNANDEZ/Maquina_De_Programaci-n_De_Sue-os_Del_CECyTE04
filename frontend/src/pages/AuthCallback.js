import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL hash
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/');
          return;
        }

        // Exchange session_id for user data
        const response = await fetch(`${API_URL}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate');
        }

        const userData = await response.json();
        setUser(userData);

        // Navigate to dashboard with user data to skip auth check
        navigate('/dashboard', { state: { user: userData }, replace: true });

      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center">
      <div className="glass-card rounded-2xl p-12 text-center">
        <Loader2 className="w-12 h-12 text-[#00f0ff] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-['Syne'] font-bold text-white mb-2">
          Autenticando...
        </h2>
        <p className="text-white/50">
          Procesando tu sesion de Google
        </p>
      </div>
    </div>
  );
}
