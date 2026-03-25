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
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CecyteAI() {
  const [info, setInfo] = useState(null);
  const [docs, setDocs] = useState(null);
  const [contributing, setContributing] = useState(null);
  const [developers, setDevelopers] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, docsRes, contribRes, devsRes] = await Promise.all([
          fetch(`${API_URL}/api/ia-cecyte/info`),
          fetch(`${API_URL}/api/ia-cecyte/docs`),
          fetch(`${API_URL}/api/ia-cecyte/contributing`),
          fetch(`${API_URL}/api/ia-cecyte/developers`)
        ]);

        setInfo(await infoRes.json());
        setDocs(await docsRes.json());
        setContributing(await contribRes.json());
        setDevelopers(await devsRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Brain },
    { id: 'docs', label: 'Documentación', icon: BookOpen },
    { id: 'contribuir', label: 'Cómo Contribuir', icon: GitBranch },
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
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-500/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

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

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Construyamos la{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                IA del Futuro
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              {info?.descripcion}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setActiveTab('contribuir')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-3"
              >
                <GitBranch className="w-5 h-5 mr-2" />
                Empezar a Contribuir
              </Button>
              <Button 
                onClick={() => setActiveTab('docs')}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 px-6 py-3"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Leer Documentación
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
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
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

            {/* Features Grid */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">¿Qué construiremos?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: MessageSquare, title: 'Chatbot Inteligente', desc: 'Un asistente virtual que responda preguntas sobre CECyTE' },
                  { icon: Database, title: 'Base de Conocimiento', desc: 'Repositorio de información académica y administrativa' },
                  { icon: Cpu, title: 'Modelos ML', desc: 'Algoritmos de machine learning entrenados por estudiantes' }
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 hover:border-purple-500/30 transition-colors"
                  >
                    <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </section>
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {developers.desarrolladores.map((dev, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{dev.nombre}</h3>
                    <p className="text-purple-400 text-sm">{dev.rol}</p>
                  </div>
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
