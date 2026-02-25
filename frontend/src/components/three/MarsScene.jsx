import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useStore } from '../../store/store';
import Terrain from './Terrain';
import Rover from './Rover';
import PathLine from './PathLine';
import { MAP_SIZE } from '../../simulation/mapData';

/**
 * Dynamic lighting: day → warm orange, night → dark blue
 */
function Lighting() {
    const ambRef = useRef();
    const sunRef = useRef();
    const tick = useStore((s) => s.tick);

    useFrame(() => {
        const cyclePos = tick % 48;
        const isDay = cyclePos < 32;

        if (isDay) {
            const p = cyclePos / 32;
            let sunIntensity;
            if (p < 0.08) sunIntensity = p / 0.08; // Sunrise
            else if (p > 0.92) sunIntensity = (1 - p) / 0.08; // Sunset
            else sunIntensity = 1;

            if (ambRef.current) {
                ambRef.current.intensity = 0.35 + sunIntensity * 0.2;
                ambRef.current.color.setHex(0xffd4a0);
            }
            if (sunRef.current) {
                sunRef.current.intensity = sunIntensity * 1.2;
                sunRef.current.color.setHex(p < 0.1 || p > 0.9 ? 0xff8844 : 0xffeedd);
                const angle = p * Math.PI;
                sunRef.current.position.set(
                    Math.cos(angle) * 40,
                    Math.sin(angle) * 50 + 5,
                    -15,
                );
            }
        } else {
            if (ambRef.current) {
                ambRef.current.intensity = 0.06;
                ambRef.current.color.setHex(0x222244);
            }
            if (sunRef.current) {
                sunRef.current.intensity = 0.03;
                sunRef.current.color.setHex(0x4444aa);
            }
        }
    });

    return (
        <>
            <ambientLight ref={ambRef} intensity={0.45} color="#ffd4a0" />
            <directionalLight ref={sunRef} intensity={1} position={[20, 40, -15]} castShadow />
            <hemisphereLight groundColor="#3a1505" intensity={0.15} />
        </>
    );
}

/**
 * Mars atmosphere: stars + fog
 */
function Atmosphere() {
    const tick = useStore((s) => s.tick);
    const isDay = (tick % 48) < 32;

    return (
        <>
            <Stars radius={120} depth={60} count={4000} factor={5} saturation={0} fade speed={0.5} />
            <fog attach="fog" args={[isDay ? '#c47040' : '#0a0512', 35, 90]} />
        </>
    );
}

export default function MarsScene() {
    const center = MAP_SIZE / 2 - 0.5;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Canvas
                camera={{ position: [center, 40, center + 35], fov: 45, near: 0.1, far: 250 }}
                shadows
                gl={{ antialias: true, toneMapping: 3 }} // ACESFilmic
                style={{ background: '#120808' }}
            >
                <Lighting />
                <Atmosphere />
                <Terrain />
                <Rover />
                <PathLine />
                <OrbitControls
                    target={[center, 0, center]}
                    maxDistance={90}
                    minDistance={4}
                    maxPolarAngle={Math.PI / 2.05}
                    enableDamping
                    dampingFactor={0.06}
                />
            </Canvas>
        </div>
    );
}
