import React, { useRef, useMemo, Component, type ReactNode, useEffect, useState } from 'react';
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
  const geo = new THREE.SphereGeometry(2.6, 64, 44);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    x *= 1.40;
    y *= 0.86;
    z *= 0.88;

    const fold =
      Math.sin(x * 3.0) * Math.cos(y * 2.6) * Math.sin(z * 3.0) * 0.22 +
      Math.sin(x * 6.0) * Math.cos(z * 4.8) * 0.08 +
      Math.sin(y * 4.8) * Math.cos(x * 3.8) * 0.10;

    const len = Math.sqrt(x * x + y * y + z * z);
    const s = (len + fold) / len;
    x *= s; y *= s * 0.9; z *= s;

    if (Math.abs(x) < 0.5 && y > 0.3) {
      y -= (0.5 - Math.abs(x)) * 0.28 * (y / 2.4);
    }
    if (z > 1.1 && y > -0.4) {
      z += 0.14 * Math.max(0, y + 0.4);
    }
    if (y < -1.5 && z < -0.3) {
      y += 0.3;
      x *= 0.75;
    }

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ── Soft circular particle texture ────────────────────────────────────
function makeCircleTex() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ── Custom shader for cursor-reactive particles ───────────────────────
const particleVertex = /* glsl */`
  attribute float aSeed;
  uniform float uTime;
  uniform vec3 uCursor;
  uniform float uHover;
  uniform float uPixelRatio;

  varying float vGlow;
  varying float vMix;

  void main() {
    vec3 p = position;

    // Idle gentle floating motion
    float t = uTime;
    vec3 wobble = vec3(
      sin(t * 0.7 + aSeed * 6.0),
      cos(t * 0.6 + aSeed * 5.3),
      sin(t * 0.5 + aSeed * 4.1)
    ) * 0.02;
    p += wobble;

    // Cursor distance in object space (uCursor already passed in object-local coords)
    float d = distance(p, uCursor);

    // Ripple wave propagating outward from cursor
    float wave = sin(d * 4.0 - t * 3.0) * exp(-d * 0.6);
    float falloff = smoothstep(2.5, 0.0, d);
    float push = falloff * (0.18 + 0.12 * uHover) + wave * 0.06 * falloff;

    // Vertex displacement away from cursor along normal direction
    vec3 dir = normalize(p - uCursor + vec3(0.0001));
    p += dir * push;

    // Breathing pulse
    p *= 1.0 + sin(t * 0.9) * 0.012;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);

    // Size: bigger near cursor + on hover
    float baseSize = 5.0 + sin(t * 2.0 + aSeed * 8.0) * 1.0;
    float boost = falloff * (8.0 + 6.0 * uHover);
    gl_PointSize = (baseSize + boost) * uPixelRatio * (300.0 / -mv.z);

    // Glow intensity for fragment
    vGlow = falloff * (0.6 + 0.6 * uHover);
    vMix = falloff;

    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragment = /* glsl */`
  uniform sampler2D uTex;
  uniform float uTime;

  varying float vGlow;
  varying float vMix;

  void main() {
    vec4 tex = texture2D(uTex, gl_PointCoord);
    if (tex.a < 0.02) discard;

    // Base orange → bright yellow-white near cursor
    vec3 baseColor = vec3(1.0, 0.38, 0.04);
    vec3 hotColor  = vec3(1.0, 0.92, 0.55);
    vec3 col = mix(baseColor, hotColor, clamp(vMix * 1.4, 0.0, 1.0));

    // Add subtle hue shift over time
    col += vec3(0.0, 0.05, 0.0) * sin(uTime * 0.6);

    float intensity = (0.85 + vGlow) * tex.a;
    gl_FragColor = vec4(col * intensity, tex.a);
  }
`;

// ── Edge glow shader for connecting lines ─────────────────────────────
const edgeVertex = /* glsl */`
  uniform float uTime;
  uniform vec3 uCursor;
  uniform float uHover;
  varying float vDist;

  void main() {
    vec3 p = position;
    float d = distance(p, uCursor);
    float falloff = smoothstep(2.5, 0.0, d);
    vec3 dir = normalize(p - uCursor + vec3(0.0001));
    p += dir * falloff * (0.12 + 0.1 * uHover);
    vDist = falloff;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const edgeFragment = /* glsl */`
  uniform float uTime;
  varying float vDist;
  void main() {
    vec3 base = vec3(1.0, 0.32, 0.02);
    vec3 hot  = vec3(1.0, 0.85, 0.4);
    vec3 col = mix(base, hot, vDist);
    float alpha = 0.55 + vDist * 0.4;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ── Main brain mesh ───────────────────────────────────────────────────
function BrainMesh({
  mouseNDC,
  hoverRef,
}: {
  mouseNDC: React.RefObject<{ x: number; y: number }>;
  hoverRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const cursorObj = useRef(new THREE.Vector3(99, 99, 99));
  const hoverSmoothed = useRef(0);

  const brainGeo = useMemo(() => buildBrainGeometry(), []);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(brainGeo, 14), [brainGeo]);
  const circleTex = useMemo(() => makeCircleTex(), []);

  // Per-vertex random seed for particle variation
  const particleGeo = useMemo(() => {
    const g = brainGeo.clone();
    const count = g.attributes.position.count;
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [brainGeo]);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCursor: { value: new THREE.Vector3(99, 99, 99) },
    uHover: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uTex: { value: circleTex },
  }), [circleTex]);

  const edgeUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCursor: { value: new THREE.Vector3(99, 99, 99) },
    uHover: { value: 0 },
  }), []);

  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const tmpVec = useMemo(() => new THREE.Vector2(), []);
  const planeForRay = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const worldHit = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Idle rotation + parallax
    const mx = mouseNDC.current?.x ?? 0;
    const my = mouseNDC.current?.y ?? 0;
    const idleY = t * 0.05;
    targetRot.current.x = my * 0.14;
    targetRot.current.y = idleY + mx * 0.18;
    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.04;
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.04;
    groupRef.current.rotation.x = currentRot.current.x;
    groupRef.current.rotation.y = currentRot.current.y;

    const breathe = 1 + Math.sin(t * 0.6) * 0.018;
    groupRef.current.scale.setScalar(breathe);

    // Cursor → world point on z=0 plane → object-local coords
    tmpVec.set(mx, my);
    raycaster.setFromCamera(tmpVec, camera);
    raycaster.ray.intersectPlane(planeForRay, worldHit);
    cursorObj.current.copy(worldHit);
    groupRef.current.worldToLocal(cursorObj.current);

    // Smooth hover
    const targetHover = hoverRef.current ?? 0;
    hoverSmoothed.current += (targetHover - hoverSmoothed.current) * 0.08;

    particleUniforms.uTime.value = t;
    particleUniforms.uCursor.value.copy(cursorObj.current);
    particleUniforms.uHover.value = hoverSmoothed.current;

    edgeUniforms.uTime.value = t;
    edgeUniforms.uCursor.value.copy(cursorObj.current);
    edgeUniforms.uHover.value = hoverSmoothed.current;
  });

  return (
    <group ref={groupRef}>
      {/* Inner volumetric glow */}
      <mesh>
        <sphereGeometry args={[2.1, 24, 18]} />
        <meshBasicMaterial
          color={new THREE.Color(0.55, 0.08, 0.0)}
          transparent opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cursor-reactive wireframe edges */}
      <lineSegments geometry={edgesGeo}>
        <shaderMaterial
          uniforms={edgeUniforms}
          vertexShader={edgeVertex}
          fragmentShader={edgeFragment}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Cursor-reactive glowing particles at vertices */}
      <points geometry={particleGeo}>
        <shaderMaterial
          uniforms={particleUniforms}
          vertexShader={particleVertex}
          fragmentShader={particleFragment}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ── Floating ambient sparks ───────────────────────────────────────────
function AmbientSparks() {
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => makeCircleTex(), []);

  const { positions, colors, original } = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.6 + Math.random() * 3.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 1.6;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.9;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.8;
      colors[i * 3]     = 1.0;
      colors[i * 3 + 1] = 0.18 + Math.random() * 0.45;
      colors[i * 3 + 2] = 0.02;
    }
    return { positions, colors, original: positions.slice() };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const p = ref.current.geometry.attributes.position;
    const count = p.count;
    for (let i = 0; i < count; i++) {
      p.setX(i, original[i * 3]     + Math.sin(t * 0.28 + i * 0.72) * 0.08);
      p.setY(i, original[i * 3 + 1] + Math.cos(t * 0.22 + i * 0.55) * 0.10);
      p.setZ(i, original[i * 3 + 2] + Math.sin(t * 0.18 + i * 0.91) * 0.05);
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color"    count={colors.length / 3}    array={colors}    itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        vertexColors
        transparent opacity={0.85}
        size={0.13}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────
function Scene({ hoverRef }: { hoverRef: React.RefObject<number> }) {
  const mouseNDC = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.4;
  }, [gl]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseNDC.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <>
      <ambientLight intensity={0.04} />
      <pointLight position={[4, 1, 3]}   intensity={5}  color="#ff5500" decay={2} />
      <pointLight position={[-4, 2, -2]} intensity={3}  color="#ff7700" decay={2} />
      <pointLight position={[0, -3, 2]}  intensity={2}  color="#aa2200" decay={2} />

      <BrainMesh mouseNDC={mouseNDC} hoverRef={hoverRef} />
      <AmbientSparks />
    </>
  );
}

// ── Fallback ──────────────────────────────────────────────────────────
const FallbackBrain = () => (
  <div className="absolute inset-0 z-0 pointer-events-none" style={{
    backgroundImage: "url('/images/brain-hero.png')",
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    opacity: 0.85,
    filter: 'brightness(1.4) saturate(1.3)',
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
  const [webglOk] = useState(() =>
    typeof window === 'undefined' ? false : isWebGLAvailable()
  );
  const hoverRef = useRef(0);

  if (!webglOk) return <FallbackBrain />;

  return (
    <WebGLErrorBoundary fallback={<FallbackBrain />}>
      <div
        className="absolute inset-0 z-0"
        style={{ pointerEvents: 'auto' }}
        onMouseEnter={() => { hoverRef.current = 1; }}
        onMouseLeave={() => { hoverRef.current = 0; }}
      >
        <Canvas
          camera={{ position: [0, 0.2, 7.4], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.4;
          }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Scene hoverRef={hoverRef} />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
