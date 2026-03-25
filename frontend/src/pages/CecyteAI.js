import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Brain, 
  Code, 
  Users, 
  BookOpen, 
  GitBranch, 
  Rocket, 
  Star,
  FileCode,
  Database,
  Cpu,
  MessageSquare,
  ChevronRight,
  Trophy,
  Award,
  Target,
  Sparkles,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping
const iconMap = {
  Compass: Target,
  Brain: Brain,
  GitBranch: GitBranch,
  Code: Code,
  FileText: FileCode,
  Bug: Target,
  Lightbulb: Sparkles,
  Award: Award,
  Trophy: Trophy,
  Sparkles: Sparkles,
  Star: Star
};

export default function CecyteAI() {
  const [info, setInfo] = useState(null);
  const [docs, setDocs] = useState(null);
  const [contributing, setContributing] = useState(null);
  const [developers, setDevelopers] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [badges, setBadges] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [loading, setLoading] = useState(true);
  
  // Contribution form
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribForm, setContribForm] = useState({ tipo: 'codigo', titulo: '', descripcion: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, docsRes, contribRes, devsRes, rankingRes, badgesRes] = await Promise.all([
          fetch(`${API_URL}/api/ia-cecyte/info`),
          fetch(`${API_URL}/api/ia-cecyte/docs`),
          fetch(`${API_URL}/api/ia-cecyte/contributing`),
          fetch(`${API_URL}/api/ia-cecyte/developers`),
          fetch(`${API_URL}/api/gamification/ranking`),
          fetch(`${API_URL}/api/gamification/badges`)
        ]);

        setInfo(await infoRes.json());
        setDocs(await docsRes.json());
        setContributing(await contribRes.json());
        setDevelopers(await devsRes.json());
        setRanking(await rankingRes.json());
        setBadges(await badgesRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitContribution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/gamification/contribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contribForm)
      });
      
      if (response.status === 401) {
        setSubmitResult({ error: true, message: 'Debes iniciar sesión para enviar contribuciones' });
      } else if (response.ok) {
        setSubmitResult({ error: false, message: '¡Contribución enviada! Será revisada pronto.' });
        setContribForm({ tipo: 'codigo', titulo: '', descripcion: '', url: '' });
        setShowContribForm(false);
      } else {
        setSubmitResult({ error: true, message: 'Error al enviar contribución' });
      }
    } catch (error) {
      setSubmitResult({ error: true, message: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Brain },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'badges', label: 'Insignias', icon: Award },
    { id: 'docs', label: 'Documentación', icon: BookOpen },
    { id: 'contribuir', label: 'Contribuir', icon: GitBranch },
    { id: 'desarrolladores', label: 'Desarrolladores', icon: Users }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-16 h-16 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">IA CECYTE</h1>
                <p className="text-xs text-purple-400">Proyecto Colaborativo</p>
              </div>
            </div>

            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-6">
              <Rocket className="w-4 h-4" />
              <span className="text-sm font-medium">{info?.estado || 'En desarrollo'}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Construyamos la{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                IA del Futuro
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              {info?.descripcion}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setActiveTab('contribuir')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3"
              >
                <GitBranch className="w-5 h-5 mr-2" />
                Contribuir
              </Button>
              <Button 
                onClick={() => setActiveTab('ranking')}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-6 py-3"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Ver Ranking
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="border-y border-purple-500/20 bg-slate-900/50 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Inicio Tab */}
        {activeTab === 'inicio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Objetivos */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-purple-400" />
                Objetivos del Proyecto
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {info?.objetivos?.map((objetivo, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-slate-300">{objetivo}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Quick Stats */}
            {ranking && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Estadísticas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-center">
                    <div className="text-3xl font-bold text-purple-400">{ranking.total || 0}</div>
                    <div className="text-sm text-slate-400">Colaboradores</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 text-center">
                    <div className="text-3xl font-bold text-pink-400">{badges?.length || 0}</div>
                    <div className="text-sm text-slate-400">Insignias</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center">
                    <div className="text-3xl font-bold text-cyan-400">{info?.tecnologias?.length || 0}</div>
                    <div className="text-sm text-slate-400">Tecnologías</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center">
                    <div className="text-3xl font-bold text-amber-400">∞</div>
                    <div className="text-sm text-slate-400">Potencial</div>
                  </div>
                </div>
              </section>
            )}

            {/* Tecnologías */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-cyan-400" />
                Tecnologías
              </h2>
              <div className="flex flex-wrap gap-3">
                {info?.tecnologias?.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && ranking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              Ranking de Colaboradores
            </h2>
            
            {ranking.ranking?.length > 0 ? (
              <div className="space-y-3">
                {ranking.ranking.map((user, idx) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      idx === 0 ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 border-amber-500/30' :
                      idx === 1 ? 'bg-gradient-to-r from-slate-400/20 to-slate-400/5 border-slate-400/30' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-600/5 border-orange-600/30' :
                      'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    {/* Position */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      idx === 0 ? 'bg-amber-500 text-slate-900' :
                      idx === 1 ? 'bg-slate-400 text-slate-900' :
                      idx === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {user.posicion}
                    </div>
                    
                    {/* Avatar */}
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || '?'}
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="font-semibold text-white">{user.name}</div>
                      <div className="text-sm text-slate-400">
                        Nivel {user.nivel} • {user.contribuciones} contribuciones • {user.total_badges} insignias
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-400">{user.puntos}</div>
                      <div className="text-xs text-slate-500">puntos</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">¡Sé el primero!</h3>
                <p className="text-slate-400 mb-6">Aún no hay colaboradores en el ranking. ¡Empieza a contribuir!</p>
                <Button onClick={() => setActiveTab('contribuir')} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Hacer mi primera contribución
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && badges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-purple-400" />
              Insignias Disponibles
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {badges.map((badge, idx) => {
                const IconComponent = iconMap[badge.icono] || Award;
                return (
                  <motion.div
                    key={badge.badge_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-4"
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${badge.color}20`, borderColor: `${badge.color}40`, borderWidth: 1 }}
                    >
                      <IconComponent className="w-7 h-7" style={{ color: badge.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{badge.nombre}</h3>
                      <p className="text-sm text-slate-400 mb-2">{badge.descripcion}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400">
                          +{badge.puntos} pts
                        </span>
                        <span className="text-slate-500">{badge.requisito}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Documentación Tab */}
        {activeTab === 'docs' && docs && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-white">{docs.titulo}</h2>
            
            {docs.secciones?.map((seccion, idx) => (
              <section key={idx} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-purple-400" />
                  {seccion.titulo}
                </h3>
                <p className="text-slate-300 whitespace-pre-line">{seccion.contenido}</p>
              </section>
            ))}
          </motion.div>
        )}

        {/* Contribuir Tab */}
        {activeTab === 'contribuir' && contributing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-white">{contributing.titulo}</h2>
            
            {/* Submit Contribution Button */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">¿Tienes algo que aportar?</h3>
                  <p className="text-slate-400">Envía tu contribución y gana puntos e insignias</p>
                </div>
                <Button 
                  onClick={() => setShowContribForm(!showContribForm)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Contribución
                </Button>
              </div>
              
              {showContribForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 space-y-4"
                  onSubmit={handleSubmitContribution}
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de contribución</label>
                    <select 
                      value={contribForm.tipo}
                      onChange={(e) => setContribForm({...contribForm, tipo: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="codigo">Código</option>
                      <option value="documentacion">Documentación</option>
                      <option value="bug_report">Reporte de Bug</option>
                      <option value="feature">Nueva Característica</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                    <input 
                      type="text"
                      value={contribForm.titulo}
                      onChange={(e) => setContribForm({...contribForm, titulo: e.target.value})}
                      placeholder="Describe brevemente tu contribución"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                    <textarea 
                      value={contribForm.descripcion}
                      onChange={(e) => setContribForm({...contribForm, descripcion: e.target.value})}
                      placeholder="Explica con más detalle..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white h-24"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">URL (opcional)</label>
                    <input 
                      type="url"
                      value={contribForm.url}
                      onChange={(e) => setContribForm({...contribForm, url: e.target.value})}
                      placeholder="https://github.com/..."
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  
                  <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {submitting ? 'Enviando...' : 'Enviar Contribución'}
                  </Button>
                </motion.form>
              )}
              
              {submitResult && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${submitResult.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {submitResult.error ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  {submitResult.message}
                </div>
              )}
            </div>
            
            {/* Pasos */}
            <div className="space-y-4">
              {contributing.pasos?.map((paso, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {paso.numero}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{paso.titulo}</h4>
                    <p className="text-slate-400">{paso.descripcion}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Reglas */}
            <section className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Reglas de Contribución</h3>
              <ul className="space-y-2">
                {contributing.reglas?.map((regla, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {regla}
                  </li>
                ))}
              </ul>
            </section>
          </motion.div>
        )}

        {/* Desarrolladores Tab */}
        {activeTab === 'desarrolladores' && developers && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold text-white">Equipo de Desarrollo</h2>
            
            {developers.desarrolladores?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {developers.desarrolladores.map((dev, idx) => (
                  <motion.div
                    key={dev.user_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {dev.picture ? (
                        <img src={dev.picture} alt={dev.name} className="w-16 h-16 rounded-full" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                          {dev.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{dev.name}</h3>
                        <p className="text-purple-400">Nivel {dev.nivel} • {dev.puntos} pts</p>
                      </div>
                    </div>
                    
                    {dev.badges?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dev.badges.map((badge) => {
                          const IconComponent = iconMap[badge.icono] || Award;
                          return (
                            <div 
                              key={badge.badge_id}
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${badge.color}20` }}
                              title={badge.nombre}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: badge.color }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{developers.mensaje}</h3>
                <p className="text-slate-400 mb-6">{developers.como_unirse}</p>
                <Button 
                  onClick={() => setActiveTab('contribuir')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                >
                  Aprende cómo contribuir
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="border-t border-purple-500/20 bg-gradient-to-t from-purple-500/5 to-transparent py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para ser parte del futuro?
          </h2>
          <p className="text-slate-400 mb-8">
            Únete a los estudiantes de CECyTE 04 que están construyendo la siguiente generación de inteligencia artificial.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/cuestionario-vocacional">
              <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                Descubre si programación es para ti
              </Button>
            </Link>
            <Link to="/especialidades">
              <Button className="bg-gradient-to-r from-cyan-500 to-lime-500 text-slate-900 font-bold">
                Ver todas las carreras
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
