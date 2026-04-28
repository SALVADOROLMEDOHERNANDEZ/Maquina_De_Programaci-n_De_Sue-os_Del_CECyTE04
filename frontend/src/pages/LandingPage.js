import React, { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import {
  Sparkles,
  Cpu,
  GraduationCap,
  MapPin,
  ArrowRight,
  Play,
  Brain,
  Film
} from 'lucide-react';
import Logo from '../assets/Logo/g6.png'; // o logo.svg

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="glass-card rounded-2xl p-6 group cursor-pointer"
      style={{ '--card-color': color }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <h3 className="text-xl font-bold mb-2 font-['Syne']">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Animated Particles Background (CSS-only fallback)
function ParticlesBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7c3aed]/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#00f0ff]/15 blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[#ccff00]/10 blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
      
      {/* Star particles */}
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse-glow"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] relative overflow-hidden">
      {/* Particles Background */}
      <ParticlesBackground />

      {/* Hero Glow */}
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 md:px-12 lg:px-24 py-5 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 min-w-[220px]"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
            <img src={Logo} alt="Logo CECyTE" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          </div>
          <div className="text-left">
            <span className="block text-base sm:text-lg md:text-xl font-semibold font-['Syne'] tracking-tight text-white">Máquina de Programación de Sueños</span>
            <span className="block text-sm sm:text-base text-white/60">CECyTE 04 - MPSCECyTE 04</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center justify-end gap-3"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/ia-cecyte')}
            className="text-white/70 hover:text-white hover:bg-white/5 rounded-full px-4 py-3 text-sm hidden md:inline-flex"
            data-testid="nav-ai-btn"
          >
            <Brain className="w-4 h-4 mr-2" />
            IA CECYTE
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/tour')}
            className="text-white/70 hover:text-white hover:bg-white/5 rounded-full px-4 py-3 text-sm"
            data-testid="nav-tour-btn"
          >
            Tour Virtual
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/publicaciones')}
            className="menu-pill rounded-full px-5 py-3 text-sm hidden lg:inline-flex"
            data-testid="nav-publicaciones-btn"
          >
            <Film className="w-4 h-4 text-[#ff7c9c]" />
            Publicaciones
          </Button>
          <Button
            onClick={handleGetStarted}
            className="menu-pill rounded-full px-5 py-3 text-sm"
            data-testid="nav-login-btn"
          >
            {isAuthenticated ? 'Dashboard' : 'Iniciar'}
          </Button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container-cyber pt-16 md:pt-24 pb-32 hero-bg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#7c3aed]/20 text-sm text-white/70 mb-6">
              <Sparkles className="w-4 h-4 text-[#ccff00]" />
              Experiencia CECyTE 04 con IA
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-['Syne'] font-extrabold leading-tight mb-6"
          >
            <span className="text-white">Construye tu</span>
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#ccff00] to-[#ff8c00] bg-clip-text text-transparent text-glow-green">
              Futuro CECyTE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Descubre tu futuro en CECyTE 04 con inteligencia artificial. 
            Genera tu historia de exito y explora el campus en 3D.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => navigate('/simulator')}
              className="btn-primary rounded-full px-8 py-6 text-lg flex items-center gap-2"
              data-testid="hero-simulator-btn"
            >
              <Sparkles className="w-5 h-5" />
              Simula tu Futuro
            </Button>
            <Button
              onClick={() => navigate('/tour')}
              variant="outline"
              className="btn-secondary rounded-full px-8 py-6 text-lg flex items-center gap-2"
              data-testid="hero-tour-btn"
            >
              <Play className="w-5 h-5" />
              Tour Virtual 3D
            </Button>
          </motion.div>

          {/* Coordinates Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10"
          >
            <MapPin className="w-4 h-4 text-[#00f0ff]" />
            <span className="text-xs font-mono text-white/50">19°30'33.77"N 98°27'52.86"W</span>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container-cyber pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-['Syne'] font-bold mb-4">
            Experiencia <span className="text-[#00f0ff]">Inmersiva</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Tecnologia de vanguardia para visualizar tu futuro academico y profesional
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Sparkles}
            title="Simulador de Futuro"
            description="IA generativa crea tu historia de exito personalizada con imagenes hiperrealistas de tu futuro profesional."
            color="#ccff00"
            delay={0}
          />
          <FeatureCard
            icon={MapPin}
            title="Tour Virtual 3D"
            description="Explora el campus en realidad virtual con un avatar personalizado que te guia por cada especialidad."
            color="#00f0ff"
            delay={0.1}
          />
          <FeatureCard
            icon={GraduationCap}
            title="Especialidades"
            description="Conoce todas las carreras tecnicas disponibles y sus oportunidades laborales en el mundo real."
            color="#7c3aed"
            delay={0.15}
          />
          <FeatureCard
            icon={Brain}
            title="IA CECYTE"
            description="Proyecto colaborativo donde estudiantes de programacion construyen su propia inteligencia artificial."
            color="#ff9500"
            delay={0.2}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container-cyber pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=srgb&fm=jpg&q=85)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          <div className="relative z-10">
            <GraduationCap className="w-16 h-16 text-[#ccff00] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-['Syne'] font-bold mb-4">
              Tu Futuro Comienza Aqui
            </h2>
            <p className="text-white/60 max-w-xl mx-auto mb-8">
              Unete a la revolucion educativa de CECyTE 04 y descubre como la tecnologia 
              puede transformar tu trayectoria profesional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate('/simulator')}
                className="btn-primary rounded-full px-8 py-6 text-lg flex items-center gap-2"
                data-testid="cta-simulator-btn"
              >
                <Sparkles className="w-5 h-5" />
                Simula tu Futuro
              </Button>
              <Button
                onClick={() => navigate('/ia-cecyte')}
                variant="outline"
                className="btn-secondary rounded-full px-8 py-6 text-lg flex items-center gap-2"
                data-testid="cta-ai-btn"
              >
                <Brain className="w-5 h-5" />
                Proyecto IA
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container-cyber flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="w-7 h-6"/>
            <span className="text-sm text-white/50">
              Maquina de Programación de Sueños del CECyTE 04 - MPSCECyTE 04
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Admin
            </button>
            <span className="text-sm text-white/30 font-mono">
              Tlaxcala, Mexico | 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
