import React, { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
  User
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Extend OrbitControls
extend({ OrbitControls });

// Custom OrbitControls component
function CameraControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate
      autoRotateSpeed={0.2}
    />
  );
}

// Stars component (pure Three.js)
function Stars() {
  const starsRef = useRef();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 400;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    return pos;
  }, []);
  
  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
    }
  });
  
  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={3000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.5} color="#ffffff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Tarjeta 3D de Especialidad
function SpecialtyCard3D({ especialidad, position, isSelected, onSelect }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  const scale = hovered || isSelected ? 1.12 : 1;
  const color = new THREE.Color(especialidad.color);

  return (
    <group 
      ref={meshRef} 
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect(especialidad); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      scale={[scale, scale, scale]}
    >
      {/* Panel principal */}
      <mesh>
        <boxGeometry args={[3.5, 4.5, 0.3]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={hovered || isSelected ? 0.92 : 0.75}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.35 : 0.12}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      
      {/* Borde wireframe */}
      <mesh scale={[1.03, 1.03, 1]}>
        <boxGeometry args={[3.5, 4.5, 0.2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>
      
      {/* Esfera indicadora */}
      <mesh ref={glowRef} position={[0, 3, 0]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 2 : 0.8}
        />
      </mesh>
      
      {/* Beam de luz */}
      {(hovered || isSelected) && (
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 6, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}

// Avatar simple
function Avatar({ position, color }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Cuerpo */}
      <mesh position={[0, 0.65, 0]}>
        <capsuleGeometry args={[0.35, 0.7, 10, 18]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      
      {/* Cabeza */}
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshStandardMaterial color="#FFDFC4" roughness={0.8} />
      </mesh>
      
      {/* Ojos */}
      <mesh position={[-0.1, 1.5, 0.25]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color="#222" />
      </mesh>
      <mesh position={[0.1, 1.5, 0.25]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color="#222" />
      </mesh>
    </group>
  );
}

// Monumento central
function CentralMonument() {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, 5, 0]}>
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[6, 0.15, 18, 120]} />
        <meshBasicMaterial color="#ccff00" />
      </mesh>
      <mesh rotation={[-Math.PI / 4, 0, Math.PI / 2]}>
        <torusGeometry args={[5, 0.15, 18, 120]} />
        <meshBasicMaterial color="#00f0ff" />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, Math.PI / 4]}>
        <torusGeometry args={[4, 0.15, 18, 120]} />
        <meshBasicMaterial color="#7c3aed" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 36, 36]} />
        <meshStandardMaterial color="#ccff00" emissive="#ccff00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Ground
function Ground() {
  return (
    <group>
      <gridHelper args={[140, 70, '#00f0ff', '#1a1a3a']} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#040812" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Escena principal
function Scene({ especialidades, selectedEspecialidad, onSelectEspecialidad, tarjetaPositions }) {
  const defaultPositions = useMemo(() => [
    { x: -20, y: 2, z: 14 },
    { x: 20, y: 2, z: 14 },
    { x: 0, y: 2, z: -22 },
    { x: -16, y: 2, z: -14 },
    { x: 16, y: 2, z: -14 },
  ], []);

  return (
    <>
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 70, 200]} />
      
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 70, 0]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-45, 30, 30]} intensity={1} color="#00f0ff" />
      <pointLight position={[45, 30, 30]} intensity={1} color="#ccff00" />
      <pointLight position={[0, 30, -45]} intensity={1} color="#7c3aed" />
      
      <Stars />
      <Ground />
      <CentralMonument />
      
      {/* Tarjetas */}
      {especialidades.map((esp, index) => {
        const savedPos = tarjetaPositions.find(p => p.especialidad_id === esp.especialidad_id);
        const pos = savedPos?.position || defaultPositions[index] || { x: 0, y: 2, z: 0 };
        
        return (
          <SpecialtyCard3D
            key={esp.especialidad_id}
            especialidad={esp}
            position={[pos.x, pos.y, pos.z]}
            isSelected={selectedEspecialidad === esp.especialidad_id}
            onSelect={() => onSelectEspecialidad(esp.especialidad_id)}
          />
        );
      })}
      
      {/* Avatar */}
      <Avatar position={[0, 0, 10]} color="#1E3A5F" />
      
      <CameraControls />
    </>
  );
}

// Panel de información
function InfoPanel({ especialidad, onClose }) {
  const getIcon = (id) => {
    const icons = { prog: Code, electronica: Cpu, contabilidad: Calculator, administracion: Briefcase, enfermeria: Heart };
    return icons[id] || Info;
  };

  const Icon = getIcon(especialidad?.especialidad_id);
  if (!especialidad) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute top-20 right-4 w-80 glass-card rounded-2xl p-6 z-40"
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full">
        <X className="w-5 h-5 text-white/50" />
      </button>

      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${especialidad.color}20`, border: `1px solid ${especialidad.color}40` }}>
        <Icon className="w-7 h-7" style={{ color: especialidad.color }} />
      </div>

      <h2 className="text-2xl font-['Syne'] font-bold mb-2" style={{ color: especialidad.color }}>
        {especialidad.nombre}
      </h2>
      
      <p className="text-white/70 text-sm mb-4 leading-relaxed">{especialidad.descripcion}</p>

      {especialidad.habilidades?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white/50 mb-2">Habilidades:</h3>
          <div className="flex flex-wrap gap-2">
            {especialidad.habilidades.slice(0, 5).map((hab, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: `${especialidad.color}20`, color: especialidad.color }}>
                {hab}
              </span>
            ))}
          </div>
        </div>
      )}

      {especialidad.campo_laboral?.length > 0 && (
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

// Componente principal
export default function VirtualTour() {
  const navigate = useNavigate();
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tarjetaPositions, setTarjetaPositions] = useState([]);
  const [userName, setUserName] = useState('Visitante');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espRes, posRes] = await Promise.all([
          fetch(`${API_URL}/api/especialidades`),
          fetch(`${API_URL}/api/tarjetas/positions`)
        ]);
        
        if (espRes.ok) setEspecialidades(await espRes.json());
        if (posRes.ok) setTarjetaPositions(await posRes.json());
        
        try {
          const userRes = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
          if (userRes.ok) {
            const user = await userRes.json();
            setUserName(user.name?.split(' ')[0] || 'Visitante');
          }
        } catch (e) {}
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectEspecialidad = (espId) => {
    setSelectedEspecialidad(prev => prev === espId ? null : espId);
  };

  const selectedEsp = especialidades.find(e => e.especialidad_id === selectedEspecialidad);

  return (
    <div className="h-screen bg-[#020408] relative overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors glass px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        
        <div className="glass px-6 py-3 rounded-full flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#ccff00]" />
          <span className="font-bold font-['Syne']">Tour Virtual 3D</span>
          <span className="text-xs font-mono text-white/40">CECyTE 04</span>
        </div>

        <button 
          onClick={() => setSelectedEspecialidad(null)}
          className="glass p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-white/70" />
        </button>
      </nav>

      {/* 3D Canvas */}
      <div className="w-full h-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="spinner-cyber mb-4" />
              <p className="text-white/50">Cargando Tour Virtual...</p>
            </div>
          </div>
        ) : (
          <Canvas camera={{ position: [30, 22, 30], fov: 50 }}>
            <Scene 
              especialidades={especialidades}
              selectedEspecialidad={selectedEspecialidad}
              onSelectEspecialidad={handleSelectEspecialidad}
              tarjetaPositions={tarjetaPositions}
            />
          </Canvas>
        )}
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {selectedEsp && <InfoPanel especialidad={selectedEsp} onClose={() => setSelectedEspecialidad(null)} />}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 glass px-4 py-3 rounded-xl text-sm text-white/50">
        <p>🖱️ Arrastra para rotar | Scroll para zoom | Click en tarjeta</p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 glass px-4 py-3 rounded-xl">
        <p className="text-xs text-white/50 mb-2">Especialidades:</p>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {especialidades.map((esp) => (
            <button
              key={esp.especialidad_id}
              onClick={() => handleSelectEspecialidad(esp.especialidad_id)}
              className={`px-2 py-1 rounded-full text-xs transition-all ${selectedEspecialidad === esp.especialidad_id ? 'scale-110 ring-1' : ''}`}
              style={{ backgroundColor: `${esp.color}20`, color: esp.color }}
            >
              {esp.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="absolute top-20 left-4 glass px-4 py-2 rounded-xl flex items-center gap-2">
        <User className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-white text-sm">{userName}</span>
      </div>
    </div>
  );
}
