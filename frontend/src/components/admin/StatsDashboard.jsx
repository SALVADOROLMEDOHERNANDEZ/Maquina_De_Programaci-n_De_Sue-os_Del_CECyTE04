import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, FileStack, Eye, TrendingUp, Clock, Award, Activity } from 'lucide-react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const COLORS = ['#00f0ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StatsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadStats = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await fetch(`${API_URL}/api/admin/statistics`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Load stats error:', err);
      setError(err.message);
      // Fallback a datos vacíos
      setStats({
        users_total: 0,
        multimedia_content: 0,
        total_views: 0,
        simulations_total: 0,
        active_sessions: 0,
        active_3d_models: 0,
        multimedia_by_type: {},
        pending_contributions: 0,
        top_users: [],
        users_by_month: [],
        simulations_by_career: [],
        activity_24h: { new_users_24h: 0, new_simulations_24h: 0, new_multimedia_24h: 0 }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    let interval;
    if (autoRefresh) {
      // Actualizar cada 30 segundos para datos en tiempo real óptimos
      interval = setInterval(() => loadStats(true), 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    loadStats(true);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: 'Usuarios Totales', value: stats?.users_total || 0, color: '#00f0ff' },
    { icon: FileStack, label: 'Contenido Multimedia', value: stats?.multimedia_content || 0, color: '#7c3aed' },
    { icon: Eye, label: 'Vistas Totales', value: stats?.total_views || 0, color: '#10b981' },
    { icon: BarChart3, label: 'Simulaciones', value: stats?.simulations_total || 0, color: '#f59e0b' },
  ];

  const additionalStats = [
    { icon: Activity, label: 'Sesiones Activas', value: stats?.active_sessions || 0, color: '#00f0ff' },
    { icon: Award, label: 'Modelos 3D Activos', value: stats?.active_3d_models || 0, color: '#7c3aed' },
    { icon: Clock, label: 'Contribuciones Pendientes', value: stats?.pending_contributions || 0, color: '#f59e0b' },
    { icon: TrendingUp, label: 'Nuevos Usuarios (24h)', value: stats?.activity_24h?.new_users_24h || 0, color: '#10b981' },
  ];

  // Preparar datos para gráficos
  const usersChartData = (stats?.users_by_month || []).map(item => ({
    month: item.month,
    usuarios: item.count
  }));

  const multimediaPieData = Object.entries(stats?.multimedia_by_type || {}).map(([type, count], index) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: COLORS[index % COLORS.length]
  }));

  const simulationsBarData = (stats?.simulations_by_career || []).slice(0, 10).map(item => ({
    carrera: item.career.length > 15 ? item.career.substring(0, 15) + '...' : item.career,
    simulaciones: item.count
  }));

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">Error al cargar estadísticas</span>
          </div>
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-400/70 text-xs mt-2">
            Verifica que el backend esté ejecutándose en {process.env.REACT_APP_BACKEND_URL || 'https://tu-backend-seguro'}
          </p>
        </div>
      )}

      {/* Header con refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Syne'] font-bold">Dashboard de Estadísticas</h2>
          {lastUpdate && (
            <p className="text-white/50 text-sm mt-1">
              Última actualización: {lastUpdate.toLocaleTimeString()}
              {autoRefresh && <span className="text-[#00f0ff] ml-2">• Auto-refresh activado</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleAutoRefresh}
            variant="outline"
            size="sm"
            className={`rounded-xl border-white/20 ${autoRefresh ? 'bg-[#00f0ff]/20 border-[#00f0ff]' : ''}`}
          >
            {autoRefresh ? '⏸️' : '▶️'} Auto-refresh
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary rounded-xl"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Actualizar
          </Button>
        </div>
      </div>
      
      {/* Estadísticas principales */}
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

      {/* Estadísticas adicionales */}
      <div className="grid md:grid-cols-4 gap-4">
        {additionalStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (idx + 4) * 0.05 }}
              className="glass-card rounded-2xl p-6 border border-white/10"
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
              <p className="text-2xl font-['Syne'] font-bold">{stat.value.toLocaleString()}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usuarios por mes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-['Syne'] font-bold mb-4">Registro de Usuarios (Últimos 12 meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="month" 
                  stroke="#ffffff70"
                  fontSize={12}
                  tickFormatter={(value) => value.split('-')[1] + '/' + value.split('-')[0].slice(2)}
                />
                <YAxis stroke="#ffffff70" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usuarios" 
                  stroke="#00f0ff" 
                  strokeWidth={2}
                  dot={{ fill: '#00f0ff', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Multimedia por tipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-['Syne'] font-bold mb-4">Contenido Multimedia por Tipo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={multimediaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {multimediaPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #ffffff20',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {multimediaPieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-white/70">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Simulaciones por carrera */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6 border border-white/10"
      >
        <h3 className="text-lg font-['Syne'] font-bold mb-4">Simulaciones por Carrera</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulationsBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="carrera" 
                stroke="#ffffff70"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#ffffff70" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #ffffff20',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="simulaciones" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top usuarios */}
      {stats?.top_users && stats.top_users.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-['Syne'] font-bold mb-4">Top Usuarios por Puntos</h3>
          <div className="space-y-3">
            {stats.top_users.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00f0ff]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#00f0ff]">#{index + 1}</span>
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
                <span className="text-[#00f0ff] font-bold">{user.puntos} pts</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actividad reciente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6 border border-white/10"
      >
        <h3 className="text-lg font-['Syne'] font-bold mb-4">Actividad Reciente (Últimas 24 horas)</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#00f0ff]">{stats?.activity_24h?.new_users_24h || 0}</p>
            <p className="text-white/70 text-sm">Nuevos usuarios</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#7c3aed]">{stats?.activity_24h?.new_simulations_24h || 0}</p>
            <p className="text-white/70 text-sm">Nuevas simulaciones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#10b981]">{stats?.activity_24h?.new_multimedia_24h || 0}</p>
            <p className="text-white/70 text-sm">Nuevo contenido</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
