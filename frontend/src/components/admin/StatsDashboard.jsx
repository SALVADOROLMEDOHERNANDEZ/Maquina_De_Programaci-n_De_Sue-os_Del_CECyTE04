import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileStack, Eye } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000/api';

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/admin/statistics`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token') || ''}`,
          }
        });

        if (!response.ok) throw new Error('Failed to load statistics');

        const data = await response.json();
        setStats({
          usuario_total: data.users_total || 0,
          contenido_multimedia: data.multimedia_content || 0,
          vistas_totales: data.total_views || 0,
          simulaciones: data.simulations_total || 0,
          sesiones_activas: data.active_sessions || 0,
          modelos_3d: data.active_3d_models || 0,
          multimedia_by_type: data.multimedia_by_type || {},
          top_users: data.top_users || []
        });
        setError(null);
      } catch (err) {
        console.error('Load stats error:', err);
        setError(err.message);
        // Fallback a datos vacíos
        setStats({
          usuario_total: 0,
          contenido_multimedia: 0,
          vistas_totales: 0,
          simulaciones: 0,
          sesiones_activas: 0,
          modelos_3d: 0,
          multimedia_by_type: {},
          top_users: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    // Recargar estadísticas cada 30 segundos
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Usuarios Totales', value: stats?.usuario_total || 0, color: '#00f0ff' },
    { icon: FileStack, label: 'Contenido Multimedia', value: stats?.contenido_multimedia || 0, color: '#7c3aed' },
    { icon: Eye, label: 'Vistas Totales', value: stats?.vistas_totales || 0, color: '#10b981' },
    { icon: BarChart3, label: 'Simulaciones', value: stats?.simulaciones || 0, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          ⚠️ Error al cargar estadísticas: {error}
        </div>
      )}
      
      <div className="grid md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-white/70 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-['Syne'] font-bold">{stat.value.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Additional stats grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-['Syne'] font-bold mb-4">Sesiones Activas</h3>
          <p className="text-3xl font-bold text-[#00f0ff]">{stats?.sesiones_activas || 0}</p>
          <p className="text-white/50 text-sm mt-2">Usuarios conectados ahora</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-['Syne'] font-bold mb-4">Modelos 3D Activos</h3>
          <p className="text-3xl font-bold text-[#7c3aed]">{stats?.modelos_3d || 0}</p>
          <p className="text-white/50 text-sm mt-2">Modelos disponibles en tour</p>
        </motion.div>
      </div>
    </div>
  );
}
