import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Environment, Float } from '@react-three/drei';

const LiquidSphere = () => {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Sphere args={[1, 128, 128]} scale={2.4}>
                <MeshDistortMaterial
                    color="#1e293b" // Dark Navy/Slate base
                    attach="material"
                    distort={0.5} // Strength of the liquid distortion
                    speed={2} // Speed of the liquid movement
                    roughness={0.1} // Glossy
                    metalness={1} // Chrome
                    bumpScale={0.005}
                />
            </Sphere>
        </Float>
    );
};

export const LiquidMetal: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full bg-background">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <Suspense fallback={null}>
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={2} />
                    <directionalLight position={[-10, -10, -5]} intensity={1} color="#fbbf24" /> {/* Gold Accent Light */}

                    {/* Environment for Chrome Reflections */}
                    <Environment preset="city" />

                    {/* The Molten Core */}
                    <LiquidSphere />

                    {/* Controls (Optional, disabled for background use usually, but good for debug) */}
                    {/* <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} /> */}
                </Suspense>
            </Canvas>

            {/* Scanline Overlay for Tech Feel (Optional) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
        </div>
    );
};
