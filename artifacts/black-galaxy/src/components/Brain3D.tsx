import React, { useRef, useMemo, Component, type ReactNode, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ── Brain-shaped geometry ─────────────────────────────────────────────
function buildBrainGeometry() {
  // Use moderate subdivision so triangles are clearly visible (like the reference)
  const geo = new THREE.SphereGeometry(2.6, 38, 26);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Brain proportions: wide, not too tall, shallow depth
    x *= 1.40;
    y *= 0.86;
    z *= 0.88;

    // Gyri folds — subtle so wireframe triangles stay readable
    const fold =
      Math.sin(x * 3.0) * Math.cos(y * 2.6) * Math.sin(z * 3.0) * 0.22 +
      Math.sin(x * 6.0) * Math.cos(z * 4.8) * 0.08 +
      Math.sin(y * 4.8) * Math.cos(x * 3.8) * 0.10;

    const len = Math.sqrt(x * x + y * y + z * z);
    const s = (len + fold) / len;
    x *= s; y *= s * 0.9; z *= s;

    // Hemisphere crease at top center
    if (Math.abs(x) < 0.5 && y > 0.3) {
      y -= (0.5 - Math.abs(x)) * 0.28 * (y / 2.4);
    }

    // Frontal lobe bulge
    if (z > 1.1 && y > -0.4) {
      z += 0.14 * Math.max(0, y + 0.4);
    }

    // Cerebellum bump (bottom-back)
    if (y < -1.5 && z < -0.3) {
      y += 0.3;
      x *= 0.75;
    }

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ── Square particle texture ───────────────────────────────────────────
function makeSquareTex() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, 3, 10, 10);
  const t = new THREE.CanvasTexture(c);
  return t;
}

// ── Main brain mesh ───────────────────────────────────────────────────
function BrainMesh({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });

  const brainGeo = useMemo(() => buildBrainGeometry(), []);

  // Primary wireframe edges — threshold 14° keeps large triangles visible
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(brainGeo, 14), [brainGeo]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Slow idle rotation (y-axis only, so we keep the side-profile look)
    const idleY = t * 0.05;

    // Mouse parallax target
    const mx = mouse.current?.x ?? 0;
    const my = mouse.current?.y ?? 0;
    targetRot.current.x = my * 0.14;
    targetRot.current.y = idleY + mx * 0.18;

    // Smooth lerp
    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.04;
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.04;

    groupRef.current.rotation.x = currentRot.current.x;
    groupRef.current.rotation.y = currentRot.current.y;

    // Subtle breathing scale
    const breathe = 1 + Math.sin(t * 0.6) * 0.018;
    groupRef.current.scale.setScalar(breathe);
  });

  return (
    <group ref={groupRef}>
      {/* Deep inner volume glow — dark orange, barely visible through mesh */}
      <mesh>
        <sphereGeometry args={[2.1, 18, 14]} />
        <meshBasicMaterial
          color={new THREE.Color(0.55, 0.08, 0.0)}
          transparent opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Main wireframe edges — orange, NOT white-washing */}
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial
          color={new THREE.Color(1.0, 0.38, 0.02)}
          transparent opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Bright vertex nodes — hot yellow-orange at intersections */}
      <points geometry={brainGeo}>
        <pointsMaterial
          size={0.07}
          color={new THREE.Color(1.0, 0.72, 0.12)}
          transparent opacity={0.95}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ── Scattered square sparks (like the reference image) ────────────────
function SquareParticles() {
  const ref = useRef<THREE.Points>(null);
  const squareTex = useMemo(() => makeSquareTex(), []);

  const { positions, colors } = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute in a flattened sphere around the brain
      const r = 3.6 + Math.random() * 3.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.7;

      // Warm orange-red colour range
      colors[i * 3]     = 1.0;
      colors[i * 3 + 1] = 0.15 + Math.random() * 0.45;
      colors[i * 3 + 2] = 0.0;
    }
    return { positions, colors };
  }, []);

  const orig = useMemo(() => positions.slice(), [positions]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const p = ref.current.geometry.attributes.position;
    for (let i = 0; i < 180; i++) {
      p.setX(i, orig[i * 3]     + Math.sin(t * 0.28 + i * 0.72) * 0.06);
      p.setY(i, orig[i * 3 + 1] + Math.cos(t * 0.22 + i * 0.55) * 0.07);
      p.setZ(i, orig[i * 3 + 2] + Math.sin(t * 0.18 + i * 0.91) * 0.04);
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={180} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color"    count={180} array={colors}    itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={squareTex}
        vertexColors
        transparent opacity={0.80}
        size={0.11}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  );
}

// ── Scene setup ───────────────────────────────────────────────────────
function Scene() {
  const mouse = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  useEffect(() => {
    // Lower exposure keeps orange orange — doesn't blow out to white
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.35;
  }, [gl]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <>
      <ambientLight intensity={0.02} />
      {/* Warm side fill — positions lights to match a side-lit brain */}
      <pointLight position={[4, 1, 3]}   intensity={5}  color="#ff5500" decay={2} />
      <pointLight position={[-4, 2, -2]} intensity={3}  color="#ff7700" decay={2} />
      <pointLight position={[0, -3, 2]}  intensity={2}  color="#aa2200" decay={2} />

      <BrainMesh mouse={mouse} />
      <SquareParticles />
    </>
  );
}

// ── Fallback ──────────────────────────────────────────────────────────
const FallbackBrain = () => (
  <div className="absolute inset-0 z-0 pointer-events-none" style={{
    backgroundImage: "url('/images/brain-hero.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.9,
    filter: 'brightness(1.5) saturate(1.3)',
  }} />
);

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch { return false; }
}

// ── Export ────────────────────────────────────────────────────────────
export function Brain3D() {
  const [webglOk] = React.useState(() =>
    typeof window === 'undefined' ? false : isWebGLAvailable()
  );
  if (!webglOk) return <FallbackBrain />;

  return (
    <WebGLErrorBoundary fallback={<FallbackBrain />}>
      <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
        <Canvas
          camera={{ position: [0, 0.2, 7.4], fov: 60 }}
          style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);      // pure black background
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.35;
          }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Scene />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
