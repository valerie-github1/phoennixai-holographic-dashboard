import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { VehicleModel } from './VehicleModel';
import { DriveMode } from '../types';
import { MAX_SPEED } from '../constants';

const random = (min: number, max: number) => Math.random() * (max - min) + min;

interface SceneProps {
  speed: number;
  mode: DriveMode;
}

// Helper hook for smooth speed interpolation
// Decouples visual frame rate from React state update rate
const useSmoothedSpeed = (targetSpeed: number) => {
    const currentSpeed = useRef(targetSpeed);
    useFrame((state, delta) => {
        // Lerp towards target speed for smoothness
        currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, delta * 2.5);
    });
    return currentSpeed;
};

// 1. DYNAMIC ROAD (Grid + Split Lanes)
const DynamicRoad = ({ speedRef }: { speedRef: React.MutableRefObject<number> }) => {
  const gridRef = useRef<THREE.InstancedMesh>(null);
  const laneRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const gridCount = 60;
  const gridSpacing = 4;
  const gridTotalLength = gridCount * gridSpacing;
  const gridZ = useRef(new Float32Array(gridCount));
  
  // Lane settings
  const laneRows = 30;
  const laneSpacing = 8;
  const laneTotalLength = laneRows * laneSpacing;
  const totalLanes = laneRows * 2; // Left and Right side
  const laneZ = useRef(new Float32Array(laneRows));

  useMemo(() => {
    // Init Grid Z positions
    for(let i=0; i<gridCount; i++) gridZ.current[i] = -20 + i * -gridSpacing;
    // Init Lane Z positions
    for(let i=0; i<laneRows; i++) laneZ.current[i] = -10 + i * -laneSpacing;
  }, []);

  useFrame((state, delta) => {
    // Use smoothed speed ref
    const speed = speedRef.current;
    const moveSpeed = Math.max(0.5, speed * 0.8);

    // Animate Grid (The Floor)
    if (gridRef.current) {
        for(let i=0; i<gridCount; i++) {
            gridZ.current[i] += moveSpeed * delta;
            // Seamless loop: if it passes camera (z>10), move to back based on total length
            if (gridZ.current[i] > 10) gridZ.current[i] -= gridTotalLength;

            dummy.position.set(0, -0.1, gridZ.current[i]);
            dummy.rotation.x = -Math.PI / 2;
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            gridRef.current.setMatrixAt(i, dummy.matrix);
        }
        gridRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate Side Lanes (Left and Right)
    if (laneRef.current) {
        for(let i=0; i<laneRows; i++) {
            laneZ.current[i] += moveSpeed * delta;
            if (laneZ.current[i] > 10) laneZ.current[i] -= laneTotalLength;

            const z = laneZ.current[i];

            // LEFT Lane Marker
            dummy.position.set(-4, 0.02, z);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            laneRef.current.setMatrixAt(i, dummy.matrix);

            // RIGHT Lane Marker
            dummy.position.set(4, 0.02, z);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            laneRef.current.setMatrixAt(i + laneRows, dummy.matrix);
        }
        laneRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
        {/* Glowing Grid Floor */}
        <instancedMesh ref={gridRef} args={[undefined, undefined, gridCount]}>
            <planeGeometry args={[80, 0.1]} />
            <meshBasicMaterial color="#1e293b" transparent opacity={0.2} />
        </instancedMesh>
        
        {/* Side Lane Markers */}
        <instancedMesh ref={laneRef} args={[undefined, undefined, totalLanes]}>
            <boxGeometry args={[0.15, 0.05, 4]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} toneMapped={false} />
        </instancedMesh>
        
        {/* Infinite dark plane below to hide glitches */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.2, 0]}>
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial color="#020617" />
        </mesh>
    </group>
  );
};

// 2. STRAIGHT TUNNEL LIGHTS
const DynamicTunnel = ({ count = 40, speedRef, color }: { count?: number; speedRef: React.MutableRefObject<number>; color: string }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    // We need fixed spacing to loop perfectly, but randomized offsets are cooler.
    // Let's stick to randomized reset for organic feel, as tunnels aren't always perfectly periodic grids.
    const data = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            z: -random(10, 300),
            x: Math.random() > 0.5 ? 12 : -12, // Left or Right side
            y: 2 + Math.random() * 4,
            height: 4 + Math.random() * 10
        }));
    }, [count]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const speed = speedRef.current;
        const moveSpeed = Math.max(10, speed * 1.5);
        
        data.forEach((item, i) => {
            item.z += moveSpeed * delta;
            if(item.z > 20) item.z = -300; // Reset far back

            dummy.position.set(item.x, item.y, item.z);
            dummy.scale.set(0.2, item.height, 1);
            
            // Look slightly inward
            dummy.rotation.set(0, 0, item.x > 0 ? -0.1 : 0.1);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} toneMapped={false} />
        </instancedMesh>
    );
};

// 3. SPEED PARTICLES
const SpeedParticles = ({ speedRef, count = 100 }: { speedRef: React.MutableRefObject<number>, count?: number }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
        x: random(-20, 20),
        y: random(0, 10),
        z: random(-100, 20),
        len: random(0.5, 2)
    }));
  }, [count]);

  useFrame((state, delta) => {
      if(!mesh.current) return;
      const speed = speedRef.current;
      const moveSpeed = speed * 2; 
      
      particles.forEach((p, i) => {
          p.z += moveSpeed * delta;
          if(p.z > 10) p.z = -100;

          dummy.position.set(p.x, p.y, p.z);
          // Stretch with speed
          dummy.scale.set(0.05, 0.05, p.len * (Math.max(20, speed)/30)); 
          dummy.updateMatrix();
          mesh.current!.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="white" transparent opacity={0.4} />
      </instancedMesh>
  );
};

// 4. HOLOGRAPHIC OUTLINE
const HolographicOutline = ({ speedRef, color, children }: { speedRef: React.MutableRefObject<number>, color: string, children: React.ReactNode }) => {
  const group = useRef<THREE.Group>(null);
  
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    wireframe: true,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false // Glow brighter
  }), [color]);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const speed = speedRef.current;
    
    // Pulse opacity
    material.opacity = 0.05 + Math.sin(time * 8) * 0.02 + (speed/MAX_SPEED) * 0.1;
    material.color.set(color);
  });

  const scale = 1.02; // Tighter fit

  return (
    <group>
      {children}
      
      {/* The Holographic Shell */}
      <group ref={group}>
         <mesh position={[0, 0.4, 0]} scale={scale} material={material}><boxGeometry args={[1.9, 0.3, 4.2]} /></mesh>
         <mesh position={[0, 0.55, -1.2]} rotation={[0.05, 0, 0]} scale={scale} material={material}><boxGeometry args={[1.8, 0.15, 1.8]} /></mesh>
         <mesh position={[0, 0.8, 0.2]} scale={scale} material={material}><boxGeometry args={[1.5, 0.5, 2.0]} /></mesh>
         <mesh position={[0, 0.6, 1.6]} scale={scale} material={material}><boxGeometry args={[1.8, 0.2, 0.8]} /></mesh>
      </group>
    </group>
  );
};

// 5. CAR CONTAINER
const CarContainer = ({ speedRef, children }: { speedRef: React.MutableRefObject<number>, children: React.ReactNode }) => {
    const ref = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!ref.current) return;
        const speed = speedRef.current;
        
        // Micro-vibrations at high speed
        if (speed > 100) {
            const intensity = (speed - 100) / 10000;
            ref.current.position.x = (Math.random() - 0.5) * intensity;
            ref.current.position.y = (Math.random() - 0.5) * intensity;
        } else {
            ref.current.position.set(0, 0, 0);
        }
    });

    return <group ref={ref}>{children}</group>;
};

// 6. DYNAMIC CAMERA
const DynamicCamera = ({ speedRef }: { speedRef: React.MutableRefObject<number> }) => {
    const camRef = useRef<any>(null);
    const { viewport } = useThree();

    useFrame((state, delta) => {
        if (!camRef.current) return;
        const speed = speedRef.current;
        
        const isPortrait = viewport.aspect < 1.2;

        // Base position (pull back if portrait)
        const baseX = 0;
        const baseY = (isPortrait ? 5 : 4) - (speed/MAX_SPEED) * 1.5; 
        const baseZ = (isPortrait ? 18 : 12) - (speed/MAX_SPEED) * 4;
        
        // Camera Shake
        const shake = speed > 150 ? (Math.random() - 0.5) * 0.02 : 0;

        camRef.current.position.x = THREE.MathUtils.lerp(camRef.current.position.x, baseX + shake, delta * 2);
        camRef.current.position.y = THREE.MathUtils.lerp(camRef.current.position.y, baseY + shake, delta * 2);
        camRef.current.position.z = THREE.MathUtils.lerp(camRef.current.position.z, baseZ, delta * 0.5);

        camRef.current.lookAt(0, 1, -20);
    });

    return <PerspectiveCamera ref={camRef} makeDefault fov={55} />;
}

// --- SCENE CONTENT ---
// This component renders INSIDE the Canvas, so it can safely use R3F hooks.
const SceneContent: React.FC<SceneProps> = ({ speed, mode }) => {
  const speedRef = useSmoothedSpeed(speed);

  const accentColor = useMemo(() => {
     if (mode === DriveMode.SPORT) return '#f59e0b';
     if (mode === DriveMode.HYPER) return '#f43f5e';
     return '#06b6d4';
  }, [mode]);

  return (
    <>
      <DynamicCamera speedRef={speedRef} />
      
      <fog attach="fog" args={['#0f172a', 10, 80]} />

      <ambientLight intensity={0.2} color="#1e293b" />
      <pointLight position={[0, 10, 0]} intensity={1} color="#ffffff" distance={20} />
      <pointLight position={[-10, 2, 10]} intensity={2} color={accentColor} distance={30} />
      
      {/* Car */}
      <CarContainer speedRef={speedRef}>
          <HolographicOutline speedRef={speedRef} color={accentColor}>
            <VehicleModel speedRef={speedRef} mode={mode} />
          </HolographicOutline>
      </CarContainer>

      {/* World */}
      <DynamicRoad speedRef={speedRef} />
      <DynamicTunnel speedRef={speedRef} count={50} color={accentColor} />
      <SpeedParticles speedRef={speedRef} count={150} />
      
      <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.6} far={2} color="#000000" position={[0, 0.01, 0]} />
      
      <Environment preset="city" />

      {/* Post Processing for the "Holographic" Glow */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} radius={0.6} />
        <Noise opacity={0.05} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}

// --- MAIN SCENE WRAPPER ---
// This component renders the Canvas itself.
export const Scene: React.FC<SceneProps> = ({ speed, mode }) => {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}>
      <SceneContent speed={speed} mode={mode} />
    </Canvas>
  );
};