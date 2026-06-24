import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

interface ScentNode {
  id: string;
  label: string;
  position: THREE.Vector3;
  connected: boolean;
}

const MAX_POINTS = 100;

class PointerTrail {
  mesh: THREE.Object3D;
  points: THREE.Vector3[];
  line: MeshLineGeometry;
  material: MeshLineMaterial;
  object: THREE.Mesh;

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Object3D();
    this.mesh.position.copy(position);

    this.points = [];
    const p = new THREE.Vector3();
    this.mesh.getWorldPosition(p);

    for (let i = 0; i < MAX_POINTS; i++) {
      this.points.push(p.clone());
    }

    this.line = new MeshLineGeometry();
    this.line.setPoints(this.points.map((pt) => [pt.x, pt.y, pt.z]).flat() as number[]);

    this.material = new MeshLineMaterial({
      lineWidth: 0.05,
      dashArray: 1,
      dashOffset: 0,
      dashRatio: 0.98,
      color: new THREE.Color('#C9A87C'),
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    } as ConstructorParameters<typeof MeshLineMaterial>[0]);
    this.material.transparent = true;
    this.material.depthWrite = false;

    this.object = new THREE.Mesh(this.line, this.material);
  }

  update(targetPos: THREE.Vector3) {
    // Shift points back
    for (let i = MAX_POINTS - 1; i > 0; i--) {
      this.points[i].copy(this.points[i - 1]);
    }
    this.points[0].copy(targetPos);

    // Animate dash
    this.material.dashOffset -= 0.002;
    this.material.opacity = Math.max(0, 1.0 - (1.0 + this.material.dashOffset));

    // Update line
    this.line.setPoints(this.points.map((pt) => [pt.x, pt.y, pt.z]).flat() as number[]);
  }

  getOpacity(): number {
    return this.material.opacity;
  }
}

export default function OlfactoryJourneySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [formulation, setFormulation] = useState('');

  const nodesRef = useRef<ScentNode[]>([
    { id: 'top', label: 'Top', position: new THREE.Vector3(-2, 1.5, 0), connected: false },
    { id: 'heart', label: 'Heart', position: new THREE.Vector3(2, 1, 0), connected: false },
    { id: 'base', label: 'Base', position: new THREE.Vector3(-1.5, -1, 0), connected: false },
    { id: 'resin', label: 'Resin', position: new THREE.Vector3(1.5, -1.5, 0), connected: false },
    { id: 'musk', label: 'Musk', position: new THREE.Vector3(0, 0.5, 0), connected: false },
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030303, 1);
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
    camera.position.z = 6;

    // Invisible floor plane for raycasting
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Node meshes
    const nodeMeshes: THREE.Mesh[] = [];
    const nodes = nodesRef.current;

    nodes.forEach((node) => {
      const geometry = new THREE.SphereGeometry(0.12, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: '#C9A87C',
        transparent: true,
        opacity: 0.4,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);
      scene.add(mesh);
      nodeMeshes.push(mesh);

      // Glow ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.22, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#C9A87C',
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(node.position);
      scene.add(ring);
    });

    // Trails
    const trails: PointerTrail[] = [];
    let isDrawing = false;
    let currentWorldPos = new THREE.Vector3();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(floor);
      if (intersects.length > 0) {
        currentWorldPos.copy(intersects[0].point);

        // Check node proximity
        nodes.forEach((node, i) => {
          const dist = currentWorldPos.distanceTo(node.position);
          if (dist < 0.5 && !node.connected) {
            node.connected = true;
            // Brighten the node
            (nodeMeshes[i].material as THREE.MeshBasicMaterial).opacity = 1;
            setConnectedCount((prev) => {
              const next = prev + 1;
              if (next >= 3) {
                setFormulation('Liminal No. 7 — A composition of shadows and gold');
              }
              return next;
            });
          }
        });
      }
    };

    const onPointerDown = () => {
      isDrawing = true;
      const trail = new PointerTrail(currentWorldPos);
      trails.push(trail);
      scene.add(trail.object);
    };

    const onPointerUp = () => {
      isDrawing = false;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);

    // Resize
    const onResize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      trails.forEach((trail) => {
        trail.material.resolution.set(w, h);
      });
    };
    window.addEventListener('resize', onResize);

    // Render loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      if (isDrawing && trails.length > 0) {
        const currentTrail = trails[trails.length - 1];
        currentTrail.update(currentWorldPos);
      }

      // Fade out old trails
      for (let i = trails.length - 1; i >= 0; i--) {
        if (!isDrawing || i < trails.length - 1) {
          trails[i].material.opacity *= 0.98;
          if (trails[i].getOpacity() < 0.01) {
            scene.remove(trails[i].object);
            trails[i].line.dispose();
            trails[i].material.dispose();
            trails.splice(i, 1);
          }
        }
      }

      // Animate node rings
      nodeMeshes.forEach((mesh, i) => {
        const time = performance.now() * 0.001;
        mesh.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.1);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      floorGeometry.dispose();
      floorMaterial.dispose();
      nodeMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.MeshBasicMaterial).dispose();
      });
      trails.forEach((trail) => {
        trail.line.dispose();
        trail.material.dispose();
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="inquiry"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#030303',
        cursor: 'crosshair',
        overflow: 'hidden',
      }}
    >
      {/* Node labels */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {nodesRef.current.map((node) => {
          // Convert 3D position to screen-space for label placement
          const screenX = 50 + (node.position.x / 6) * 50;
          const screenY = 50 - (node.position.y / 4) * 40;
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${screenX}%`,
                top: `${screenY}%`,
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                opacity: node.connected ? 1 : 0.4,
                transition: 'opacity 0.4s ease',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: '#C9A87C',
                  textTransform: 'uppercase',
                }}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Instruction text */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 3.5vw, 48px)',
            color: '#F4F4F0',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          Compose Your Scent
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#8A7E72',
            textTransform: 'uppercase',
            marginTop: '12px',
          }}
        >
          Draw to connect the notes — discover your formulation
        </p>
      </div>

      {/* Connected count */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: '#C9A87C',
          }}
        >
          {connectedCount}/5 notes connected
        </span>
      </div>

      {/* Formulation reveal */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          textAlign: 'center',
          opacity: formulation ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(16px, 2vw, 28px)',
            color: '#C9A87C',
            fontStyle: 'italic',
            fontWeight: 400,
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          {formulation}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          right: '40px',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#8A7E72',
            textTransform: 'uppercase',
          }}
        >
          Atelier Veil — Independent Perfumery
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#8A7E72',
            textTransform: 'uppercase',
          }}
        >
          Retail Inquiry — hello@atelierveil.com
        </span>
      </div>
    </section>
  );
}
