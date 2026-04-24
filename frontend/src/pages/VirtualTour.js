import React, { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import * as THREE from 'three';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';
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

if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

const API_URL = process.env.REACT_APP_BACKEND_URL;

/** Referencia estable para no disparar efectos del avatar al re-renderizar (p. ej. al abrir panel de especialidad). */
const AVATAR_SPAWN_POSITION = Object.freeze([-45, 0, -45]);

/** Radio aproximado del avatar en el plano XZ (rayos / márgenes). */
const PLAYER_COLLISION_RADIUS = 0.85;
/** Altura del torso para rayos de pared (desde los pies del grupo jugador). */
const PLAYER_WAIST_Y = 1.0;
/** Normales con |Y| mayores se tratan como suelo/ rampa, no como pared. */
const WALL_NORMAL_Y_CUTOFF = 0.55;
/** Sonda vertical debajo de los pies (evita chocar con techos por encima). */
const GROUND_RAY_START_ABOVE_FEET = 0.4;
const GROUND_RAY_LENGTH = 200;

const _rayOrigin = new THREE.Vector3();
const _rayDir = new THREE.Vector3();
const _worldNormal = new THREE.Vector3();
const _boxTmp = new THREE.Box3();
const _scratchGround = [];
const _scratchWall = [];

function ensureGeometryBVH(mesh) {
  const g = mesh.geometry;
  if (!g || g.boundsTree) return;
  if (!g.boundingBox) g.computeBoundingBox();
  if (!g.boundingSphere) g.computeBoundingSphere();
  try {
    g.computeBoundsTree();
  } catch {
    /* geometría vacía o no indexada */
  }
}

/** Una sola vez al cargar modelos / suelo: lista de mallas + AABB mundo (sin recalcular cada frame). */
function rebuildCollisionMeshList(modelsRef, activeModelsCount, floorMesh, outMeshes) {
  outMeshes.length = 0;
  for (let i = 0; i < activeModelsCount; i++) {
    const root = modelsRef?.current?.[i];
    if (!root) continue;
    root.updateMatrixWorld(true);
    root.traverse((child) => {
      if (!child.isMesh || !child.geometry || !child.visible) return;
      ensureGeometryBVH(child);
      _boxTmp.setFromObject(child);
      child.userData._colWorldBox = _boxTmp.clone();
      outMeshes.push(child);
    });
  }
  if (floorMesh) {
    floorMesh.updateMatrixWorld(true);
    ensureGeometryBVH(floorMesh);
    _boxTmp.setFromObject(floorMesh);
    floorMesh.userData._colWorldBox = _boxTmp.clone();
    outMeshes.push(floorMesh);
  }
}

function filterMeshesForGround(all, px, pz, py, out) {
  out.length = 0;
  const margin = 1.25;
  for (let i = 0; i < all.length; i++) {
    const m = all[i];
    const b = m.userData._colWorldBox;
    if (!b) continue;
    if (b.min.x - margin > px || b.max.x + margin < px || b.min.z - margin > pz || b.max.z + margin < pz) continue;
    if (b.max.y < py - 4) continue;
    out.push(m);
  }
  return out;
}

function filterMeshesForWallX(all, ox, oy, oz, sign, far, out) {
  out.length = 0;
  const pad = 1.5;
  const segMinX = sign > 0 ? ox : ox - far;
  const segMaxX = sign > 0 ? ox + far : ox;
  const segMinZ = oz - pad;
  const segMaxZ = oz + pad;
  const yLo = oy + PLAYER_WAIST_Y - 1.2;
  const yHi = oy + PLAYER_WAIST_Y + 1.2;
  for (let i = 0; i < all.length; i++) {
    const m = all[i];
    const b = m.userData._colWorldBox;
    if (!b) continue;
    if (b.max.x < segMinX || b.min.x > segMaxX) continue;
    if (b.max.z < segMinZ || b.min.z > segMaxZ) continue;
    if (b.max.y < yLo || b.min.y > yHi) continue;
    out.push(m);
  }
  return out;
}

function filterMeshesForWallZ(all, ox, oy, oz, sign, far, out) {
  out.length = 0;
  const pad = 1.5;
  const segMinZ = sign > 0 ? oz : oz - far;
  const segMaxZ = sign > 0 ? oz + far : oz;
  const segMinX = ox - pad;
  const segMaxX = ox + pad;
  const yLo = oy + PLAYER_WAIST_Y - 1.2;
  const yHi = oy + PLAYER_WAIST_Y + 1.2;
  for (let i = 0; i < all.length; i++) {
    const m = all[i];
    const b = m.userData._colWorldBox;
    if (!b) continue;
    if (b.max.z < segMinZ || b.min.z > segMaxZ) continue;
    if (b.max.x < segMinX || b.min.x > segMaxX) continue;
    if (b.max.y < yLo || b.min.y > yHi) continue;
    out.push(m);
  }
  return out;
}

function worldNormalFromHit(hit) {
  return _worldNormal
    .copy(hit.face.normal)
    .transformDirection(hit.object.matrixWorld)
    .normalize();
}

/** Primera superficie bajo los pies (rayo corto desde justo encima del jugador). */
function raycastGroundY(x, y, z, meshes, raycaster) {
  if (!meshes.length) return null;
  _rayOrigin.set(x, y + GROUND_RAY_START_ABOVE_FEET, z);
  _rayDir.set(0, -1, 0);
  raycaster.set(_rayOrigin, _rayDir);
  raycaster.far = GROUND_RAY_LENGTH;
  const hits = raycaster.intersectObjects(meshes, false);
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (h.point.y > y + 0.5) continue;
    return h.point.y;
  }
  return null;
}

/**
 * Rayo horizontal en X o Z. true = bloqueado (pared).
 * Ignora superficies casi horizontales (suelo / bordes de losa).
 */
function axisWallBlocked(px, py, pz, axis, sign, distance, meshes, raycaster) {
  if (!meshes.length || distance < 1e-6) return false;
  const far = distance + PLAYER_COLLISION_RADIUS + 0.08;
  _rayOrigin.set(px, py + PLAYER_WAIST_Y, pz);
  if (axis === 'x') _rayOrigin.x += sign * 0.06;
  else _rayOrigin.z += sign * 0.06;
  _rayDir.set(axis === 'x' ? sign : 0, 0, axis === 'z' ? sign : 0);
  raycaster.set(_rayOrigin, _rayDir);
  raycaster.far = far;
  const hits = raycaster.intersectObjects(meshes, false);
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i];
    if (h.distance > far - 1e-4) continue;
    const n = worldNormalFromHit(h);
    if (Math.abs(n.y) > WALL_NORMAL_Y_CUTOFF) continue;
    return true;
  }
  return false;
}

/**
 * Resuelve la posición XZ del jugador contra cajas alineadas a ejes (world space).
 * Cada caja es el AABB del modelo; se infla en XZ por el radio del jugador (Minkowski en el plano).
 * Varias iteraciones reducen quedarse atascado entre dos cajas.
 */
function resolvePlayerXZAgainstBoxes(position, boxes, radius, iterations = 4) {
  if (!boxes.length) return;
  const p = position;
  for (let iter = 0; iter < iterations; iter++) {
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b];
      const minX = box.min.x - radius;
      const maxX = box.max.x + radius;
      const minZ = box.min.z - radius;
      const maxZ = box.max.z + radius;
      if (p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ) {
        const dLeft = p.x - minX;
        const dRight = maxX - p.x;
        const dDown = p.z - minZ;
        const dUp = maxZ - p.z;
        const m = Math.min(dLeft, dRight, dDown, dUp);
        if (m === dLeft) p.x = minX;
        else if (m === dRight) p.x = maxX;
        else if (m === dDown) p.z = minZ;
        else p.z = maxZ;
      }
    }
  }
}

/** AABB aproximado (world) para el monumento decorativo cuando no hay modelo GLB del plantel. */
const CENTRAL_MONUMENT_COLLISION_BOX = new THREE.Box3(
  new THREE.Vector3(-10, 0, -10),
  new THREE.Vector3(10, 13, 10)
);

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
const Avatar3D = React.forwardRef(({ url, startPosition = AVATAR_SPAWN_POSITION }, ref) => {
  const [model, setModel] = useState();
  const spawnOnceRef = useRef(null);
  if (spawnOnceRef.current === null) {
    spawnOnceRef.current = [startPosition[0], startPosition[1], startPosition[2]];
  }

  useEffect(() => {
    const load = async () => {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      loader.load(url, (gltf) => {
        const scene = gltf.scene;

        // 🔥 escala
        scene.scale.set(.5, .5, .5);

        // 🔥 crear contenedor para el avatar
        const group = new THREE.Group();
        group.add(scene);

        const sp = spawnOnceRef.current;
        group.position.set(sp[0], sp[1], sp[2]);

        // 🔥 levanta el avatar para que no quede bajo el suelo
        const box = new THREE.Box3().setFromObject(scene);
        scene.position.y = -box.min.y;

        setModel(group);
      });
    };

    load();
  }, [url]);

  if (!model) return null;

  return <primitive ref={ref} object={model} />;
});
//Movimiento del Avatar
function Player({
  url,
  playerRef,
  startPosition = AVATAR_SPAWN_POSITION,
  mobileControls,
  modelsRef,
  activeModelsCount,
  floorMeshRef,
  especialidades,
  tarjetaPositions,
  defaultPositions,
  onSelectEspecialidad,
  lastTriggeredRef,
}) {
  const keys = useKeyboard();
  const lightRef = useRef();
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster();
    r.firstHitOnly = true;
    return r;
  }, []);
  const collisionMeshesCache = useRef([]);
  const collisionCacheSig = useRef('');

  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const initialized = useRef(false);
  const spawnOnceRef = useRef(null);
  if (spawnOnceRef.current === null) {
    spawnOnceRef.current = [startPosition[0], startPosition[1], startPosition[2]];
  }

  useEffect(() => {
    const checkPosition = setInterval(() => {
      if (playerRef.current && !initialized.current) {
        const sp = spawnOnceRef.current;
        playerRef.current.position.set(sp[0], sp[1], sp[2]);
        initialized.current = true;
      }
    }, 50);

    return () => clearInterval(checkPosition);
  }, [playerRef]);

  useFrame(() => {
    if (!playerRef.current) return;

    const speed = 0.3;
    const pos = playerRef.current.position;

    const forward = keys.current['arrowup'] || mobileControls?.forward;
    const back = keys.current['arrowdown'] || mobileControls?.back;
    const left = keys.current['arrowleft'] || mobileControls?.left;
    const right = keys.current['arrowright'] || mobileControls?.right;

    // Rotación del avatar
    if (left && !right) {
      playerRef.current.rotation.y += 0.05;
    } else if (right && !left) {
      playerRef.current.rotation.y -= 0.05;
    }

    const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      playerRef.current.rotation.y
    );

    const useMeshController = activeModelsCount > 0;
    if (!useMeshController) {
      collisionMeshesCache.current.length = 0;
      collisionCacheSig.current = '';
    }
    if (useMeshController) {
      let sig = `${activeModelsCount}`;
      for (let i = 0; i < activeModelsCount; i++) {
        const r = modelsRef?.current?.[i];
        sig += r ? `,${r.uuid}` : ',0';
      }
      sig += `|${floorMeshRef?.current?.uuid ?? '-'}`;
      if (sig !== collisionCacheSig.current) {
        rebuildCollisionMeshList(
          modelsRef,
          activeModelsCount,
          floorMeshRef?.current ?? null,
          collisionMeshesCache.current
        );
        collisionCacheSig.current = sig;
      }
    }
    const collisionMeshes = collisionMeshesCache.current;

    let moveX = 0;
    let moveZ = 0;
    if (forward && !back) {
      moveX += direction.x * speed;
      moveZ += direction.z * speed;
    }
    if (back && !forward) {
      moveX -= direction.x * speed;
      moveZ -= direction.z * speed;
    }

    if (useMeshController) {
      if (collisionMeshes.length) {
        const py = pos.y;
        if (moveX !== 0) {
          const sx = Math.sign(moveX);
          const far = Math.abs(moveX) + PLAYER_COLLISION_RADIUS + 0.08;
          filterMeshesForWallX(collisionMeshes, pos.x, py, pos.z, sx, far, _scratchWall);
          if (!axisWallBlocked(pos.x, py, pos.z, 'x', sx, Math.abs(moveX), _scratchWall, raycaster)) {
            pos.x += moveX;
          }
        }
        if (moveZ !== 0) {
          const sz = Math.sign(moveZ);
          const far = Math.abs(moveZ) + PLAYER_COLLISION_RADIUS + 0.08;
          filterMeshesForWallZ(collisionMeshes, pos.x, py, pos.z, sz, far, _scratchWall);
          if (!axisWallBlocked(pos.x, py, pos.z, 'z', sz, Math.abs(moveZ), _scratchWall, raycaster)) {
            pos.z += moveZ;
          }
        }
      } else {
        if (moveX !== 0) pos.x += moveX;
        if (moveZ !== 0) pos.z += moveZ;
      }
    } else {
      if (moveX !== 0) pos.x += moveX;
      if (moveZ !== 0) pos.z += moveZ;
    }

    // 🟢 SALTO
    if ((keys.current[' '] || mobileControls?.jump) && !isJumping.current) {
      velocityY.current = 0.3;
      isJumping.current = true;
    }

    velocityY.current -= 0.02;
    pos.y += velocityY.current;

    if (useMeshController) {
      if (collisionMeshes.length) {
        filterMeshesForGround(collisionMeshes, pos.x, pos.z, pos.y, _scratchGround);
        const gy = raycastGroundY(pos.x, pos.y, pos.z, _scratchGround, raycaster);
        if (gy != null) {
          if (pos.y < gy - 0.02) {
            pos.y = gy;
            velocityY.current = Math.max(0, velocityY.current);
            isJumping.current = false;
          } else if (pos.y <= gy + 0.12 && velocityY.current <= 0) {
            pos.y = gy;
            velocityY.current = 0;
            isJumping.current = false;
          }
        } else if (pos.y < 0) {
          pos.y = 0;
          velocityY.current = 0;
          isJumping.current = false;
        }
      } else if (pos.y <= 0) {
        pos.y = 0;
        velocityY.current = 0;
        isJumping.current = false;
      }
    } else {
      if (pos.y <= 0) {
        pos.y = 0;
        velocityY.current = 0;
        isJumping.current = false;
      }
    }

    // 🔒 LIMITES
    const LIMIT = 30;
    pos.x = Math.max(-LIMIT, Math.min(LIMIT, pos.x));
    pos.z = Math.max(-LIMIT, Math.min(LIMIT, pos.z));

    if (!useMeshController) {
      const obstacleBoxes = [CENTRAL_MONUMENT_COLLISION_BOX];
      resolvePlayerXZAgainstBoxes(pos, obstacleBoxes, PLAYER_COLLISION_RADIUS);
    }

    // Proximidad a tarjetas de especialidades (usa posición ya resuelta)
    especialidades.forEach((esp, index) => {
      const savedPos = tarjetaPositions.find((p) => p.especialidad_id === esp.especialidad_id);
      const pos = savedPos?.position || defaultPositions[index] || { x: 0, y: 2, z: 0 };

      const dx = playerRef.current.position.x - pos.x;
      const dz = playerRef.current.position.z - pos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 3) {
        if (lastTriggeredRef.current !== esp.especialidad_id) {
          lastTriggeredRef.current = esp.especialidad_id;
          onSelectEspecialidad(esp.especialidad_id);
        }
      } else if (lastTriggeredRef.current === esp.especialidad_id) {
        lastTriggeredRef.current = null;
      }
    });

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
      <pointLight ref={lightRef} intensity={3.4} distance={22} decay={1.6} color="#f8fbff" />
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

// Ground grid (plano en Y=0 para raycast de apoyo alineado con los pies del avatar)
function Ground({ floorMeshRef }) {
  return (
    <group>
      <gridHelper args={[140, 70, '#00f0ff', '#1a1a3a']} position={[0, 0, 0]} />
      <mesh ref={floorMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#040812" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Loaded 3D Model from admin upload with support for multiple formats
const LoadedModel = React.forwardRef(function LoadedModel({ url, onError }, ref) {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
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

        // Algunos visores muestran terrenos "bien" porque fuerzan doble cara o son
        // más tolerantes con materiales/normales. En Three.js una cara puede
        // desaparecer si el winding/normales del export no viene consistente.
        scene.traverse((child) => {
          if (!child.isMesh || !child.geometry) return;

          child.frustumCulled = false;
          child.geometry.computeBoundingBox();
          child.geometry.computeBoundingSphere();

          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }

          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (!material) return;
            material.side = THREE.DoubleSide;
            material.shadowSide = THREE.DoubleSide;
            material.needsUpdate = true;
          });
        });
        
        loadedObject = scene;
        setModel(scene);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading 3D model:', err);
        if (mounted) {
          setError(err.message || 'Error al cargar el modelo 3D');
          setLoading(false);
          if (onErrorRef.current) onErrorRef.current(err);
        }
      }
    };
    
    loadModel();
    
    return () => {
      mounted = false;
      // Cleanup
      if (loadedObject) {
        loadedObject.traverse((child) => {
          if (child.geometry) {
            if (typeof child.geometry.disposeBoundsTree === 'function') {
              child.geometry.disposeBoundsTree();
            }
            child.geometry.dispose();
          }
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
  }, [url]);

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
function Scene({ especialidades, selectedEspecialidad, onSelectEspecialidad, tarjetaPositions, activeModelUrls, onModelError, avatarUrl, mobileControls, viewMode }) {
  const defaultPositions = useMemo(() => [
    { x: -20, y: 2, z: 14 },
    { x: 20, y: 2, z: 14 },
    { x: 0, y: 2, z: -22 },
    { x: -16, y: 2, z: -14 },
    { x: 16, y: 2, z: -14 },
  ], []);
  const playerRef = useRef();
  const lastTriggeredRef = useRef(null);
  const modelsRef = useRef([]); // 🔥 Guardar referencias a modelos
  const floorMeshRef = useRef(null);

  // Mantener arreglo de refs consistente aunque haya re-renders (evita frames con null).
  useEffect(() => {
    const len = activeModelUrls?.length || 0;
    if (modelsRef.current.length !== len) modelsRef.current.length = len;
  }, [activeModelUrls]);

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
  
  return (
    <>
      <color attach="background" args={['#020408']} />
      <fog attach="fog" args={['#020408', 70, 200]} />
      
      <ambientLight intensity={1.8} color="#f4f8ff" />
      <hemisphereLight args={['#dbeafe', '#2b3444', 1.5]} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={3.2}
        color="#fff7ed"
      />
      <directionalLight
        position={[-14, 12, -10]}
        intensity={2.2}
        color="#dbeafe"
      />
      <pointLight position={[0, 10, 0]} intensity={2.8} distance={120} decay={1.5} color="#ffffff" />
      <pointLight position={[0, 18, 0]} intensity={2.2} distance={140} decay={1.2} color="#cfe7ff" />
      <Stars radius={200} depth={60} count={3000} factor={4} saturation={0} fade speed={1} />
      
      <Ground floorMeshRef={floorMeshRef} />
      
      {/* 🔥 RENDERIZAR TODOS LOS MODELOS ACTIVOS */}
      {activeModelUrls && activeModelUrls.length > 0 ? (
        activeModelUrls.map((modelData, index) => (
          <group key={modelData.id} position={[modelPositions[index]?.x || 0, modelPositions[index]?.y || 0, modelPositions[index]?.z || 0]}>
            <Suspense fallback={null}>
              <LoadedModel
                url={modelData.url}
                onError={onModelError}
                ref={(r) => {
                  // React puede llamar el ref con null entre renders; no lo sobrescribimos para
                  // que la colisión no "pierda" el modelo por 1 frame.
                  if (r) modelsRef.current[index] = r;
                }}
              />
            </Suspense>
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
          startPosition={AVATAR_SPAWN_POSITION}
          mobileControls={mobileControls}
          modelsRef={modelsRef}
          activeModelsCount={activeModelUrls?.length || 0}
          floorMeshRef={floorMeshRef}
          especialidades={especialidades}
          tarjetaPositions={tarjetaPositions}
          defaultPositions={defaultPositions}
          onSelectEspecialidad={onSelectEspecialidad}
          lastTriggeredRef={lastTriggeredRef}
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

  const handleSelectEspecialidad = useCallback((espId) => {
    setSelectedEspecialidad(prev => prev === espId ? null : espId);
  }, []);

  const handleModelError = useCallback((error) => {
    console.error('Model loading error:', error);
    setModelError('Error al cargar el modelo 3D del plantel');
    setModelLoading(false);
  }, []);

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
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.4;
              gl.outputColorSpace = THREE.SRGBColorSpace;
              setModelLoading(false);
            }}
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
