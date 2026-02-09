
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Color, Vector2, ShaderMaterial } from 'three';

// ... (Shaders usually here, skipping for brevity in replacement if not changing)

const TopographyShader = {
    uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new Color('#020C17') }, // Midnight Navy (Base)
        uColorB: { value: new Color('#D4AF37') }, // Premium Gold (Highs)
        uMouse: { value: new Vector2(0, 0) },
        uResolution: { value: new Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;
      uniform vec2 uMouse;

      // Simple pseudo-random noise
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // 2D Noise
      float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vUv = uv;
        
        // Slow, organic movement
        float time = uTime * 0.1;
        
        // Elevation based on noise (Simulating Terrain)
        float elevation = noise(position.xy * 2.0 + time);
        elevation += noise(position.xy * 4.0 - time * 0.5) * 0.5;
        
        // Mouse interaction (Subtle parallax/disturbance)
        float dist = distance(uv, uMouse);
        elevation += smoothstep(0.5, 0.0, dist) * 0.1;

        vElevation = elevation;

        vec3 newPos = position;
        newPos.z += elevation * 0.5; // Height scaling

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vElevation;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      void main() {
        // Mix colors based on elevation (Gold peaks, Navy valleys)
        float mixStrength = smoothstep(-0.2, 0.8, vElevation);
        vec3 color = mix(uColorA, uColorB, mixStrength);
        
        // Add a subtle "shimmer" grain
        float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        color += grain * 0.03;

        gl_FragColor = vec4(color, 1.0);
      }
    `
};

const Landscape = () => {
    const mesh = useRef<any>(null);
    const material = useRef<ShaderMaterial>(null);
    const mouse = useRef(new Vector2(0, 0));

    // Update Uniforms
    useFrame(({ clock, pointer }) => {
        if (material.current) {
            // Smooth time
            material.current.uniforms.uTime.value = clock.getElapsedTime();

            // LERP mouse for smooth interaction
            mouse.current.lerp(pointer, 0.05);
            // Convert pointer (-1 to 1) to UV space approx (0 to 1) for shader
            const uvMouse = new Vector2((mouse.current.x + 1) / 2, (mouse.current.y + 1) / 2);
            material.current.uniforms.uMouse.value = uvMouse;
        }

        // Gentle rotation
        if (mesh.current) {
            mesh.current.rotation.z = clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 4, 0, 0]} scale={1.5}>
            {/* High segment plane for smooth displacement */}
            <planeGeometry args={[6, 6, 128, 128]} />
            <shaderMaterial
                ref={material}
                args={[TopographyShader]}
                transparent
            />
        </mesh>
    );
};

export const HeroBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 2], fov: 75 }}>
                <Landscape />
            </Canvas>
            {/* Vignette Overlay for Cinematic Feel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)]" />
        </div>
    );
};
