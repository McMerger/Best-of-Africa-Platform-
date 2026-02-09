import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from "@/lib/utils";

interface LiquidSphereProps {
    className?: string;
}

export const LiquidSphere: React.FC<LiquidSphereProps> = ({ className }) => {
    const sphereRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (sphereRef.current) {
            // Very slow, breathing rotation
            sphereRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.2;
            sphereRef.current.rotation.y = Math.cos(clock.getElapsedTime() * 0.15) * 0.2;
        }
    });

    return (
        <div className={cn("absolute inset-0 pointer-events-none -z-10 overflow-hidden", className)}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30 blur-3xl">
                {/* We use a simple CSS gradient fallback or overlay if needed, but here we just rely on the Canvas if we assume this is inside one. 
                    However, placing a full Canvas here might be heavy if not careful. 
                    The spec says "subtle liquid sphere". 
                    Let's check if we can reuse an existing Canvas or if this needs its own.
                    Given "Home Hero", we might want to put this IN the Home Hero code, 
                    OR provide a Canvas wrapper here.
                */}
            </div>
            {/* Real implementation needs R3F Canvas context. 
                For "Background Component", typically we just export the Mesh and let Parent handle Canvas, 
                OR export a full Canvas component. 
                Let's export a full isolated component for ease of integration.
            */}
        </div>
    );
};

// Internal 3D Part
export const LiquidSphereModel = () => {
    const materialRef = useRef<any>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.time = clock.getElapsedTime() * 0.5;
        }
    });

    return (
        <Sphere args={[1, 64, 64]} scale={2.5}>
            <MeshDistortMaterial
                ref={materialRef}
                color="#FFFFFF"
                attach="material"
                distort={0.4} // Strong distortion for liquid effect
                speed={1.5}
                roughness={0.2}
                metalness={0.9} // Chrome-like
                bumpScale={0.005}
                clearcoat={1}
                clearcoatRoughness={0.1}
                radius={1}
            />
        </Sphere>
    );
}
