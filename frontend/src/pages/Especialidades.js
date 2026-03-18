import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, 
  Code, 
  Cpu, 
  Calculator, 
  Briefcase, 
  Heart,
  ArrowRight,
  GraduationCap,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ICONS = {
  prog: Code,
  electronica: Cpu,
  contabilidad: Calculator,
  administracion: Briefcase,
  enfermeria: Heart
};

function EspecialidadCard({ especialidad, index }) {
  const navigate = useNavigate();
  const Icon = ICONS[especialidad.especialidad_id] || GraduationCap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
      style={{ '--card-color': especialidad.color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${especialidad.color}15`, border: `1px solid ${especialidad.color}40` }}
        >
          <Icon className="w-7 h-7" style={{ color: especialidad.color }} />
        </div>
        <span 
          className="px-3 py-1 rounded-full text-xs font-mono"
          style={{ backgroundColor: `${especialidad.color}15`, color: especialidad.color }}
        >
          {especialidad.especialidad_id.toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h3 
        className="text-2xl font-['Syne'] font-bold mb-3"
        style={{ color: especialidad.color }}
      >
        {especialidad.nombre}
      </h3>

      {/* Description */}
      <p className="text-white/60 text-sm leading-relaxed mb-6">
        {especialidad.descripcion}
      </p>

      {/* Skills */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          Habilidades
        </h4>
        <div className="flex flex-wrap gap-2">
          {especialidad.habilidades?.slice(0, 4).map((hab, i) => (
            <span 
              key={i}
              className="px-2 py-1 rounded-full text-xs bg-white/5 text-white/70"
            >
              {hab}
            </span>
          ))}
          {especialidad.habilidades?.length > 4 && (
            <span className="px-2 py-1 rounded-full text-xs bg-white/5 text-white/40">
              +{especialidad.habilidades.length - 4} mas
            </span>
          )}
        </div>
      </div>

      {/* Career Fields */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          Campo Laboral
        </h4>
        <ul className="space-y-2">
          {especialidad.campo_laboral?.slice(0, 3).map((campo, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-white/70">
              <span 
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: especialidad.color }}
              />
              {campo}
            </li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <Button
        onClick={() => navigate('/simulator', { state: { carrera: especialidad.nombre } })}
        className="w-full rounded-xl py-3 transition-all"
        style={{ 
          backgroundColor: `${especialidad.color}15`,
          color: especialidad.color,
          border: `1px solid ${especialidad.color}30`
        }}
        data-testid={`sim-${especialidad.especialidad_id}-btn`}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Simular mi futuro
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

export default function Especialidades() {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch(`${API_URL}/api/especialidades`);
        if (response.ok) {
          const data = await response.json();
          setEspecialidades(data);
        }
      } catch (error) {
        console.error('Error fetching especialidades:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEspecialidades();
  }, []);

  return (
    <div className="min-h-screen bg-[#020408] grid-bg">
      {/* Navigation */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="container-cyber flex items-center justify-between py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-[#7c3aed]" />
            <span className="text-lg font-bold font-['Syne']">Especialidades</span>
          </div>

          <Button
            onClick={() => navigate('/tour')}
            className="btn-secondary rounded-full px-4 py-2"
          >
            Ver en 3D
          </Button>
        </div>
      </nav>

      {/* Header */}
      <section className="container-cyber py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-sm text-[#7c3aed] mb-6">
            <GraduationCap className="w-4 h-4" />
            Carreras Tecnicas
          </span>
          <h1 className="text-4xl md:text-5xl font-['Syne'] font-bold mb-4">
            Nuestras <span className="text-[#7c3aed]">Especialidades</span>
          </h1>
          <p className="text-white/50">
            Descubre las carreras tecnicas disponibles en CECyTE 04 y encuentra 
            la que mejor se adapte a tus intereses y habilidades.
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner-cyber" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {especialidades.map((esp, index) => (
              <EspecialidadCard 
                key={esp.especialidad_id} 
                especialidad={esp}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container-cyber pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 md:p-12 text-center"
        >
          <Sparkles className="w-12 h-12 text-[#ccff00] mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-['Syne'] font-bold mb-4">
            No sabes cual elegir?
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-8">
            Usa nuestro simulador de futuro con inteligencia artificial para 
            descubrir cual carrera se adapta mejor a tus intereses.
          </p>
          <Button
            onClick={() => navigate('/simulator')}
            className="btn-primary rounded-full px-8 py-6 text-lg"
            data-testid="cta-simulator-btn"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Descubrir mi Carrera Ideal
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
