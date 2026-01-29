import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface NodeProps {
  position: [number, number, number];
  connections: number[];
  allPositions: [number, number, number][];
}

function Node({ position, connections, allPositions }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  
  const lineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    connections.forEach((idx) => {
      if (allPositions[idx]) {
        points.push(new THREE.Vector3(...position));
        points.push(new THREE.Vector3(...allPositions[idx]));
      }
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [position, connections, allPositions]);
  
  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#0070a0" 
          emissive="#004968"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#2c90c9" opacity={0.4} transparent linewidth={1} />
      </lineSegments>
    </group>
  );
}

function MolecularStructure() {
  const groupRef = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    const positions: [number, number, number][] = [];
    const connections: number[][] = [];
    
    // Create a spherical distribution of nodes - réduit à 15 pour les performances
    for (let i = 0; i < 15; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 2;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions.push([x, y, z]);
      connections.push([]);
    }
    
    // Create connections between nearby nodes
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = new THREE.Vector3(...positions[i]).distanceTo(
          new THREE.Vector3(...positions[j])
        );
        if (dist < 2.5) {
          connections[i].push(j);
          connections[j].push(i);
        }
      }
    }
    
    return { positions, connections };
  }, []);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef}>
      {nodes.positions.map((pos, i) => (
        <Node 
          key={i} 
          position={pos} 
          connections={nodes.connections[i]}
          allPositions={nodes.positions}
        />
      ))}
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(50 * 3); // Réduit à 50 particules
    const vel: [number, number, number][] = [];
    
    for (let i = 0; i < 50; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      vel.push([
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.005
      ]);
    }
    
    return [pos, vel];
  }, []);
  
  useFrame(() => {
    if (particlesRef.current) {
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < 50; i++) {
        posArray[i * 3] += velocities[i][0];
        posArray[i * 3 + 1] += velocities[i][1];
        posArray[i * 3 + 2] += velocities[i][2];
        
        // Wrap around
        if (posArray[i * 3] > 10) posArray[i * 3] = -10;
        if (posArray[i * 3] < -10) posArray[i * 3] = 10;
        if (posArray[i * 3 + 1] > 10) posArray[i * 3 + 1] = -10;
        if (posArray[i * 3 + 1] < -10) posArray[i * 3 + 1] = 10;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        color="#1b9cca" 
        transparent 
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default function MolecularBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f9fa] via-white to-[#e8f4f8] animate-gradient" />
      
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#0070a0" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#2c90c9" />
        
        <MolecularStructure />
        <FloatingParticles />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/80 pointer-events-none" />
    </div>
  );
}
