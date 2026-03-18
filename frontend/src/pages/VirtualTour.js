import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Info, 
  X, 
  Code, 
  Cpu, 
  Calculator, 
  Briefcase, 
  Heart,
  MapPin,
  RotateCcw,
  Sparkles,
  ZoomIn
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Building Card Component for 2.5D effect
function BuildingCard({ especialidad, isSelected, onSelect, index }) {
  const getIcon = (id) => {
    const icons = {
      prog: Code,
      electronica: Cpu,
      contabilidad: Calculator,
      administracion: Briefcase,
      enfermeria: Heart
    };
    return icons[id] || Info;
  };

  const Icon = getIcon(especialidad.especialidad_id);
  
  const positions = [
    { x: -35, y: 5, z: 0, rotate: 20 },
    { x: 35, y: 5, z: 0, rotate: -20 },
    { x: 0, y: 20, z: -10, rotate: 0 },
    { x: -22, y: 18, z: -5, rotate: 12 },
    { x: 22, y: 18, z: -5, rotate: -12 },
  ];

  const pos = positions[index] || positions[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isSelected ? 1.15 : 1,
        x: `${pos.x}%`,
        y: `${pos.y}%`,
        rotateY: pos.rotate,
        z: pos.z
      }}
      whileHover={{ scale: 1.1, z: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={() => onSelect(especialidad)}
      className={`absolute cursor-pointer transform-gpu preserve-3d transition-all duration-500
        ${isSelected ? 'z-30' : 'z-10'}`}
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateX(${pos.x}%) translateY(${pos.y}%) rotateY(${pos.rotate}deg)`,
        transformStyle: 'preserve-3d'
      }}
      data-testid={`building-${especialidad.especialidad_id}`}
    >
      <div 
        className={`w-40 h-56 md:w-48 md:h-64 rounded-2xl p-4 flex flex-col items-center justify-center
          backdrop-blur-xl border-2 transition-all duration-300 group
          ${isSelected 
            ? 'border-opacity-100 shadow-2xl' 
            : 'border-opacity-30 hover:border-opacity-60'
          }`}
        style={{ 
          backgroundColor: `${especialidad.color}15`,
          borderColor: especialidad.color,
          boxShadow: isSelected 
            ? `0 0 40px ${especialidad.color}40, 0 20px 60px rgba(0,0,0,0.5)` 
            : `0 10px 40px rgba(0,0,0,0.3)`
        }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ 
            background: `radial-gradient(circle at center, ${especialidad.color}20, transparent 70%)`
          }}
        />
        
        {/* Icon */}
        <div 
          className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 relative z-10"
          style={{ backgroundColor: `${especialidad.color}30` }}
        >
          <Icon className="w-8 h-8" style={{ color: especialidad.color }} />
        </div>
        
        {/* Name */}
        <h3 
          className="text-lg font-bold font-['Syne'] text-center relative z-10"
          style={{ color: especialidad.color }}
        >
          {especialidad.nombre}
        </h3>
        
        {/* Indicator */}
        <div 
          className={`mt-3 w-2 h-2 rounded-full transition-all ${isSelected ? 'scale-150' : ''}`}
          style={{ backgroundColor: especialidad.color }}
        />
        
        {/* Wireframe decoration */}
        <div className="absolute inset-2 border border-white/10 rounded-xl pointer-events-none" />
      </div>
    </motion.div>
  );
}

// Info Panel Component
function InfoPanel({ especialidad, onClose }) {
  const getIcon = (id) => {
    const icons = {
      prog: Code,
      electronica: Cpu,
      contabilidad: Calculator,
      administracion: Briefcase,
      enfermeria: Heart
    };
    return icons[id] || Info;
  };

  const Icon = getIcon(especialidad?.especialidad_id);

  if (!especialidad) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className="absolute top-20 right-4 w-80 glass-card rounded-2xl p-6 z-40"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
        data-testid="close-info-panel"
      >
        <X className="w-5 h-5 text-white/50" />
      </button>

      <div 
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${especialidad.color}20`, border: `1px solid ${especialidad.color}40` }}
      >
        <Icon className="w-7 h-7" style={{ color: especialidad.color }} />
      </div>

      <h2 className="text-2xl font-['Syne'] font-bold mb-2" style={{ color: especialidad.color }}>
        {especialidad.nombre}
      </h2>
      
      <p className="text-white/70 text-sm mb-4 leading-relaxed">
        {especialidad.descripcion || 'Especialidad tecnica en CECyTE 04'}
      </p>

      {especialidad.habilidades && especialidad.habilidades.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white/50 mb-2">Habilidades que desarrollaras:</h3>
          <div className="flex flex-wrap gap-2">
            {especialidad.habilidades.slice(0, 5).map((hab, i) => (
              <span 
                key={i}
                className="px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: `${especialidad.color}20`, color: especialidad.color }}
              >
                {hab}
              </span>
            ))}
          </div>
        </div>
      )}

      {especialidad.campo_laboral && especialidad.campo_laboral.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white/50 mb-2">Campo laboral:</h3>
          <ul className="space-y-1">
            {especialidad.campo_laboral.slice(0, 4).map((campo, i) => (
              <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: especialidad.color }} />
                {campo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#7c3aed]/10 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#00f0ff]/10 blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-[#ccff00]/10 blur-3xl animate-float" style={{ animationDelay: '-5s' }} />
      
      {/* Stars */}
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse-glow"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        />
      ))}
      
      {/* Central monument representation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
        <div className="absolute inset-0 border-2 border-[#ccff00]/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute inset-4 border-2 border-[#00f0ff]/30 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        <div className="absolute inset-8 border-2 border-[#7c3aed]/30 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-[#ccff00] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);
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

  const handleSelectEspecialidad = (esp) => {
    setSelectedEspecialidad(prev => 
      prev?.especialidad_id === esp.especialidad_id ? null : esp
    );
  };

  return (
    <div className="h-screen bg-[#020408] relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors glass px-4 py-2 rounded-full"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        
        <div className="glass px-6 py-3 rounded-full flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#ccff00]" />
          <span className="font-bold font-['Syne']">Tour Virtual</span>
          <span className="text-xs font-mono text-white/50 hidden sm:block">CECyTE 04</span>
        </div>

        <button 
          onClick={() => setSelectedEspecialidad(null)}
          className="glass p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Reset View"
          data-testid="reset-view-btn"
        >
          <RotateCcw className="w-5 h-5 text-white/70" />
        </button>
      </nav>

      {/* Main Content - 3D Scene */}
      <div className="w-full h-full flex items-center justify-center perspective-1000">
        {loading ? (
          <div className="spinner-cyber" />
        ) : (
          <div 
            className="relative w-full h-full"
            style={{ 
              perspective: '1200px',
              perspectiveOrigin: '50% 40%'
            }}
          >
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 text-center z-20"
            >
              <h1 className="text-4xl md:text-5xl font-['Syne'] font-bold text-[#ccff00] mb-2">
                CECyTE 04
              </h1>
              <p className="text-white/50 font-mono text-sm">
                19°30'33.77"N 98°27'52.86"W
              </p>
            </motion.div>

            {/* Buildings */}
            {especialidades.map((esp, index) => (
              <BuildingCard
                key={esp.especialidad_id}
                especialidad={esp}
                isSelected={selectedEspecialidad?.especialidad_id === esp.especialidad_id}
                onSelect={handleSelectEspecialidad}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {selectedEspecialidad && (
          <InfoPanel 
            especialidad={selectedEspecialidad}
            onClose={() => setSelectedEspecialidad(null)}
          />
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 glass px-4 py-3 rounded-xl text-sm text-white/50 z-30">
        <p>Click en un edificio para ver informacion de la especialidad</p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 glass px-4 py-3 rounded-xl z-30">
        <p className="text-xs text-white/50 mb-2">Especialidades:</p>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {especialidades.map((esp) => (
            <button
              key={esp.especialidad_id}
              onClick={() => handleSelectEspecialidad(esp)}
              className={`px-2 py-1 rounded-full text-xs transition-all ${
                selectedEspecialidad?.especialidad_id === esp.especialidad_id ? 'scale-110 ring-1' : ''
              }`}
              style={{ 
                backgroundColor: `${esp.color}20`, 
                color: esp.color,
                borderColor: esp.color
              }}
              data-testid={`legend-${esp.especialidad_id}`}
            >
              {esp.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
