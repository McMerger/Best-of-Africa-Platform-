import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface GemstoneProps {
    type: 'raw' | 'polished' | 'diamond';
    color?: string;
}

export const Gemstone: React.FC<GemstoneProps> = ({ type, color }) => {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!mesh.current) return;
        const t = state.clock.getElapsedTime();
        // Slow, premium rotation
        mesh.current.rotation.y = t * 0.2;
        mesh.current.rotation.z = Math.sin(t * 0.1) * 0.1;
    });

    const config = useMemo(() => {
        switch (type) {
            case 'raw':
                return {
                    geometry: <dodecahedronGeometry args={[1.2, 0]} />, // Low poly, rough look
                    roughness: 0.4,
                    transmission: 0.2,
                    thickness: 1,
                    defaultColor: '#a8a29e', // Stone-like
                    chromaticAberration: 0.05,
                    ior: 1.4
                };
            case 'polished':
                return {
                    geometry: <icosahedronGeometry args={[1.1, 0]} />,
                    roughness: 0.1,
                    transmission: 0.9,
                    thickness: 2,
                    defaultColor: '#fbbf24', // Amber
                    chromaticAberration: 0.2,
                    ior: 1.6
                };
            case 'diamond':
            default:
                return {
                    geometry: <octahedronGeometry args={[1, 0]} />,
                    roughness: 0,
                    transmission: 1,
                    thickness: 3,
                    defaultColor: '#ffffff', // Clear
                    chromaticAberration: 1, // High dispersion
                    ior: 2.4 // Diamond IOR
                };
        }
    }, [type]);

    return (
        <group>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={mesh}>
                    {config.geometry}
                    {/* MeshTransmissionMaterial is better for glass than standard MeshPhysicalMaterial */}
                    <MeshTransmissionMaterial
                        backside
                        samples={8} // Lower for performance, increase for quality
                        resolution={512}
                        transmission={config.transmission}
                        roughness={config.roughness}
                        thickness={config.thickness}
                        ior={config.ior}
                        chromaticAberration={config.chromaticAberration}
                        anisotropy={0.3}
                        distortion={0.1}
                        distortionScale={0.3}
                        temporalDistortion={0.1}
                        color={color || config.defaultColor}
                    />
                </mesh>
            </Float>
            <Environment preset="city" />
        </group>
    );
};
