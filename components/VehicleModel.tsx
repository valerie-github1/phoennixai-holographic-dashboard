import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { DriveMode } from '../types';

// Global JSX definitions for R3F elements used in this file
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      torusGeometry: any;
      primitive: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
    }
  }
}

interface VehicleModelProps {
  speedRef: React.MutableRefObject<number>;
  mode: DriveMode;
}

export const VehicleModel: React.FC<VehicleModelProps> = ({ speedRef, mode }) => {
  const group = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group>(null);
  
  // Dynamic colors based on drive mode
  const colors = useMemo(() => {
    switch (mode) {
      case DriveMode.SPORT: return { body: '#1a0505', glow: '#f59e0b' }; // Amber
      case DriveMode.HYPER: return { body: '#1a0510', glow: '#f43f5e' }; // Red
      default: return { body: '#020617', glow: '#06b6d4' }; // Cyan
    }
  }, [mode]);

  // FIX: Create material once per mode change, not every frame
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: colors.body,
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 0.2, // Slight see-through for holo feel
    thickness: 1,
    transparent: true,
    opacity: 0.9,
  }), [colors.body]);

  // Glowing Slats Material
  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
      color: colors.glow,
      toneMapped: false // Super bright glow with bloom
  }), [colors.glow]);

  // Edges props
  const edgeProps = useMemo(() => ({
    threshold: 15,
    color: colors.glow,
  }), [colors.glow]);

  useFrame((state, delta) => {
    if (!group.current || !wheelsRef.current) return;
    const speed = speedRef.current;

    // Wheel rotation
    const wheelSpeed = speed * delta * 0.15;
    wheelsRef.current.children.forEach((child) => {
      child.rotation.x += wheelSpeed;
    });

    // Suspension simulation
    const time = state.clock.elapsedTime;
    const vibration = (speed / 200) * 0.002;
    group.current.position.y = 0.55 + Math.sin(time * 20) * vibration + Math.sin(time * 2) * 0.01;
    
    // Tilt on acceleration
    group.current.rotation.x = Math.sin(time * 3) * 0.002;
  });

  const Wheel = ({ x, z }: { x: number, z: number }) => (
    <group position={[x, 0.35, z]}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      {/* Glowing Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.2, 0.02, 16, 32]} />
        <primitive object={glowMaterial} />
      </mesh>
      {/* Inner Rim Spokes */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 8]} />
        <meshBasicMaterial color={colors.glow} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );

  return (
    <group ref={group}>
      
      {/* --- BODY SCULPTING --- */}
      <group>
        {/* 1. Lower Chassis */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.9, 0.3, 4.2]} />
          <primitive object={bodyMaterial} />
          <Edges {...edgeProps} />
        </mesh>

        {/* 2. Hood */}
        <mesh position={[0, 0.55, -1.2]} rotation={[0.05, 0, 0]}>
          <boxGeometry args={[1.8, 0.15, 1.8]} />
          <primitive object={bodyMaterial} />
          <Edges {...edgeProps} />
        </mesh>

        {/* 3. Cabin */}
        <mesh position={[0, 0.8, 0.2]}>
          <boxGeometry args={[1.5, 0.5, 2.0]} />
          <primitive object={bodyMaterial} />
          <Edges {...edgeProps} />
        </mesh>

        {/* 4. Trunk */}
        <mesh position={[0, 0.6, 1.6]}>
          <boxGeometry args={[1.8, 0.2, 0.8]} />
          <primitive object={bodyMaterial} />
          <Edges {...edgeProps} />
        </mesh>

        {/* 5. Front Grill Area */}
        <mesh position={[0, 0.35, -2.15]}>
          <boxGeometry args={[1.8, 0.15, 0.1]} />
          <meshBasicMaterial color="#000" />
          {/* Glowing horizontal slats */}
          <group position={[0, 0, 0.06]}>
             <mesh position={[0, 0.03, 0]}>
                <boxGeometry args={[1.7, 0.01, 0.01]} />
                <primitive object={glowMaterial} />
             </mesh>
             <mesh position={[0, -0.03, 0]}>
                <boxGeometry args={[1.7, 0.01, 0.01]} />
                <primitive object={glowMaterial} />
             </mesh>
          </group>
        </mesh>

        {/* 6. Rear Light Bar */}
        <mesh position={[0, 0.6, 2.0]}>
          <boxGeometry args={[1.6, 0.05, 0.1]} />
          <primitive object={glowMaterial} />
        </mesh>

        {/* 7. Side Skirts (Glow) */}
        <mesh position={[0.95, 0.25, 0]}>
           <boxGeometry args={[0.05, 0.05, 2.5]} />
           <primitive object={glowMaterial} />
        </mesh>
        <mesh position={[-0.95, 0.25, 0]}>
           <boxGeometry args={[0.05, 0.05, 2.5]} />
           <primitive object={glowMaterial} />
        </mesh>

      </group>

      {/* --- WHEELS --- */}
      <group ref={wheelsRef}>
        <Wheel x={-1} z={-1.2} />
        <Wheel x={1} z={-1.2} />
        <Wheel x={-1} z={1.4} />
        <Wheel x={1} z={1.4} />
      </group>

      {/* Underglow fake shadow */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 4.6]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.15} />
      </mesh>
    </group>
  );
};