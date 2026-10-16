import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic } from '../../../engine/ease';
import { hangState } from '../hang';
import { archimedesRig, BAR_SIZE, CROWN_SIZE, GANTRY, HOOK_Y, SYM3, uv } from '../rig';

// Not too metallic: fully metallic gold mirrors the dark evening sky and reads as bronze.
export const goldMaterial = new THREE.MeshStandardMaterial({
  color: '#f7c955',
  metalness: 0.38,
  roughness: 0.28,
  envMapIntensity: 1.3,
  emissive: new THREE.Color('#3a2600'),
  transparent: true,
});
const wood = new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.8 });
const brass = new THREE.MeshStandardMaterial({ color: '#b98b45', metalness: 0.6, roughness: 0.35 });
const rope = new THREE.MeshStandardMaterial({ color: '#e7dcc5', roughness: 0.9 });

/** The crown's shape: a band BAND tall whose top edge rises into POINTS points, SPIKE taller. */
const POINTS = 7;
const BAND = 0.12;
const SPIKE = 0.16;
const WALL = 0.022;
/** Outer radius at height y: the crown flares slightly towards the top. */
const radiusAt = (y: number) => CROWN_SIZE.r * (1 + (0.07 * y) / (BAND + SPIKE));
/** Height of the top edge at angle a: a valley between points, a sharp tip at each point. */
function edgeAt(a: number) {
  const phase = ((a / (Math.PI * 2)) * POINTS) % 1;
  return BAND + SPIKE * Math.pow(1 - Math.abs(2 * phase - 1), 1.8);
}
/** Angles of the points' tips, and of the valleys between them. */
const tipAngle = (k: number) => ((k + 0.5) / POINTS) * Math.PI * 2;
const valleyAngle = (k: number) => (k / POINTS) * Math.PI * 2;

/**
 * A crown about 0.6 wide and 0.34 tall, its base at y = 0, cast as one piece: a band whose top edge rises into
 * seven points (so the points grow out of the band instead of sitting on it), a jewel on each tip and a rolled
 * lip round the base.
 */
function crownGeometry() {
  const M = POINTS * 24; // a vertex exactly on every tip and valley
  const ring = (y: (a: number) => number, inset: number) =>
    Array.from({ length: M }, (_, i) => {
      const a = (i / M) * Math.PI * 2;
      const h = y(a);
      const r = radiusAt(h) - inset;
      return new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r);
    });
  const outerBottom = ring(() => 0, 0);
  const outerTop = ring(edgeAt, 0);
  const innerBottom = ring(() => 0, WALL);
  const innerTop = ring(edgeAt, WALL);

  const pos: number[] = [];
  const index: number[] = [];
  // A closed strip between two rings; each strip has its own vertices, so edges between strips stay crisp.
  const strip = (a: THREE.Vector3[], b: THREE.Vector3[], flip: boolean) => {
    const base = pos.length / 3;
    for (const p of [...a, ...b]) pos.push(p.x, p.y, p.z);
    for (let i = 0; i < M; i++) {
      const j = (i + 1) % M;
      const tris = [
        [base + i, base + M + i, base + j],
        [base + M + i, base + M + j, base + j],
      ];
      for (const [x, y, z] of tris) index.push(...(flip ? [x!, z!, y!] : [x!, y!, z!]));
    }
  };
  strip(outerBottom, outerTop, false); // outside, facing out
  strip(innerBottom, innerTop, true); // inside, facing in
  strip(outerTop, innerTop, false); // the top edge, facing up
  strip(outerBottom, innerBottom, true); // the base, facing down
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  shell.setIndex(index);
  shell.computeVertexNormals();

  const parts: THREE.BufferGeometry[] = [shell.toNonIndexed()];
  const lip = new THREE.TorusGeometry(CROWN_SIZE.r + 0.004, 0.013, 12, 96)
    .rotateX(Math.PI / 2)
    .translate(0, 0.012, 0);
  parts.push(lip.toNonIndexed());
  for (let k = 0; k < POINTS; k++) {
    const a = tipAngle(k);
    const r = radiusAt(BAND + SPIKE) - WALL / 2;
    // Faceted, like a cut stone.
    const jewel = new THREE.IcosahedronGeometry(0.024, 0);
    jewel.translate(Math.cos(a) * r, BAND + SPIKE + 0.016, Math.sin(a) * r);
    parts.push(jewel);
  }
  // Merge by hand (positions and normals), keeping each part's own shading.
  const count = parts.reduce((n, g) => n + g.getAttribute('position').count, 0);
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  let o = 0;
  for (const g of parts) {
    position.set(g.getAttribute('position').array as Float32Array, o);
    normal.set(g.getAttribute('normal').array as Float32Array, o);
    o += g.getAttribute('position').count * 3;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  return merged;
}

const crownGeo = crownGeometry();
const barGeo = new THREE.BoxGeometry(BAR_SIZE.u, BAR_SIZE.h, BAR_SIZE.v).translate(0, BAR_SIZE.h / 2, 0);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 16);

type V3 = [number, number, number];
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
/** Stretches a unit cylinder of radius r from a to b. */
function span(m: THREE.Mesh, a: V3, b: V3, r: number) {
  _a.set(...a);
  _b.set(...b).sub(_a);
  const len = _b.length();
  m.position.copy(_a).addScaledVector(_b, 0.5);
  m.quaternion.setFromUnitVectors(_up, _b.normalize());
  m.scale.set(r, Math.max(len, 0.001), r);
}

/** Where the cradle's cords hold the crown (on the band, in three valleys) and the bar (near its ends). */
const CROWN_HOLDS = [0, 2, 5].map((k) => {
  const a = valleyAngle(k);
  const r = radiusAt(BAND) - WALL / 2;
  return [Math.cos(a) * r, BAND - 0.01, Math.sin(a) * r] as V3;
});
const BAR_HOLDS: V3[] = [
  [-BAR_SIZE.u * 0.36, BAR_SIZE.h, 0],
  [BAR_SIZE.u * 0.36, BAR_SIZE.h, 0],
];
/** How far above the object's top the cords meet. */
const KNOT = 0.14;

/** A weight in grams as the scale shows it: whole grams, with a thousands separator. */
const grams = (x: number) => Math.round(x).toLocaleString('en-US');

/** Where the scale's hook hangs: it rises a little as the reading drops (exaggerated so it shows). */
function hookY(reading: number, weight: number) {
  return HOOK_Y - 0.04 - 0.9 * Math.max(0, reading / weight - 0.88);
}

/** The post and arm, the spring scale with its reading, the rope, and the crown or the gold bar on it. */
export function Hanging() {
  const rig = archimedesRig();
  const gantry = useRef<THREE.Group>(null);
  const plunger = useRef<THREE.Mesh>(null);
  const cord = useRef<THREE.Mesh>(null);
  const cradle = useRef<Array<THREE.Mesh | null>>([]);
  const crown = useRef<THREE.Mesh>(null);
  const bar = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Group>(null);
  const text = useRef<HTMLDivElement>(null);
  const last = useRef('');
  const arm = useMemo(() => {
    const len = GANTRY.postV;
    return { len, mid: len / 2 };
  }, []);

  useFrame(() => {
    const g = gantry.current;
    if (!g) return;
    const grow = easeOutCubic(rig.gantry);
    g.visible = rig.gantry > 0.001;
    g.scale.set(1, Math.max(grow, 0.001), 1);

    const s = hangState(rig);
    const hook = hookY(s.reading, s.weight);
    const p = plunger.current;
    if (p) {
      // The scale's inner rod: from the housing down to the hook.
      const top = GANTRY.top - 0.6;
      p.position.set(...uv(0, 0, (top + hook) / 2));
      p.scale.set(0.018, Math.max(top - hook, 0.001), 0.018);
    }

    const show = rig.crown > 0.001 && rig.gantry > 0.5;
    const objTop = s.top;
    const fade = clamp01(rig.crown) * (1 - clamp01(rig.hookOut * 1.6));
    const roped = show && rig.hookOut < 0.6;
    const knot: V3 = uv(0, 0, objTop + KNOT);
    const c = cord.current;
    if (c) {
      c.visible = roped;
      span(c, uv(0, 0, hook), knot, 0.008);
    }
    const holds = s.isBar ? BAR_HOLDS : CROWN_HOLDS;
    cradle.current.forEach((m, i) => {
      if (!m) return;
      const hold = holds[i];
      m.visible = roped && hold !== undefined;
      if (hold) span(m, knot, [hold[0], s.bottom + hold[1], hold[2]], 0.005);
    });
    goldMaterial.opacity = fade;
    goldMaterial.transparent = fade < 0.999;
    goldMaterial.depthWrite = fade > 0.5;
    if (crown.current) {
      crown.current.visible = show && !s.isBar && fade > 0.001;
      crown.current.position.set(...uv(0, 0, s.bottom));
    }
    if (bar.current) {
      bar.current.visible = show && s.isBar && fade > 0.001;
      bar.current.position.set(...uv(0, 0, s.bottom));
    }

    label.current?.position.set(...uv(0.32, 0, GANTRY.top - 0.36));
    const el = text.current;
    if (el) {
      el.style.opacity = String(clamp01(rig.readout) * grow);
      const t = `${grams(s.reading)} g`;
      if (t !== last.current) {
        el.textContent = t;
        last.current = t;
      }
    }
  });

  return (
    <group>
      <group ref={gantry} visible={false}>
        {/* Post behind the tank and the arm reaching over its centre. */}
        <mesh
          geometry={unitBox}
          material={wood}
          position={uv(0, GANTRY.postV, GANTRY.top / 2)}
          scale={[0.14, GANTRY.top, 0.14]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={unitBox}
          material={wood}
          position={uv(0, arm.mid, GANTRY.top + 0.05)}
          scale={[0.12, 0.12, arm.len + 0.14]}
          castShadow
        />
        {/* Spring scale: a brass housing hanging from the arm, with the rod that carries the hook. */}
        <mesh
          geometry={unitCyl}
          material={brass}
          position={uv(0, 0, GANTRY.top - 0.3)}
          scale={[0.07, 0.58, 0.07]}
          castShadow
        />
        <mesh ref={plunger} geometry={unitCyl} material={brass} />
      </group>
      <mesh ref={cord} geometry={unitCyl} material={rope} visible={false} />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(m) => void (cradle.current[i] = m)}
          geometry={unitCyl}
          material={rope}
          visible={false}
        />
      ))}
      <mesh ref={crown} geometry={crownGeo} material={goldMaterial} castShadow visible={false} />
      <mesh ref={bar} geometry={barGeo} material={goldMaterial} castShadow visible={false} />
      <group ref={label}>
        <MathLabel ref={text} className="math-label math-label--chip" color={SYM3.weight}>
          1,000 g
        </MathLabel>
      </group>
    </group>
  );
}
