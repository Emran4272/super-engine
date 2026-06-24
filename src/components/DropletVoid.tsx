import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_viscosity;

varying vec2 v_uv;

#define PI 3.14159265359
#define TAU 6.28318530718
#define e 2.718281828
#define MAX_STEPS 6

float powf(float a, float b) {
  return pow(a, b);
}

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdf(vec3 p) {
  float d = MAX_STEPS;

  // 1. Interactive sphere
  float sphere_1 = length(p - vec3(u_mouse.x, u_mouse.y, 0.0)) - 0.65;
  d = smin(d, sphere_1, 0.25);

  // 2. Plane 1
  float dy = sin(p.x * 1.8 + u_time * 0.4) * cos(p.z * 1.8 + u_time * 0.4) * 0.115;
  float plane_1 = p.y + 0.6 + dy + u_mouse.y * 0.3;
  d = smin(d, plane_1, 0.2);

  // 3. Plane 2
  float dx = sin(p.y * 1.8 + u_time * 0.4) * cos(p.z * 1.8 + u_time * 0.4) * 0.115;
  float plane_2 = p.x + 0.8 + dx - u_mouse.x * 0.3;
  d = smin(d, plane_2, 0.2);

  // 4. Plane 3
  float dz = sin(p.y * 1.8 + u_time * 0.4) * cos(p.x * 1.8 + u_time * 0.4) * 0.115;
  float plane_3 = p.z + 0.8 + dz;
  d = smin(d, plane_3, 0.2);

  // 5-10. Sphere chain 1
  float sphere_2 = length(p - vec3(0.85, -0.1, 0.3)) - 0.13;
  d = min(d, sphere_2);

  float sphere_3 = length(p - vec3(0.85, -0.1, 0.3) - vec3(0.015, 0.0, 0.0)) - 0.1;
  d = max(-sphere_3, d);

  float sphere_4 = length(p - vec3(0.85, -0.1, 0.3) - vec3(0.05, 0.0, 0.0)) - 0.09;
  d = max(-sphere_4, d);

  float sphere_5 = length(p - vec3(0.85, -0.1, 0.3) - vec3(0.1, 0.0, 0.0)) - 0.075;
  d = max(-sphere_5, d);

  float sphere_6 = length(p - vec3(0.85, -0.1, 0.3) - vec3(0.14, 0.0, 0.0)) - 0.06;
  d = max(-sphere_6, d);

  float sphere_7 = length(p - vec3(0.85, -0.1, 0.3) - vec3(0.175, 0.0, 0.0)) - 0.04;
  d = max(-sphere_7, d);

  // 11-16. Sphere chain 2
  float sphere_8 = length(p - vec3(-0.85, -0.1, 0.3)) - 0.13;
  d = min(d, sphere_8);

  float sphere_9 = length(p - vec3(-0.85, -0.1, 0.3) - vec3(0.015, 0.0, 0.0)) - 0.1;
  d = max(-sphere_9, d);

  float sphere_10 = length(p - vec3(-0.85, -0.1, 0.3) - vec3(0.05, 0.0, 0.0)) - 0.09;
  d = max(-sphere_10, d);

  float sphere_11 = length(p - vec3(-0.85, -0.1, 0.3) - vec3(0.1, 0.0, 0.0)) - 0.075;
  d = max(-sphere_11, d);

  float sphere_12 = length(p - vec3(-0.85, -0.1, 0.3) - vec3(0.14, 0.0, 0.0)) - 0.06;
  d = max(-sphere_12, d);

  float sphere_13 = length(p - vec3(-0.85, -0.1, 0.3) - vec3(0.175, 0.0, 0.0)) - 0.04;
  d = max(-sphere_13, d);

  return d;
}

float caustic(vec3 p, vec3 n) {
  float scale = 6.0;
  float distortion = noise(p.yz * 0.5 + u_time * 0.2) * 0.2;
  float pattern = sin(p.x * scale + p.y * scale + p.z * scale + distortion + u_time) * 0.5 + 0.5;
  return powf(pattern, 3.0) * max(0.0, n.y) * 0.8;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = v_uv * 2.0 - 1.0;
  uv.x *= aspect;

  vec3 ro = vec3(0.0, 0.0, -3.0);
  vec3 rd = normalize(vec3(uv, 1.0));

  vec2 mouseOffset = u_mouse * 2.0 - 1.0;
  mouseOffset.x *= aspect;
  ro.xy += mouseOffset * 0.15;
  ro += vec3(0.0, -0.15, 0.0);

  float t = 0.0;
  vec3 p = ro;

  for (int i = 0; i < MAX_STEPS; i++) {
    p = ro + rd * t;
    float d = sdf(p);
    t += d * (0.65 + u_viscosity * 0.35);
    if (d < 0.005 || t > 20.0) break;
  }

  vec3 n = normalize(vec3(
    sdf(p + vec3(0.001, 0.0, 0.0)),
    sdf(p + vec3(0.0, 0.001, 0.0)),
    sdf(p + vec3(0.0, 0.0, 0.001))
  ) - sdf(p));

  vec3 viewDir = normalize(ro - p);
  float fresnel = powf(1.0 - max(0.0, dot(viewDir, n)), 3.0);

  vec3 lightDir = normalize(vec3(0.5, 1.0, -0.5));
  float diff = max(0.0, dot(n, lightDir));
  vec3 ambient = vec3(0.01, 0.01, 0.015);
  vec3 lightColor = vec3(0.8, 0.75, 0.9);

  vec3 liquidColor = vec3(0.01, 0.012, 0.015);
  vec3 absorbColor = vec3(0.02, 0.015, 0.01);

  float depth = length(p - ro);
  vec3 transmission = exp(-depth * absorbColor);
  float transLight = max(0.0, dot(n, -lightDir));
  float caustics = caustic(p, n);

  float specPower = mix(200.0, 30.0, fresnel);
  float spec = powf(max(0.0, dot(reflect(-lightDir, n), viewDir)), specPower);
  vec3 specColor = mix(vec3(0.6, 0.6, 0.7), vec3(1.0, 0.98, 0.95), spec);

  vec3 refrDir = refract(normalize(ro - p), n, 0.75);
  vec3 internalColor = vec3(0.2, 0.15, 0.3);
  float internal = powf(max(0.0, refrDir.y), 2.0);

  float distortion = noise(p.xy * 3.0 + u_time * 0.1) * 0.15;
  float chromatic = 0.005 * (1.0 + distortion);
  vec3 disp = n * chromatic;
  vec3 refrR = refract(normalize(ro - p), normalize(n + vec3(disp.x, 0.0, 0.0)), 0.75);
  vec3 refrB = refract(normalize(ro - p), normalize(n + vec3(-disp.x, 0.0, 0.0)), 0.75);
  float chromaticAb = powf(1.0 - abs(dot(refrR, refrB)), 4.0);

  vec3 col = ambient;
  col += lightColor * diff * transmission * 0.2;
  col += lightColor * transLight * transmission * 0.3;
  col += caustics * vec3(0.6, 0.5, 0.8) * transmission * 0.5;
  col += liquidColor * transmission * 0.3;
  col += internalColor * internal * 0.3;
  col += vec3(0.5, 0.4, 0.6) * chromaticAb * 0.1;
  col += spec * specColor * 0.8;
  col += fresnel * vec3(0.4, 0.4, 0.5) * 0.2;

  float edge = powf(1.0 - abs(dot(n, viewDir)), 4.0);
  col += vec3(0.2, 0.15, 0.25) * edge * 0.15;

  vec3 objCenter = vec3(0.0, -0.15, 0.0);
  float distFromCenter = length(p.xz - objCenter.xz);
  float fadeStart = 1.5;
  col -= vec3(0.1, 0.1, 0.1) * max(0.0, distFromCenter - fadeStart) * 0.05;

  float fog = smoothstep(0.0, 15.0, t);
  col = mix(col, vec3(0.005, 0.005, 0.01), fog);

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function DropletVoid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1, y: -1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_mouse: { value: new THREE.Vector2(-1, -1) },
        u_resolution: { value: new THREE.Vector2(container.offsetWidth, container.offsetHeight) },
        u_viscosity: { value: 0.9 },
      },
    });
    materialRef.current = material;

    // Fullscreen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    container.addEventListener('pointermove', onPointerMove);

    // Resize
    const onResize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      material.uniforms.u_resolution.value.set(w, h);
    };
    window.addEventListener('resize', onResize);

    // Render loop
    const startTime = performance.now();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;
      material.uniforms.u_time.value = elapsed;
      material.uniforms.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
