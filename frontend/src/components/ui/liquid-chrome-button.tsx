import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface LiquidChromeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    children?: React.ReactNode;
}

const LiquidRing = ({ isHovered, width = 3, height = 1, thickness = 0.1, radius = 0.5, border = 0.08 }: any) => {
    const mesh = useRef<THREE.Mesh>(null);
    const material = useRef<any>(null);

    // Create the Pill Ring Geometry dynamically
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();

        // Outer Pill
        const w = width / 2;
        const h = height / 2;
        const r = radius;

        shape.moveTo(-w + r, -h);
        shape.lineTo(w - r, -h);
        shape.quadraticCurveTo(w, -h, w, -h + r);
        shape.lineTo(w, h - r);
        shape.quadraticCurveTo(w, h, w - r, h);
        shape.lineTo(-w + r, h);
        shape.quadraticCurveTo(-w, h, -w, h - r);
        shape.lineTo(-w, -h + r);
        shape.quadraticCurveTo(-w, -h, -w + r, -h);

        // Inner Pill (Hole)
        const hole = new THREE.Path();
        const iw = w - border;
        const ih = h - border;
        const ir = Math.max(0, r - border); // Ensure radius doesn't invert

        hole.moveTo(-iw + ir, -ih);
        hole.lineTo(iw - ir, -ih);
        hole.quadraticCurveTo(iw, -ih, iw, -ih + ir);
        hole.lineTo(iw, ih - ir);
        hole.quadraticCurveTo(iw, ih, iw - ir, ih);
        hole.lineTo(-iw + ir, ih);
        hole.quadraticCurveTo(-iw, ih, -iw, ih - ir);
        hole.lineTo(-iw, -ih + ir);
        hole.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);

        shape.holes.push(hole);

        const extrudeSettings = {
            depth: thickness,
            bevelEnabled: true,
            bevelSegments: 4, // Smooth round bezel
            bevelSize: 0.05,
            bevelThickness: 0.05,
            curveSegments: 16 // Smooth curves
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [width, height, thickness, radius, border]);

    // Center geometry manually since ExtrudeGeometry is not centered by default
    useMemo(() => {
        geometry.center();
    }, [geometry]);

    useFrame(() => {
        if (!material.current) return;

        // Liquid Distortion Logic
        const targetDistort = isHovered ? 0.4 : 0.2;
        const targetTemproal = isHovered ? 0.5 : 0.1;
        const targetChrome = isHovered ? 0.8 : 0.4;

        material.current.distortion = THREE.MathUtils.lerp(material.current.distortion, targetDistort, 0.1);
        material.current.temporalDistortion = THREE.MathUtils.lerp(material.current.temporalDistortion, targetTemproal, 0.1);
        material.current.chromaticAberration = THREE.MathUtils.lerp(material.current.chromaticAberration, targetChrome, 0.1);
    });

    return (
        <mesh ref={mesh} geometry={geometry}>
            {/* The "Liquid Metal" Material - Tuned for Silver/White Chrome */}
            <MeshTransmissionMaterial
                ref={material}
                backside={false}
                samples={8}
                resolution={512}
                thickness={0.5}
                roughness={0.05} // Very polished
                ior={1.5} // Glass/Water index
                chromaticAberration={0.4} // High rainbow effect on edges
                anisotropy={0.5} // Brushed metal hint
                distortion={0.2} // Subtle liquid wobble
                distortionScale={0.5}
                temporalDistortion={0.1}
                color="#f0f0f0" // Silver/White base
                background={new THREE.Color(0x000000)} // Must be a color, used for transmission calculation? Actually best generic for transparency context
            />
        </mesh>
    );
};

export const LiquidChromeButton: React.FC<LiquidChromeButtonProps> = ({ className, text, children, ...props }) => {
    const [hovered, setHover] = useState(false);

    return (
        <div
            className={cn("relative inline-block w-56 h-16 group", className)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* HTML Button Content (Solid Background + Text) */}
            <button
                className="relative z-10 w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300 group-hover:bg-secondary/90 shadow-lg"
                {...props}
            >
                {text || children}
            </button>

            {/* 3D Liquid Border Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none scale-110"> {/* Scale up slightly to fit perfectly around the HTML button */}
                <Canvas camera={{ position: [0, 0, 4], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true }}>
                    <Suspense fallback={null}>
                        {/* Bright Studio Lighting for Chrome Reflections */}
                        <Environment preset="city" />
                        {/* Extra lights to catch the bevel edges */}
                        <pointLight position={[10, 10, 10]} intensity={1.5} color="white" />
                        <pointLight position={[-10, -10, 10]} intensity={0.5} color="#ccccff" />

                        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.0}>
                            <LiquidRing
                                isHovered={hovered}
                                width={4.2}    // Tuned to match w-56 (approx generic sizing, might need tweak)
                                height={1.3}   // Tuned to match h-16
                                radius={0.65}  // Matches rounded-full
                                border={0.1}   // Thickness of the liquid line
                            />
                        </Float>
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

