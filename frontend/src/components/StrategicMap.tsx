import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder, MeshDistortMaterial, Float, Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// 3D mapping: X (Left/Right), Z (Up/Down/Depth) - Y is vertical height
// Calibrated to resemble Africa's shape
const REGIONS = [
    { id: 'North', position: [0, 0, -1.8] as [number, number, number], color: '#3b82f6' },      // Top (Egypt/Libya/Algeria)
    { id: 'West', position: [-1.8, 0, -0.6] as [number, number, number], color: '#fbbf24' },    // Left Bulge (Nigeria/Ghana/Senegal)
    { id: 'Central', position: [0, 0, 0.2] as [number, number, number], color: '#10b981' },     // Heart (DRC/Congo)
    { id: 'East', position: [2.0, 0, -0.4] as [number, number, number], color: '#ef4444' },     // The Horn (Kenya/Ethiopia/Somalia)
    { id: 'Southern', position: [0.4, 0, 2.0] as [number, number, number], color: '#8b5cf6' },  // The Tip (SA/Namibia) - slightly east
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

const HexPillar: React.FC<HexPillarProps & { isTop: boolean }> = ({ position, isActive, dataScale = 1, isTop, onClick, onHover, id }) => {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // Fix ref access: Use state for top position or calculate without ref if possible.
    // Actually, we know the height is 0.4.
    // The scale mod in useFrame changes the visual height.
    // We can just bind the Cap to the same scale logic or child of the scaled mesh?
    // Better: Make the Cap a child of the scaling mesh so it moves with it?
    // The Cylinder mesh scales on Y. If we put the Cap inside, it will stretch.
    // So we need to position the Cap based on the *current* scale of the Pillar.
    // We can use a ref for the Cap and update it in useFrame too.

    const capRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (!mesh.current) return;
        // Gentle pulses
        const hoverScale = hovered ? 1.1 : 1;
        const activeScale = isActive ? 1.2 : 1;

        // Base scale is derived from Data
        const targetScale = dataScale * hoverScale * activeScale;

        mesh.current.scale.y = THREE.MathUtils.lerp(mesh.current.scale.y, targetScale, 0.1);
        mesh.current.rotation.y += 0.005;

        // Update Cap position based on Pillar Scale
        if (capRef.current) {
            // Pillar Height is 0.4. Half height is 0.2.
            // Top face is at y = 0.2 * scale.y
            capRef.current.position.y = (0.2 * mesh.current.scale.y) + 0.025; // 0.025 is half cap height
            capRef.current.rotation.y = mesh.current.rotation.y;
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                <group
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={(e) => { e.stopPropagation(); setHover(true); onHover(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHover(false); onHover(false); }}
                >
                    {/* Main Pillar Body (Navy) */}
                    <Cylinder
                        ref={mesh as React.MutableRefObject<THREE.Mesh>}
                        args={[0.6, 0.6, 0.4, 6]} // RadiusTop, RadiusBottom, Height, Segments (6=Hex)
                        rotation={[0, Math.PI / 6, 0]} // Align pointed top
                    >
                        <MeshDistortMaterial
                            color={"#051828"} // Always Navy Body
                            speed={2}
                            distort={hovered ? 0.2 : 0}
                            radius={1}
                            roughness={0.3}
                            metalness={0.4}
                        />
                    </Cylinder>

                    {/* Gold Top Cap (if Top 3 or hovered) */}
                    {(isTop || hovered || isActive) && (
                        <Cylinder
                            ref={capRef as React.MutableRefObject<THREE.Mesh>}
                            args={[0.61, 0.61, 0.05, 6]} // Slightly wider, very thin
                            // Position updated in useFrame
                            rotation={[0, Math.PI / 6, 0]}
                        >
                            <meshStandardMaterial
                                color="#D4AF37"
                                roughness={0.1}
                                metalness={0.9}
                                emissive="#D4AF37"
                                emissiveIntensity={0.2}
                            />
                        </Cylinder>
                    )}

                    {/* Aesthetic Label */}
                    <Html position={[0, 1.2, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
                        <div
                            className={`pointer-events-none select-none transition-all duration-300 ${isActive || hovered ? 'scale-110 opacity-100' : 'scale-100 opacity-60'}`}
                        >
                            <div className={`
                                backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2
                                ${isActive ? 'bg-primary/90 border-primary/20 text-primary-foreground' : 'bg-background/80 border-border/50 text-foreground'}
                            `}>
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] font-serif whitespace-nowrap ${isActive ? 'text-white' : 'text-primary'}`}>
                                    {id}
                                </span>
                                {isTop && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                )}
                            </div>
                            {/* Connector Line (Visual only) */}
                            <div className={`h-4 w-px mx-auto ${isActive ? 'bg-primary/50' : 'bg-border/50'}`} />
                        </div>
                    </Html>
                </group>
            </Float>
        </group>
    );
};

import { useReducedMotion } from '@/hooks/useReducedMotion';

// ... (previous code remains until StrategicMap component)

export const StrategicMap: React.FC<StrategicMapProps> = ({
    selectedRegion,
    onSelectRegion,
    regionData
}) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="relative w-full h-[500px] bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden flex flex-col">
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Live Intelligence Map</div>
                <div className="text-2xl font-serif font-black text-foreground">Strategic Overview</div>
            </div>

            <Canvas
                camera={{ position: [0, 5, 8], fov: 45 }}
                className="flex-1"
                dpr={[1, 2]} // Cap DPR for performance
                frameloop={prefersReducedMotion ? 'demand' : 'always'} // Only render on demand if reduced motion
            >
                <ambientLight intensity={0.7} />
                <pointLight position={[10, 10, 10]} intensity={1.0} />
                <Environment preset="studio" />

                <group position={[0, -0.5, 0]} rotation={[0.4, 0, 0]}> {/* Tilt for Isometric feel */}
                    {REGIONS.map((region) => {
                        // Calculate height/intensity based on real data
                        const count = (regionData?.[region.id]?.countries?.length as number) || 5;
                        // Normalize count (approx 5 to 16) to scale (0.8 to 1.5)
                        const dataScale = 0.5 + (count / 20);

                        // Determine Rank (Top 3 get Gold Tops)
                        const allCounts = REGIONS.map(r => (regionData?.[r.id]?.countries?.length as number) || 0).sort((a, b) => b - a);
                        const isTop3 = count >= (allCounts[2] || 0) && count > 0;

                        return (
                            <HexPillar
                                key={region.id}
                                position={region.position}
                                color={isTop3 ? "#D4AF37" : "#051828"} // Gold for top, Navy for others
                                id={region.id}
                                isActive={selectedRegion === region.id}
                                dataScale={dataScale}
                                isTop={isTop3}
                                onClick={() => onSelectRegion(selectedRegion === region.id ? null : region.id)}
                                onHover={(state) => state && onSelectRegion(region.id)}
                            />
                        );
                    })}
                </group>

                <ContactShadows position={[0, -1, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
                { /* Disable auto-rotate if reduced motion */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={!prefersReducedMotion}
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 4}
                />
            </Canvas>

            {/* Diagrammatic Legend */}
            <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#051828]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Standard Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-sm shadow-[#D4AF37]/50"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">High Volume Interest</span>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 z-10 text-[10px] font-mono text-muted-foreground opacity-50">
                ROTATION: {prefersReducedMotion ? 'DISABLED (A11Y)' : 'LOCKED (ISOMETRIC)'}
            </div>
        </div>
    );
};

interface StrategicMapProps {
    onSelectRegion: (regionId: string | null) => void;
    selectedRegion: string | null;
    regionData?: Record<string, { countries: unknown[], ai_insight: string }>;
    intelligenceData?: {
        countries: { code: string; heat: number; sentiment: number; volume: number }[];
        global_pulse: { intensity: number };
    };
}

