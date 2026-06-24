import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const morphVertexShader = `
uniform float uTime;
uniform float uMorphRatio;
uniform float uDissolve;

attribute vec3 targetPosition;
attribute float aPhase;

varying float vDissolve;
varying vec3 vColor;

// Simplex noise function
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  // Morph between current and target position
  vec3 morphed = mix(position, targetPosition, uMorphRatio);

  // Add subtle wave movement
  morphed.x += sin(uTime + position.y * 3.0) * 0.05;

  // Compute dissolve noise
  float noiseVal = snoise(vec3(morphed.xy * 10.0, uTime * 0.1));
  float dissolve = clamp(noiseVal + uDissolve * 2.0 - 1.0, 0.0, 1.0);
  vDissolve = dissolve;

  // Color: morph through umber -> gold -> alabaster
  vec3 umber = vec3(0.48, 0.24, 0.13);
  vec3 gold = vec3(0.86, 0.76, 0.52);
  vec3 alabaster = vec3(0.94, 0.94, 0.94);
  float cycle = clamp(1.0 - abs(mod(aPhase, 3.0) - fract(uTime * 0.1) * 3.0), 0.0, 1.0);
  vec3 col = mix(mix(umber, alabaster, cycle), mix(alabaster, gold, cycle), cycle);
  vColor = col;

  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(morphed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const morphFragmentShader = `
varying float vDissolve;
varying vec3 vColor;

void main() {
  if (vDissolve < 0.1) discard;
  float alpha = smoothstep(0.1, 0.3, vDissolve);
  // Bloom-like glow at dissolve edges
  vec3 glow = vColor * (1.0 + (1.0 - vDissolve) * 0.8);
  gl_FragColor = vec4(glow, alpha);
}
`;

export default function EphemeralFormSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100);
    camera.position.z = 5;

    // Geometries
    const geoA = new THREE.IcosahedronGeometry(0.5, 4);
    const geoB = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16);

    // Ensure same vertex count
    const targetGeo = geoB.clone();
    const posCount = geoA.attributes.position.count;
    const targetCount = targetGeo.attributes.position.count;
    if (posCount !== targetCount) {
      // Use the smaller count
      const minCount = Math.min(posCount, targetCount);
      geoA.setAttribute('position', new THREE.BufferAttribute(geoA.attributes.position.array.slice(0, minCount * 3), 3));
      targetGeo.setAttribute('position', new THREE.BufferAttribute(targetGeo.attributes.position.array.slice(0, minCount * 3), 3));
    }

    // Add target position attribute
    geoA.setAttribute('targetPosition', new THREE.BufferAttribute(
      new Float32Array(targetGeo.attributes.position.array), 3
    ));

    // Instance phase attribute
    const instanceCount = 100;
    const phases = new Float32Array(instanceCount);
    for (let i = 0; i < instanceCount; i++) {
      phases[i] = Math.random() * 6.0;
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: morphVertexShader,
      fragmentShader: morphFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphRatio: { value: 0 },
        uDissolve: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    geoA.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    const instancedMesh = new THREE.InstancedMesh(geoA, material, instanceCount);

    // Distribute instances
    const dummy = new THREE.Object3D();
    for (let i = 0; i < instanceCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const scale = 0.3 + Math.random() * 0.7;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    scene.add(instancedMesh);

    // IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);

    // Resize
    const onResize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // Render loop
    const startTime = performance.now();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const elapsed = (performance.now() - startTime) / 1000;
      material.uniforms.uTime.value = elapsed;

      // Oscillating morph ratio
      const morphPhase = (Math.sin(elapsed * 0.3) + 1) * 0.5;
      material.uniforms.uMorphRatio.value = morphPhase;
      material.uniforms.uDissolve.value = morphPhase;

      // Slow rotation of the whole system
      instancedMesh.rotation.y = elapsed * 0.05;
      instancedMesh.rotation.x = elapsed * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      geoA.dispose();
      geoB.dispose();
      targetGeo.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="scent-library"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '120vh',
        backgroundColor: '#F4F4F0',
        overflow: 'hidden',
      }}
    >
      <div
        ref={canvasContainerRef}
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
        }}
      />

      {/* Floating captions */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '8%',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(18px, 2.5vw, 36px)',
            color: '#3D3A36',
            fontStyle: 'italic',
            opacity: 0.7,
          }}
        >
          Raw extraction
        </div>

        <div
          style={{
            position: 'absolute',
            top: '55%',
            right: '8%',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(18px, 2.5vw, 36px)',
            color: '#C9A87C',
            fontStyle: 'italic',
            opacity: 0.8,
          }}
        >
          Refined distillation
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(18px, 2.5vw, 36px)',
            color: '#030303',
            fontStyle: 'italic',
            opacity: 0.6,
          }}
        >
          The final essence
        </div>
      </div>
    </section>
  );
}
