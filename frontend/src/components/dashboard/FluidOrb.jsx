/**
 * @fileoverview Fluid Orb WebGL Visualization Component
 * 
 * Animated 3D orb using React Three Fiber with custom GLSL shaders.
 * Creates dynamic color-shifting visual effects based on voice activity.
 * Features fan blade patterns and ripple effects for speaking indication.
 * 
 * @module components/dashboard/FluidOrb
 * @requires @react-three/fiber
 * @requires @react-three/drei
 * @requires three
 */

import { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Circle, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. Define the Custom Material Class
const ColorShiftMaterial = shaderMaterial(
    {
        uTime: 0,
        uIntensity: 0,
        uColor1: new THREE.Color("#22d3ee"), // Cyan
        uColor2: new THREE.Color("#1e3a8a"), // Deep Blue
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    void main() {
        vUv = uv;
        vec3 pos = position;
        // Subtle breathing effect
        float pulse = sin(uTime * 2.0) * 0.02 * uIntensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos * (1.0 + pulse), 1.0);
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor1;
    uniform vec3 uColor2;

    void main() {
        vec2 center = vec2(0.5);
        vec2 pos = vUv - center;
        float r = length(pos);
        float angle = atan(pos.y, pos.x);

        // "Fan" blades pattern - Higher frequency for sharper shards
        float fan = sin(angle * 12.0 + uTime * 2.0); 
        
        // "Water Flow" ripples
        float ripples = sin(r * 30.0 - uTime * 4.0);
        
        // Combine with sharper contrast
        float noise = fan * ripples;
        float activeNoise = noise * (1.0 + uIntensity * 2.0);

        // Radial gradient base
        vec3 baseColor = mix(uColor2, uColor1, r * 1.5);
        
        // Sharper Highlights
        // Use smoothstep to create hard edges on the shards
        float shardPattern = smoothstep(0.2, 0.8, activeNoise);
        vec3 finalColor = mix(baseColor, vec3(1.0), shardPattern * 0.5 * r);
        
        // Alpha Mask for Circle - Harder edge
        float alpha = smoothstep(0.5, 0.49, r);

        gl_FragColor = vec4(finalColor, alpha);
    }
    `
);

// 2. Register it with R3F
extend({ ColorShiftMaterial });

const AnimatedSphere = ({ isSpeaking, isConnected }) => {
    const materialRef = useRef();

    useFrame((state, delta) => {
        if (materialRef.current) {
            // Update time
            materialRef.current.uTime += delta;

            // Lerp intensity
            const targetIntensity = isSpeaking ? 1.0 : 0.0;
            materialRef.current.uIntensity = THREE.MathUtils.lerp(
                materialRef.current.uIntensity,
                targetIntensity,
                0.1
            );
        }
    });

    return (
        <Circle args={[1, 64]} scale={1.5}>
            {/* 3. Use the registered material declaratively */}
            <colorShiftMaterial
                ref={materialRef}
                transparent
                side={THREE.DoubleSide}
            />
        </Circle>
    );
};

const FluidOrb = ({ isSpeaking, isConnected }) => {
    return (
        <div className="w-full h-full">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <AnimatedSphere isSpeaking={isSpeaking} isConnected={isConnected} />
            </Canvas>
        </div>
    );
};

export default FluidOrb;
