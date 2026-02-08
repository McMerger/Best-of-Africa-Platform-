import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder, MeshDistortMaterial, Float, Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Layout mapping from the 2D SVG coords to 3D World Space
// Original: North(150,50), West(60,120), Central(150,120), East(240,120), Southern(150,190)
// 3D mapping: X -> X, Y -> Z (Depth)
const REGIONS = [
    { id: 'North', position: [0, 0.5, -1.2] as [number, number, number], color: '#3b82f6' },    // Top
    { id: 'West', position: [-1.4, 0, 0] as [number, number, number], color: '#fbbf24' },       // Left
    { id: 'Central', position: [0, 0, 0] as [number, number, number], color: '#10b981' },       // Center
    { id: 'East', position: [1.4, 0, 0] as [number, number, number], color: '#ef4444' },        // Right
    { id: 'Southern', position: [0, -0.5, 1.2] as [number, number, number], color: '#8b5cf6' }, // Bottom
];

interface HexPillarProps {
    position: [number, number, number];
    color: string;
    id: string;
    isActive: boolean;
    dataScale?: number;
    onClick: () => void;
    onHover: (state: boolean) => void;
}

const HexPillar: React.FC<HexPillarProps> = ({ position, color, isActive, dataScale = 1, onClick, onHover }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame(() => {
        if (!mesh.current) return;
        // Gentle pulses
        const hoverScale = hovered ? 1.1 : 1;
        const activeScale = isActive ? 1.2 : 1;

        // Base scale is derived from Data
        const targetScale = dataScale * hoverScale * activeScale;

        mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, targetScale, 0.1);
        mesh.current.rotation.y += 0.005; // Slow rotation for premium feel
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <Cylinder
                    ref={mesh as React.MutableRefObject<THREE.Mesh>}
                    args={[0.6, 0.6, 0.4, 6]} // RadiusTop, RadiusBottom, Height, Segments (6=Hex)
                    rotation={[0, Math.PI / 6, 0]} // Align pointed top
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={(e) => { e.stopPropagation(); setHover(true); onHover(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHover(false); onHover(false); }}
                >
                    <MeshDistortMaterial
                        color={hovered || isActive ? color : "#1e293b"}
                        speed={2}
                        distort={hovered ? 0.3 : 0}
                        radius={1}
                        roughness={0.1}
                        metalness={0.8}
                        emissive={hovered || isActive ? color : "#000000"}
                        emissiveIntensity={hovered || isActive ? 0.5 : 0}
                    />
                </Cylinder>
            </Float>
        </group>
    );
};

interface StrategicMapProps {
    onSelectRegion: (regionId: string | null) => void;
    selectedRegion: string | null;
    regionData?: Record<string, { countries: unknown[], ai_insight: string }>;
}

const Scene: React.FC<StrategicMapProps> = ({ onSelectRegion, selectedRegion, regionData }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Environment preset="city" />

            <group rotation={[-Math.PI / 4, 0, 0]}> {/* Tilt the whole map for ISO view */}
                {REGIONS.map((region) => {
                    // Calculate height/intensity based on real data
                    const count = (regionData?.[region.id]?.countries?.length as number) || 5;
                    // Normalize count (approx 5 to 16) to scale (0.8 to 1.5)
                    const dataScale = 0.5 + (count / 20);

                    return (
                        <HexPillar
                            key={region.id}
                            position={region.position}
                            color={region.color}
                            id={region.id}
                            isActive={selectedRegion === region.id}
                            dataScale={dataScale}
                            onClick={() => onSelectRegion(selectedRegion === region.id ? null : region.id)}
                            onHover={(state) => state && onSelectRegion(region.id)}
                        />
                    );
                })}
            </group>

            <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
            <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />
        </>
    );
};

export const StrategicMap: React.FC<StrategicMapProps> = (props) => {
    return (
        <div className="w-full h-full relative">
            <Canvas camera={{ position: [0, 4, 4], fov: 45 }}>
                <Suspense fallback={null}>
                    <Scene {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
};
