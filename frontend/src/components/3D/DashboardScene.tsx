
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --------------------------------------------------------
// THE VISUAL IDEA: "Strategic Constellation"
// --------------------------------------------------------
// A 3D Network Graph representing Pan-African connectivity.
// Nodes = Regional Hubs (approximated from StrategicMap)
// Lines = Diplomatic/Data Channels
// Motion = Slow, majestic rotation (The "World" turning)
// --------------------------------------------------------

const REGIONS = [
    { id: 'North', position: [0, 1.8, 0] as [number, number, number] },      // Y-up for this scene
    { id: 'West', position: [-1.8, 0.6, 0.5] as [number, number, number] },
    { id: 'Central', position: [0, -0.2, 0] as [number, number, number] },
    { id: 'East', position: [2.0, 0.4, 0] as [number, number, number] },
    { id: 'Southern', position: [0.4, -2.0, 0] as [number, number, number] },
];

const NetworkGraph: React.FC = () => {
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = state.clock.getElapsedTime() * 0.05; // Slow rotation
        }
    });

    // Generate connections (All to Central, plus a ring)
    const points = useMemo(() => {
        const pts: [number, number, number][] = [];
        const central = REGIONS.find(r => r.id === 'Central')!.position;

        REGIONS.forEach(r => {
            if (r.id !== 'Central') {
                // Connect to Central
                pts.push(r.position);
                pts.push(central);

                // Connect to nearest neighbor (Ring effect)
                // Simplified manual connections for aesthetics
            }
        });

        // Add Ring connections
        pts.push(REGIONS[0].position, REGIONS[1].position); // North -> West
        pts.push(REGIONS[1].position, REGIONS[4].position); // West -> South
        pts.push(REGIONS[4].position, REGIONS[3].position); // South -> East
        pts.push(REGIONS[3].position, REGIONS[0].position); // East -> North

        return pts;
    }, []);

    return (
        <group ref={group}>
            {/* Regional Hubs */}
            {REGIONS.map((r, i) => (
                <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Sphere args={[0.18, 16, 16]} position={r.position}>
                        <meshStandardMaterial
                            color="#D4AF37" // Gold
                            emissive="#D4AF37"
                            emissiveIntensity={0.8}
                            roughness={0.1}
                            metalness={0.9}
                        />
                    </Sphere>
                    {/* Glow halo */}
                    <Sphere args={[0.35, 16, 16]} position={r.position}>
                        <meshBasicMaterial color="#D4AF37" transparent opacity={0.15} />
                    </Sphere>
                </Float>
            ))}

            {/* Connection Lines */}
            <Line
                worldUnits
                points={points}
                color="#051828" // Navy Lines
                lineWidth={2} // Thicker for visibility
                opacity={0.4}
                transparent
            />

            {/* Secondary Gold Lines (Data Flow) */}
            <Line
                worldUnits
                points={points}
                color="#D4AF37"
                lineWidth={1.5}
                opacity={0.25}
                transparent
                dashed
                dashScale={2}
                dashSize={1}
                gapSize={1}
            />
        </group>
    );
};

export const DashboardScene: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                <NetworkGraph />

                {/* Subtle Starfield for "Constellation" vibe */}
                <Stars radius={100} depth={50} count={2000} factor={6} saturation={0.5} fade speed={0.5} />
            </Canvas>
            {/* Radial Fade to focus on center content */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,var(--background)_90%)]" />
        </div>
    );
};
