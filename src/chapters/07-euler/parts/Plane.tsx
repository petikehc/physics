import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { C, eulerRig, onPlane, R, SYM7 } from '../rig';

/** How far past the circle the axes run (in the plane's own units, where the circle's radius is 1). */
const AXIS = 1.6;
const RING = 160;

const gridVertex = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const gridFragment = /* glsl */ `
  varying vec2 vP;
  uniform vec3 uColor;
  uniform float uOn;
  uniform float uR;
  uniform float uReach;
  // Antialiased lines every s units.
  float lines(vec2 p, float s) {
    vec2 q = p / s;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float d = length(vP);
    // A disc of graph paper, fading out towards its edge: lines every half unit, stronger every whole one.
    float fade = 1.0 - smoothstep(uReach * 0.55, uReach, d);
    float g = max(lines(vP, uR * 0.5) * 0.18, lines(vP, uR) * 0.42);
    float a = g * fade * uOn;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/**
 * The complex plane, standing upright: a disc of faint graph paper, the real axis across and the imaginary one up,
 * the circle of radius 1, and the four points a quarter turn apart, named 1, i, −1 and −i.
 */
export function Plane() {
  const rig = eulerRig();
  const grid = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridVertex,
        fragmentShader: gridFragment,
        uniforms: {
          uColor: { value: new THREE.Color(SYM7.grid) },
          uOn: { value: 0 },
          uR: { value: R },
          uReach: { value: R * (AXIS + 0.3) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const mesh = useRef<THREE.Mesh>(null);
  const re = useRef<ChalkLineHandle | null>(null);
  const im = useRef<ChalkLineHandle | null>(null);
  const circle = useRef<ChalkLineHandle | null>(null);
  const dots = useRef<Array<THREE.Mesh | null>>([]);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const ring = useMemo<Pts>(
    () =>
      Array.from({ length: RING + 1 }, (_, i) => {
        const t = (i / RING) * Math.PI * 2;
        return onPlane(Math.cos(t), Math.sin(t), 0);
      }),
    [],
  );

  useFrame(() => {
    const on = clamp01(rig.plane);
    const marks = clamp01(rig.marks);
    grid.uniforms.uOn!.value = on;
    if (mesh.current) mesh.current.visible = on > 0.001;
    re.current?.set([onPlane(-AXIS, 0), onPlane(AXIS, 0)], on, 0.75 * on);
    im.current?.set([onPlane(0, -AXIS), onPlane(0, AXIS)], on, 0.75 * on);
    circle.current?.set(ring, on, 0.85 * on);

    // The four points a quarter turn apart, and the axes' names at their ends.
    const at: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    at.forEach(([x, y], i) => {
      const d = dots.current[i];
      if (d) {
        d.visible = marks > 0.01;
        d.position.set(...onPlane(x, y, 0));
      }
    });
    const place: Array<[[number, number, number], number, number]> = [
      // Each name just outside the circle, off the axes, so the arrows that land there leave it clear.
      [onPlane(1, 0), 1, -1],
      [onPlane(0, 1), 1, 1],
      [onPlane(-1, 0), -1, -1],
      [onPlane(0, -1), 1, -1],
      // Inside the ends of the axes.
      [onPlane(AXIS, 0), -1, 1],
      [onPlane(0, AXIS), 1, -1],
    ];
    place.forEach(([p, dx, dy], i) => {
      labels.current[i]?.position.set(...p);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(i < 4 ? marks : marks * 0.85);
      beside(el, dx, dy, 6);
    });
  });

  const names: Array<[string, string]> = [
    ['1', SYM7.cos],
    ['i', SYM7.sin],
    ['−1', SYM7.cos],
    ['−i', SYM7.sin],
    ['real', SYM7.cos],
    ['imaginary', SYM7.sin],
  ];

  return (
    <group>
      <mesh ref={mesh} material={grid} position={C} visible={false} renderOrder={-1}>
        <planeGeometry args={[R * (AXIS + 0.3) * 2, R * (AXIS + 0.3) * 2]} />
      </mesh>
      <ChalkLine handle={re} color={SYM7.cos} width={1.4} renderOrder={6} />
      <ChalkLine handle={im} color={SYM7.sin} width={1.4} renderOrder={6} />
      <ChalkLine handle={circle} color={SYM7.grid} width={2.4} renderOrder={6} />
      {[SYM7.cos, SYM7.sin, SYM7.cos, SYM7.sin].map((color, i) => (
        <mesh key={i} ref={(el) => void (dots.current[i] = el)} visible={false} renderOrder={7}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      {names.map(([text, color], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className={i < 4 ? 'math-label' : 'math-label math-label--small'}
            color={color}
          >
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
