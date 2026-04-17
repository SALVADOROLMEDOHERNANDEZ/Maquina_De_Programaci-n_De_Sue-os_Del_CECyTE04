import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import * as THREE from 'three';
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
  User,
  Loader2,
  Box,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
//Controles
function useKeyboard() {
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e) => (keys.current[e.key.toLowerCase()] = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keys;
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
      
      <mesh scale={[1.03, 1.03, 1]}>
        <boxGeometry args={[3.5, 4.5, 0.2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>
      
      <mesh ref={glowRef} position={[0, 3, 0]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 2 : 0.8}
        />
      </mesh>
      
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
const Avatar3D = React.forwardRef(({ url, startPosition = [-50, 0, -50] }, ref) => {
  const [model, setModel] = useState();

  useEffect(() => {
    const load = async () => {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(url, (gltf) => {
        const scene = gltf.scene;

        // 🔥 escala
        scene.scale.set(1.5, 1.5, 1.5);

        // 🔥 crear contenedor para el avatar
        const group = new THREE.Group();
        group.add(scene);

        // 🔥 mantener la posición original del GLB del avatar
        group.position.set(startPosition[0], startPosition[1], startPosition[2]);

        // 🔥 levanta el avatar para que no quede bajo el suelo
        const box = new THREE.Box3().setFromObject(scene);
        scene.position.y = -box.min.y;

        setModel(group);
      });
    };

    load();
  }, [url, startPosition]);

  if (!model) return null;

  return <primitive ref={ref} object={model} />;
});
//Movimiento del Avatar con detección de colisiones por raycasting
function Player({ url, playerRef, startPosition = [-45, 0, -45], mobileControls, collidersRef, onNearModel }) {
  const keys = useKeyboard();
  const lightRef = useRef();

  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const initialized = useRef(false);

  // 🔥 Raycasters reutilizables para detectar colisiones (delante, detrás, lados)
  const rayForward = useMemo(() => new THREE.Raycaster(), []);
  const rayBack = useMemo(() => new THREE.Raycaster(), []);
  const rayLeft = useMemo(() => new THREE.Raycaster(), []);
  const rayRight = useMemo(() => new THREE.Raycaster(), []);

  // Distancia mínima entre avatar y cualquier malla (en unidades del mundo)
  const COLLISION_BUFFER = 1.2;

  useEffect(() => {
    const checkPosition = setInterval(() => {
      if (playerRef.current && !initialized.current) {
        playerRef.current.position.set(startPosition[0], startPosition[1], startPosition[2]);
        initialized.current = true;
      }
    }, 50);

    return () => clearInterval(checkPosition);
  }, [playerRef, startPosition]);

  // 🔥 Helper: obtener todas las mallas colisionables de los modelos cargados
  const getCollidableMeshes = () => {
    const meshes = [];
    if (!collidersRef?.current) return meshes;
    collidersRef.current.forEach((obj) => {
      if (!obj) return;
      obj.traverse((child) => {
        if (child.isMesh && child.visible) {
          meshes.push(child);
        }
      });
    });
    return meshes;
  };

  // 🔥 Helper: verifica si hay una malla bloqueando en cierta dirección
  const isBlocked = (origin, direction, raycaster, meshes) => {
    if (meshes.length === 0) return false;
    raycaster.set(origin, direction);
    raycaster.far = COLLISION_BUFFER;
    const hits = raycaster.intersectObjects(meshes, false);
    return hits.length > 0 && hits[0].distance < COLLISION_BUFFER;
  };

  useFrame(() => {
    if (!playerRef.current) return;

    const speed = 0.3;

    const forward = keys.current['arrowup'] || keys.current['w'] || mobileControls?.forward;
    const back = keys.current['arrowdown'] || keys.current['s'] || mobileControls?.back;
    const left = keys.current['arrowleft'] || keys.current['a'] || mobileControls?.left;
    const right = keys.current['arrowright'] || keys.current['d'] || mobileControls?.right;

    // Rotación del avatar
    if (left && !right) {
      playerRef.current.rotation.y += 0.05;
    } else if (right && !left) {
      playerRef.current.rotation.y -= 0.05;
    }

    const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      playerRef.current.rotation.y
    );
    const backDir = forwardDir.clone().negate();

    // Origen del rayo: a la altura del "pecho" del avatar
    const rayOrigin = playerRef.current.position.clone();
    rayOrigin.y += 1.0;

    const collidableMeshes = getCollidableMeshes();

    // 🔥 Detectar si está cerca de algún modelo (para feedback UI)
    let nearModel = false;
    if (collidableMeshes.length > 0) {
      const checkRay = new THREE.Raycaster();
      for (const dir of [forwardDir, backDir]) {
        checkRay.set(rayOrigin, dir);
        checkRay.far = 3.5;
        const h = checkRay.intersectObjects(collidableMeshes, false);
        if (h.length > 0 && h[0].distance < 3.5) {
          nearModel = true;
          break;
        }
      }
    }
    if (onNearModel) onNearModel(nearModel);

    // Movimiento con chequeo de colisión dirección por dirección
    if (forward && !back) {
      if (!isBlocked(rayOrigin, forwardDir, rayForward, collidableMeshes)) {
        playerRef.current.position.addScaledVector(forwardDir, speed);
      }
    }
    if (back && !forward) {
      if (!isBlocked(rayOrigin, backDir, rayBack, collidableMeshes)) {
        playerRef.current.position.addScaledVector(forwardDir, -speed);
      }
    }

    // 🟢 SALTO
    if ((keys.current[' '] || mobileControls?.jump) && !isJumping.current) {
      velocityY.current = 0.5;
      isJumping.current = true;
    }

    // gravedad
    velocityY.current -= 0.02;
    playerRef.current.position.y += velocityY.current;

    // suelo
    if (playerRef.current.position.y <= 0) {
      playerRef.current.position.y = 0;
      velocityY.current = 0;
      isJumping.current = false;
    }

    // 🔒 LIMITES del mapa
    const LIMIT = 60;
    playerRef.current.position.x = Math.max(-LIMIT, Math.min(LIMIT, playerRef.current.position.x));
    playerRef.current.position.z = Math.max(-LIMIT, Math.min(LIMIT, playerRef.current.position.z));

    // 💡 LUZ SIGUE AL AVATAR
    if (lightRef.current) {
      lightRef.current.position.set(
        playerRef.current.position.x,
        playerRef.current.position.y + 3,
        playerRef.current.position.z
      );
    }
  });

  return (
    <>
      <pointLight ref={lightRef} intensity={2} />
      <Avatar3D ref={playerRef} url={url} startPosition={startPosition} />
    </>
  );
}
//Vision con soporte para múltiples modos
function CameraFollow({ target, viewMode = 'third-person' }) {
  const { camera } = useThree();
  const orbitState = useRef({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    distance: 15,
    isDragging: false
  });

  useEffect(() => {
    const onMouseDown = () => {
      orbitState.current.isDragging = true;
    };

    const onMouseUp = () => {
      orbitState.current.isDragging = false;
    };

    const onMouseMove = (e) => {
      if (!orbitState.current.isDragging || viewMode !== 'orbit') return;

      // 🎮 ÓRBITA MANUAL: usuario controla con mouse
      const deltaX = e.movementX * 0.005;
      const deltaY = e.movementY * 0.005;

      orbitState.current.theta -= deltaX;
      orbitState.current.phi -= deltaY;

      // Limitar phi entre 0.1 y Math.PI - 0.1
      orbitState.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbitState.current.phi));
    };

    const onWheel = (e) => {
      if (viewMode !== 'orbit') return;
      e.preventDefault();
      
      // 🎮 ZOOM con rueda del mouse
      orbitState.current.distance += e.deltaY * 0.01;
      orbitState.current.distance = Math.max(5, Math.min(50, orbitState.current.distance));
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
    };
  }, [viewMode]);

  useFrame(() => {
    if (!target.current) return;

    const pos = target.current.position;

    if (viewMode === 'first-person') {
      // 🎮 VISTA 1ERA PERSONA: cámara real humana
      const eyeHeight = 1.6;
      
      // Cámara en la cabeza del avatar
      camera.position.copy(pos).add(new THREE.Vector3(0, eyeHeight, 0));
      
      // La cámara mira en la DIRECCIÓN del avatar
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), target.current.rotation.y);
      const lookTarget = camera.position.clone().add(forward.multiplyScalar(10));
      camera.lookAt(lookTarget);
      
    } else if (viewMode === 'orbit') {
      // 🎮 VISTA ÓRBITA: controlada por el usuario
      const state = orbitState.current;
      const { theta, phi, distance } = state;
      
      // Convertir coordenadas esféricas a cartesianas
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      
      camera.position.set(
        pos.x + x * distance,
        pos.y + 3 + y * distance,
        pos.z + z * distance
      );
      
      camera.lookAt(pos.x, pos.y + 1.5, pos.z);
      
    } else {
      // 🎮 VISTA 3ERA PERSONA (por defecto)
      camera.position.lerp(
        new THREE.Vector3(pos.x + 10, pos.y + 8, pos.z + 10),
        0.1
      );
      camera.lookAt(pos);
    }
  });

  return null;
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

// Ground grid
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

// Loaded 3D Model from admin upload with support for multiple formats
const LoadedModel = React.forwardRef(({ url, onError, onLoaded }, ref) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    let loadedObject = null;
    
    const loadModel = async () => {
      if (!url) {
        setError('No URL provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Determine file format from URL
        const fileExtension = url.split('.').pop().toLowerCase().split('?')[0];
        
        // Import loaders dynamically based on format
        const THREE = await import('three');
        let loader;
        let scene;
        
        if (fileExtension === 'gltf' || fileExtension === 'glb') {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
          const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');

          const loader = new GLTFLoader();
          loader.setMeshoptDecoder(MeshoptDecoder);
          
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (gltf) => resolve(gltf),
              undefined,
              (error) => reject(error)
            );
          });
          
          scene = gltf.scene;
        } else if (fileExtension === 'fbx') {
          const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
          loader = new FBXLoader();
          
          scene = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (object) => resolve(object),
              undefined,
              (error) => reject(error)
            );
          });
        } else if (fileExtension === 'obj') {
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
          loader = new OBJLoader();
          
          scene = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (object) => resolve(object),
              undefined,
              (error) => reject(error)
            );
          });
        } else {
          throw new Error(`Formato de archivo no soportado: ${fileExtension}`);
        }
        
        if (!mounted) return;
        
        // Auto-calculate bounding box to preserve scale, but keep the GLB origin intact
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        
        // Mantener origen del archivo GLB: no centrar en X/Z ni en Y
        // Solo ajustar la escala si es necesario
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 60) {
          const scaleFactor = 60 / maxDim;
          scene.scale.setScalar(scaleFactor);
        } else if (maxDim < 10) {
          const scaleFactor = 30 / maxDim;
          scene.scale.setScalar(scaleFactor);
        }
        
        loadedObject = scene;
        setModel(scene);
        setLoading(false);
        if (onLoaded) onLoaded(scene);
        
      } catch (err) {
        console.error('Error loading 3D model:', err);
        if (mounted) {
          setError(err.message || 'Error al cargar el modelo 3D');
          setLoading(false);
          if (onError) onError(err);
        }
      }
    };
    
    loadModel();
    
    return () => {
      mounted = false;
      // Cleanup
      if (loadedObject) {
        loadedObject.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [url, onError, onLoaded]);

  if (error) {
    console.error('Model load error:', error);
    return null;
  }
  
  if (loading || !model) {
    return null;
  }

  return <primitive ref={ref} object={model} />;
});

// Escena principal con soporte para múltiples modelos
function Scene({ especialidades, selectedEspecialidad, onSelectEspecialidad, tarjetaPositions, activeModelUrls, onModelError, avatarUrl, mobileControls, viewMode, showCollisions, onNearModel }) {
  const defaultPositions = useMemo(() => [
    { x: -20, y: 2, z: 14 },
    { x: 20, y: 2, z: 14 },
    { x: 0, y: 2, z: -22 },
    { x: -16, y: 2, z: -14 },
    { x: 16, y: 2, z: -14 },
  ], []);
  const playerRef = useRef();
  const lastTriggeredRef = useRef(null);
  const collidersRef = useRef([]); // 🔥 Referencias REALES a los modelos (Object3D)
  
  // 🔥 Todos los modelos centrados en el mismo lugar
  const modelPositions = useMemo(() => {
    if (!activeModelUrls || activeModelUrls.length === 0) return [];
    
    // Todos los modelos en el CENTRO [0, 0, 0]
    return activeModelUrls.map(() => ({
      x: 0,
      y: 0,
      z: 0
    }));
  }, [activeModelUrls]);
  
  useFrame(() => {
    if (!playerRef.current) return;

    // Detección de proximidad a tarjetas de especialidad (sin cambios)
    especialidades.forEach((esp, index) => {
      const savedPos = tarjetaPositions.find(p => p.especialidad_id === esp.especialidad_id);
      const pos = savedPos?.position || defaultPositions[index];
      if (!pos) return;

      const dx = playerRef.current.position.x - pos.x;
      const dz = playerRef.current.position.z - pos.z;

      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 3) {
        if (lastTriggeredRef.current !== esp.especialidad_id) {
          lastTriggeredRef.current = esp.especialidad_id;
          onSelectEspecialidad(esp.especialidad_id);
        }
      } else {
        if (lastTriggeredRef.current === esp.especialidad_id) {
          lastTriggeredRef.current = null;
        }
      }
    });
    // 🔥 La detección de colisiones con modelos ahora se hace dentro del Player
    // usando raycasting por malla, lo cual permite al avatar caminar cerca/alrededor
    // del edificio respetando paredes reales en vez de una esfera envolvente.
  });
  
  return (
    <>
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 70, 200]} />
      
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={2}
      />
      <pointLight position={[0, 5, 5]} intensity={2} />
      <Stars radius={200} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <Ground />
      
      {/* 🔥 RENDERIZAR TODOS LOS MODELOS ACTIVOS */}
      {activeModelUrls && activeModelUrls.length > 0 ? (
        activeModelUrls.map((modelData, index) => (
          <group key={modelData.id} position={[modelPositions[index]?.x || 0, modelPositions[index]?.y || 0, modelPositions[index]?.z || 0]}>
            <Suspense fallback={null}>
              <LoadedModel 
                url={modelData.url} 
                onError={onModelError}
                ref={(ref) => {
                  if (ref) {
                    collidersRef.current[index] = ref;
                  }
                }}
              />
            </Suspense>
            {/* 🔥 DEBUG: Mostrar colisión si está activado */}
            {showCollisions && (
              <mesh position={[0, 5, 0]}>
                <sphereGeometry args={[8, 16, 16]} />
                <meshBasicMaterial color="red" wireframe transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        ))
      ) : (
        <CentralMonument />
      )}
      
      {especialidades.map((esp, index) => {
        const savedPos = tarjetaPositions.find(p => p.especialidad_id === esp.especialidad_id);
        const pos = savedPos?.position || defaultPositions[index] || { x: 0, y: 2, z: 0 };
        
        return (
          <SpecialtyCard3D
            key={esp.especialidad_id}
            especialidad={esp}
            position={[pos.x, pos.y+3, pos.z]}
            isSelected={selectedEspecialidad === esp.especialidad_id}
            onSelect={() => onSelectEspecialidad(esp.especialidad_id)}
          />
        );
      })}
      {avatarUrl && (
        <Player 
          playerRef={playerRef}
          url={avatarUrl}
          startPosition={[-45, 0, -45]}
          mobileControls={mobileControls} 
          collidersRef={collidersRef}
          onNearModel={onNearModel}
        />
      )}
      <CameraFollow target={playerRef} viewMode={viewMode} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        />
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
      className="glass absolute top-24 right-4 w-[90%] max-w-md max-h-[70vh] overflow-y-auto p-6 rounded-xl"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      
      data-testid="info-panel"
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full" data-testid="info-panel-close">
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
  const [activeModelUrls, setActiveModelUrls] = useState([]); // 🔥 Múltiples modelos
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [viewMode, setViewMode] = useState('third-person'); // 🔥 SISTEMA DE VISTAS
  const [showCollisions, setShowCollisions] = useState(false); // 🔥 Debug colisiones
  const [isNearModel, setIsNearModel] = useState(false); // 🔥 Avatar cerca de un modelo
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const [mobileControls, setMobileControls] = useState({
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [espRes, posRes, modelsRes] = await Promise.all([
          fetch(`${API_URL}/api/especialidades`),
          fetch(`${API_URL}/api/tarjetas/positions`),
          fetch(`${API_URL}/api/models/active`)
        ]);

        if (espRes.ok) setEspecialidades(await espRes.json());
        if (posRes.ok) setTarjetaPositions(await posRes.json());

        if (modelsRes.ok) {
          const modelsList = await modelsRes.json();
          // Render ALL active models, distributed around the scene
          if (modelsList && Array.isArray(modelsList) && modelsList.length > 0) {
            setActiveModelUrls(modelsList.map(model => ({
              id: model.model_id,
              url: `${API_URL}/api/models/file/${model.filename}`,
              filename: model.filename
            })));
            setModelLoading(true);
            setModelError(null);
          }
        }

        // 🔥 SOLO UN TRY PARA EL USUARIO
        try {
          const userRes = await fetch(`${API_URL}/api/auth/me`, {
            credentials: 'include'
          });

          if (userRes.ok) {
            const user = await userRes.json();

            setUserName(user.name?.split(' ')[0] || 'Visitante');

            // 🎯 LÓGICA DEL AVATAR
            const sexo = user.sexo?.toLowerCase();

            if (sexo === 'masculino') {
              setAvatarUrl(`${API_URL}/api/models/file/avatar_male.glb`);
            } else if (sexo === 'femenino') {
              setAvatarUrl(`${API_URL}/api/models/file/avatar_female.glb`);
            } else {
              setAvatarUrl(`${API_URL}/api/models/file/avatar_default.glb`);
            }

            console.log("Sexo:", sexo);
          }
        } catch (e) {
          console.error("Error usuario:", e);
        }

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

  const handleModelError = (error) => {
    console.error('Model loading error:', error);
    setModelError('Error al cargar el modelo 3D del plantel');
    setModelLoading(false);
  };

  const selectedEsp = especialidades.find(e => e.especialidad_id === selectedEspecialidad);

  return (
    <div className="h-screen bg-[#020408] relative overflow-hidden" data-testid="virtual-tour">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors glass px-4 py-2 rounded-full"
          data-testid="tour-back-btn"
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
          data-testid="tour-reset-btn"
        >
          <RotateCcw className="w-5 h-5 text-white/70" />
        </button>
      </nav>

      {/* 3D Canvas */}
      <div className="w-full h-full" data-testid="tour-canvas-container">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#00f0ff] mx-auto mb-4" />
              <p className="text-white/50">Cargando Tour Virtual...</p>
            </div>
          </div>
        ) : (
          <Canvas 
            camera={{ position: [30, 22, 30], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={() => setModelLoading(false)}
          >
            <Suspense fallback={null}>
              <Scene 
                especialidades={especialidades}
                selectedEspecialidad={selectedEspecialidad}
                onSelectEspecialidad={handleSelectEspecialidad}
                tarjetaPositions={tarjetaPositions}
                activeModelUrls={activeModelUrls}
                onModelError={handleModelError}
                avatarUrl={avatarUrl}
                mobileControls={mobileControls}
                viewMode={viewMode}
                showCollisions={showCollisions}
                onNearModel={setIsNearModel}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Model loading indicator */}
      {modelLoading && !modelError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-xl flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#00f0ff]" />
          <span className="text-white/70 text-sm">Cargando modelo 3D...</span>
        </div>
      )}

      {/* Model error indicator */}
      {modelError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 glass px-4 py-2 rounded-xl flex items-center gap-2 bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-400 text-sm">{modelError}</span>
        </div>
      )}

      {/* Info Panel */}
      <AnimatePresence>
        {selectedEsp && <InfoPanel especialidad={selectedEsp} onClose={() => setSelectedEspecialidad(null)} />}
      </AnimatePresence>

      {/* Controls help */}
      <div className="absolute bottom-4 left-4 glass px-4 py-3 rounded-xl text-sm text-white/50" data-testid="tour-controls-help">
        <p className="font-semibold text-white/70 mb-1">Controles:</p>
        <p>↑↓←→ Movimiento | ESPACIO Saltar</p>
        {viewMode === 'orbit' ? (
          <p>🖱️ Arrastra: Rotar | Scroll: Zoom</p>
        ) : (
          <p>Orbita: Arrastra para rotar | Scroll zoom</p>
        )}
      </div>
      {/* Legend */}
      <div className="absolute bottom-4 right-4 glass px-4 py-3 rounded-xl" data-testid="tour-legend">
        <p className="text-xs text-white/50 mb-2">Especialidades:</p>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {especialidades.map((esp) => (
            <button
              key={esp.especialidad_id}
              onClick={() => handleSelectEspecialidad(esp.especialidad_id)}
              className={`px-2 py-1 rounded-full text-xs transition-all ${selectedEspecialidad === esp.especialidad_id ? 'scale-110 ring-1' : ''}`}
              style={{ backgroundColor: `${esp.color}20`, color: esp.color }}
              data-testid={`legend-${esp.especialidad_id}`}
            >
              {esp.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Active model indicator */}
      {activeModelUrls && activeModelUrls.length > 0 && (
        <div className="absolute top-20 left-4 glass px-4 py-2 rounded-xl flex items-center gap-2">
          <Box className="w-4 h-4 text-[#ccff00]" />
          <span className="text-white/70 text-sm">{activeModelUrls.length} modelo(s) cargado(s)</span>
        </div>
      )}

      {/* 🔥 Indicador de proximidad al modelo */}
      {isNearModel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full flex items-center gap-2 border border-[#ccff00]/40"
        >
          <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
          <span className="text-[#ccff00] text-sm font-semibold">
            Estás cerca del edificio · Usa ↑↓←→ para rodearlo
          </span>
        </motion.div>
      )}

      {/* View Mode Selector */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-xl flex items-center gap-2">
        <select 
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
        >
          <option value="third-person" className="bg-gray-900">📷 3ª Persona</option>
          <option value="first-person" className="bg-gray-900">👁️ 1ª Persona</option>
          <option value="orbit" className="bg-gray-900">🔄 Órbita</option>
        </select>
      </div>

      {/* User */}
      <div className="absolute top-20 right-4 glass px-4 py-2 rounded-xl flex items-center gap-2" data-testid="tour-user-info">
        <User className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-white text-sm">{userName}</span>
      </div>
      {!selectedEsp && (
        <div className="absolute top-32 right-6 z-40 glass px-6 py-4 rounded-xl max-w-sm text-center animate-pulse">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent tracking-widest">
            PRÓXIMAMENTE
          </h2>
          <p className="mt-2 text-sm md:text-base text-white/60">
            Muy pronto se habilitarán nuevas funciones interactivas con el modelo de la Institucion en 3D.
          </p>
        </div>
      )}
    </div>
  );
}
