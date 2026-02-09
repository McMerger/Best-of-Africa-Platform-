import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

interface GemstoneProps {
    type: 'explorer' | 'professional' | 'corporate';
    className?: string;
}

const GemMesh: React.FC<{ type: 'explorer' | 'professional' | 'corporate' }> = ({ type }) => {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!mesh.current) return;
        mesh.current.rotation.y += 0.005;
        mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    });

    const config = {
        explorer: {
            geometry: <dodecahedronGeometry args={[1, 0]} />, // Rougher
            color: "#3b82f6", // Blue
            roughness: 0.2,
        },
        professional: {
            geometry: <octahedronGeometry args={[1, 0]} />, // Cleaner
            color: "#10b981", // Emerald
            roughness: 0.1,
        },
        corporate: {
            geometry: <icosahedronGeometry args={[1, 0]} />, // Complex
            color: "#D4AF37", // Gold/Diamond
            roughness: 0.05,
        }
    }[type];

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={mesh}>
                {config.geometry}
                <MeshTransmissionMaterial
                    backside
                    samples={4}
                    thickness={0.5}
                    chromaticAberration={0.4}
                    anisotropy={0.3}
                    distortion={0.1}
                    distortionScale={0.3}
                    temporalDistortion={0.5}
                    iridescence={1}
                    iridescenceIOR={1}
                    iridescenceThicknessRange={[0, 1400]}
                    roughness={config.roughness}
                    color={config.color}
                    metalness={0.1}
                />
            </mesh>
        </Float>
    );
};

export const Gemstone: React.FC<GemstoneProps> = ({ type, className }) => {
    return (
        <div className={className}>
            <Canvas camera={{ position: [0, 0, 3], fov: 45 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Environment preset="studio" />
                <GemMesh type={type} />
            </Canvas>
        </div>
    );
};
