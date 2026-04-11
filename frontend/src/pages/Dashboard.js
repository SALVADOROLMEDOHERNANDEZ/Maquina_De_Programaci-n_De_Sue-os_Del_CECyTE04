import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { 
  Sparkles, 
  MapPin, 
  History, 
  LogOut, 
  Cpu, 
  ArrowRight,
  GraduationCap,
  Image,
  Clock,
  Shield,
  Film
} from 'lucide-react';
import Logo from '../assets/Logo/g6.png'; // o logo.svg

const API_URL = process.env.REACT_APP_BACKEND_URL;

function SimulationCard({ simulation }) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 cursor-pointer group"
      onClick={() => navigate(`/simulation/${simulation.simulation_id}`)}
    >
      <div className="flex items-start gap-4">
        {simulation.imagen_base64 ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
            <img 
              src={`data:image/png;base64,${simulation.imagen_base64}`}
              alt="Simulacion"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Image className="w-8 h-8 text-white/30" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-['Syne'] text-white truncate">
            {simulation.nombre}
          </h3>
          <p className="text-sm text-[#00f0ff]">{simulation.carrera}</p>
          <div className="flex items-center gap-1 mt-1 text-white/40 text-xs">
            <Clock className="w-3 h-3" />
            {new Date(simulation.created_at).toLocaleDateString('es-MX')}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-[#ccff00] transition-colors" />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loading, checkAuth } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [loadingSimulations, setLoadingSimulations] = useState(true);

  useEffect(() => {
    // If user was passed from AuthCallback, use it
    if (location.state?.user && !user) {
      checkAuth();
    }
  }, [location.state, user, checkAuth]);

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const response = await fetch(`${API_URL}/api/simulations/user`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSimulations(data);
        }
      } catch (error) {
        console.error('Error fetching simulations:', error);
      } finally {
        setLoadingSimulations(false);
      }
    };

    if (user) {
      fetchSimulations();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="spinner-cyber" />
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020408] grid-bg">
      {/* Navigation */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
  <div className="container-cyber flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
    <div 
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => navigate('/')}
    >
      {/* Logo adaptable */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center">
        <img src={Logo} alt="Logo" className="w-full h-auto" />
      </div>

      {/* Texto adaptable */}
      <span className="text-base sm:text-lg md:text-xl font-bold font-['Syne'] tracking-tight text-center sm:text-left">
        Maquina de Programación de Sueños del CECyTE 04 - MPSCECyTE 04
      </span>
    </div>

    <div className="flex items-center gap-4">
      {user.is_admin && (
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="text-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#7c3aed]/10"
        >
          <Shield className="w-4 h-4 mr-2" />
          Admin
        </Button>
      )}
      <Button
        variant="ghost"
        onClick={() => navigate('/galeria-multimedia')}
        className="menu-pill hidden md:inline-flex"
      >
        <Film className="w-4 h-4 text-[#ff7c9c]" />
        Publicaciones
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 border-2 border-[#00f0ff]/30">
          <AvatarImage src={user.picture} alt={user.name} />
          <AvatarFallback className="bg-[#7c3aed] text-white">
            {user.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-white/50">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        className="text-white/50 hover:text-white hover:bg-white/5"
      >
        <LogOut className="w-5 h-5" />
      </Button>
    </div>
  </div>
</nav>

      {/* Main Content */}
      <main className="container-cyber py-8 md:py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-['Syne'] font-bold mb-2">
            Bienvenido, <span className="text-[#ccff00]">{user.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-white/50">
            Explora tu futuro y descubre las oportunidades en CECyTE 04
          </p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 cursor-pointer group"
            onClick={() => navigate('/simulator')}
            data-testid="dashboard-simulator-card"
          >
            <div className="w-14 h-14 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-[#ccff00]" />
            </div>
            <h3 className="text-xl font-bold font-['Syne'] mb-2">Simulador de Futuro</h3>
            <p className="text-white/50 text-sm mb-4">
              Genera tu historia de exito personalizada con IA
            </p>
            <div className="flex items-center gap-2 text-[#ccff00] text-sm font-medium">
              Comenzar <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 cursor-pointer group"
            onClick={() => navigate('/tour')}
            data-testid="dashboard-tour-card"
          >
            <div className="w-14 h-14 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7 text-[#00f0ff]" />
            </div>
            <h3 className="text-xl font-bold font-['Syne'] mb-2">Tour Virtual 3D</h3>
            <p className="text-white/50 text-sm mb-4">
              Explora el campus con tu avatar personalizado
            </p>
            <div className="flex items-center gap-2 text-[#00f0ff] text-sm font-medium">
              Explorar <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6 cursor-pointer group"
            onClick={() => navigate('/especialidades')}
            data-testid="dashboard-specialties-card"
          >
            <div className="w-14 h-14 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7 text-[#7c3aed]" />
            </div>
            <h3 className="text-xl font-bold font-['Syne'] mb-2">Especialidades</h3>
            <p className="text-white/50 text-sm mb-4">
              Conoce todas las carreras disponibles
            </p>
            <div className="flex items-center gap-2 text-[#7c3aed] text-sm font-medium">
              Ver todas <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6 cursor-pointer group"
            onClick={() => navigate('/galeria-multimedia')}
            data-testid="dashboard-gallery-card"
          >
            <div className="w-14 h-14 rounded-xl bg-[#ff7c9c]/10 border border-[#ff7c9c]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Film className="w-7 h-7 text-[#ff7c9c]" />
            </div>
            <h3 className="text-xl font-bold font-['Syne'] mb-2">Publicaciones</h3>
            <p className="text-white/50 text-sm mb-4">
              Noticias, fotos y videos del campus en formato moderno
            </p>
            <div className="flex items-center gap-2 text-[#ff7c9c] text-sm font-medium">
              Ir a publicaciones <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>

        {/* Recent Simulations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#00f0ff]" />
              <h2 className="text-xl font-['Syne'] font-bold">Mis Simulaciones</h2>
            </div>
          </div>

          {loadingSimulations ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner-cyber" />
            </div>
          ) : simulations.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {simulations.map((sim) => (
                <SimulationCard key={sim.simulation_id} simulation={sim} />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white/70 mb-2">
                Aun no tienes simulaciones
              </h3>
              <p className="text-white/40 text-sm mb-6">
                Crea tu primera simulacion de futuro con inteligencia artificial
              </p>
              <Button
                onClick={() => navigate('/simulator')}
                className="btn-primary rounded-full px-6"
                data-testid="create-first-simulation-btn"
              >
                Crear Simulacion
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
