import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const ParticleField = ({ theme }: { theme: 'light' | 'dark' }) => {
    const ref = useRef<any>(null);
    const [particleData, setParticleData] = useState<{ positions: Float32Array, colors: Float32Array } | null>(null);

    useEffect(() => {
        const count = 2000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        // Light Mode: Darker Bronze/Gold (#B45309). Dark Mode: Amber/Gold (#fbbf24)
        const baseColor = theme === 'light' ? new THREE.Color("#B45309") : new THREE.Color("#fbbf24");
        const secondaryColor = theme === 'light' ? new THREE.Color("#78350f") : new THREE.Color("#fffbeb");

        for (let i = 0; i < count; i++) {
            const r = (Math.random() - 0.5) * 10;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.cos(theta) * Math.sin(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = (Math.random() - 0.5) * 5;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Mix colors
            const mixedColor = baseColor.clone().lerp(secondaryColor, Math.random() * 0.5);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        setParticleData({ positions, colors });
    }, [theme]);

    useFrame((_state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 30;
            ref.current.rotation.y -= delta / 40;
        }
    });

    if (!particleData) return null;

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={particleData.positions} colors={particleData.colors} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#fff"
                    vertexColors
                    size={0.03}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending}
                    opacity={theme === 'light' ? 0.6 : 1.0}
                />
            </Points>
        </group>
    );
};

export const GoldenPulse = ({ theme = 'dark', className }: { theme?: 'light' | 'dark', className?: string }) => {
    const prefersReducedMotion = useReducedMotion();

    // Static Fallback for Reduced Motion
    if (prefersReducedMotion) {
        return (
            <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className} ${theme === 'dark'
                ? 'bg-gradient-to-br from-black via-neutral-900 to-amber-950/20'
                : 'bg-gradient-to-br from-white via-amber-50/50 to-amber-100/20'
                }`}
            />
        );
    }

    return (
        <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className} ${theme === 'dark' ? 'bg-gradient-to-br from-black via-neutral-900 to-amber-950/30' : 'bg-transparent'}`}>
            <Canvas camera={{ position: [0, 0, 3], fov: 60 }} dpr={[1, 2]}>
                <Suspense fallback={null}>
                    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.2}>
                        <ParticleField theme={theme} />
                    </Float>
                    <ambientLight intensity={0.5} />
                </Suspense>
            </Canvas>
            {/* Vignette & Grain Overlay */}
            {theme === 'dark' && (
                <>
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
                </>
            )}
        </div>
    );
};
