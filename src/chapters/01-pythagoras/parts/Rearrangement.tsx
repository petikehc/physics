import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { easeInOutCubic, lerp, smooth, staggered } from '../../../engine/ease';
import { angleDelta, tileLayouts, type V2 } from '../math';
import {
  BASE_SCALE,
  FRAME_ORIGIN,
  pythagorasRig,
  SLIDE_STAGGER,
  SLIDING_TILES,
  SYM,
  TILE_STAGGER,
  uvToLocal,
} from '../rig';

const T = 0.22; // tile thickness, uv units
const FW = 0.32; // frame border width
const FH = 0.34; // frame border height

function insetTriangle(a: number, b: number, inset: number): V2[] {
  const P: V2[] = [
    [0, 0],
    [a, 0],
    [0, b],
  ];
  const c = Math.hypot(a, b);
  const perim = a + b + c;
  const I: V2 = [(c * 0 + b * a + a * 0) / perim, (c * 0 + b * 0 + a * b) / perim];
  return P.map(([x, y]) => {
    const dx = x - I[0];
    const dy = y - I[1];
    const len = Math.hypot(dx, dy);
    const k = Math.max(len - inset * 1.6, 0) / len;
    return [I[0] + dx * k, I[1] + dy * k];
  });
}

function tileGeometry(a: number, b: number) {
  const pts = insetTriangle(a, b, 0.035);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: T,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function flatShape(pts: V2[], lift: number) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));
  g.rotateX(-Math.PI / 2);
  g.translate(0, lift, 0);
  return g;
}

const stone = new THREE.MeshStandardMaterial({ color: '#efe4d0', roughness: 0.78, metalness: 0 });
const stoneEdges = new THREE.LineBasicMaterial({ color: '#f4efe6', transparent: true, opacity: 0.55 });
const frameMat = new THREE.MeshStandardMaterial({ color: '#3b2f28', roughness: 0.7 });

// An opaque-ish fill rather than an additive glow: additive brightened the fine sand grain and the
// twinkling Dust underneath, which shimmered as the camera breathed.
function glowMaterial(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
}

export function Rearrangement() {
  const rig = pythagorasRig();
  const root = useRef<THREE.Group>(null);
  const frame = useRef<THREE.Group>(null);
  const tiles = useRef<Array<THREE.Group | null>>([]);
  const glows = useRef<Array<THREE.Mesh | null>>([]);
  const labelGroups = useRef<Array<THREE.Group | null>>([]);
  const labelEls = useRef<Array<HTMLDivElement | null>>([]);

  const a = Math.round(rig.a * 100) / 100;
  const b = Math.round(rig.b * 100) / 100;
  const geo = useMemo(() => {
    const L = tileLayouts(a, b);
    const tile = tileGeometry(a, b);
    return {
      L,
      tile,
      edges: new THREE.EdgesGeometry(tile, 25),
      // Lifted above the Dust's sand sparkles so none twinkle through.
      glowA1: flatShape(L.holesA[0]!, 0.06),
      glowA2: flatShape(L.holesA[1]!, 0.06),
      glowB: flatShape(L.holeB, 0.065),
    };
  }, [a, b]);

  useEffect(
    () => () => {
      geo.tile.dispose();
      geo.edges.dispose();
      geo.glowA1.dispose();
      geo.glowA2.dispose();
      geo.glowB.dispose();
    },
    [geo],
  );

  const glowMats = useMemo(() => [glowMaterial(SYM.a), glowMaterial(SYM.b), glowMaterial(SYM.c)], []);

  useFrame(() => {
    const r = root.current;
    if (!r) return;
    const { L } = geo;
    const s = L.size;
    r.visible = rig.frame > 0.001 || rig.tiles > 0.001;
    r.position.set(...uvToLocal(FRAME_ORIGIN[0], FRAME_ORIGIN[1], BASE_SCALE, -smooth(rig.proofSink) * 1.6));
    r.scale.setScalar(BASE_SCALE);

    frame.current?.position.set(0, lerp(-FH * 1.4, 0, smooth(rig.frame)), 0);

    // Tiles start stacked on the scratched triangle (triangle-uv origin) and fly into layout A,
    // then the sliding tiles move to layout B.
    const start = { x: -FRAME_ORIGIN[0], y: -FRAME_ORIGIN[1], rot: 0 };
    for (let i = 0; i < 4; i++) {
      const g = tiles.current[i];
      if (!g) continue;
      const q = staggered(rig.tiles, i, 4, TILE_STAGGER);
      const e = easeInOutCubic(q);
      const A = L.A[i]!;
      const B = L.B[i]!;
      let x = lerp(start.x, A.x, e);
      let y = lerp(start.y, A.y, e);
      const rot = start.rot + angleDelta(start.rot, A.rot) * e;
      // The stack first emerges from the groove, then each tile peels off in turn.
      const emerge = smooth(rig.tiles / 0.06);
      let h = Math.sin(Math.PI * q) * 3.2 + (1 - q) * i * (T + 0.04) - (1 - emerge) * 1.4;
      const roll = Math.PI * 2 * smooth(q);

      const slideIndex = SLIDING_TILES.indexOf(i as 0 | 1 | 3);
      if (slideIndex >= 0) {
        const sp = staggered(rig.layout, slideIndex, SLIDING_TILES.length, SLIDE_STAGGER);
        const se = easeInOutCubic(sp);
        x = lerp(x, B.x, se);
        y = lerp(y, B.y, se);
        h += Math.sin(Math.PI * sp) * 0.9;
      }

      g.visible = rig.tiles > 0.001;
      g.position.set(x, h, -y);
      g.rotation.set(roll, rot, 0, 'YXZ');
    }

    // Glowing holes: a² and b² in layout A, c² in layout B.
    // a² and b² clear away early in the slide so they never muddy the c² square.
    const gA = rig.glowA * (1 - Math.min(1, rig.layout * 2.5));
    const gB = rig.glowB * rig.layout;
    glowMats[0]!.opacity = gA * 0.85;
    glowMats[1]!.opacity = gA * 0.85;
    glowMats[2]!.opacity = gB * 0.85;
    glows.current.forEach((m, i) => {
      if (m) m.visible = (i < 2 ? gA : gB) > 0.002;
    });

    const centres: V2[] = [
      [a / 2, a / 2],
      [a + b / 2, a + b / 2],
      [s / 2, s / 2],
    ];
    const ops = [gA, gA, gB];
    centres.forEach(([u, v], i) => {
      labelGroups.current[i]?.position.set(u, 0.2, -v);
      const el = labelEls.current[i];
      if (el) el.style.opacity = String(ops[i]);
    });
  });

  const borders: Array<[number, number, number, number]> = [];
  {
    const s = geo.L.size;
    borders.push([s / 2, -FW / 2, s + 2 * FW, FW]);
    borders.push([s / 2, s + FW / 2, s + 2 * FW, FW]);
    borders.push([-FW / 2, s / 2, FW, s]);
    borders.push([s + FW / 2, s / 2, FW, s]);
  }

  const glowGeos = [geo.glowA1, geo.glowA2, geo.glowB];
  const labelSpecs: Array<[string, string]> = [
    ['a²', SYM.a],
    ['b²', SYM.b],
    ['c²', SYM.c],
  ];

  return (
    <group ref={root} visible={false}>
      <group ref={frame}>
        {borders.map(([u, v, w, d], i) => (
          <mesh key={i} position={[u, FH / 2, -v]} material={frameMat} castShadow receiveShadow>
            <boxGeometry args={[w, FH, d]} />
          </mesh>
        ))}
      </group>
      {glowGeos.map((g, i) => (
        <mesh
          key={i}
          ref={(el) => void (glows.current[i] = el)}
          geometry={g}
          material={glowMats[i]}
          renderOrder={4}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} ref={(el) => void (tiles.current[i] = el)} visible={false}>
          <mesh geometry={geo.tile} material={stone} castShadow receiveShadow />
          <lineSegments geometry={geo.edges} material={stoneEdges} />
        </group>
      ))}
      {labelSpecs.map(([text, color], i) => (
        <group key={text} ref={(el) => void (labelGroups.current[i] = el)}>
          <MathLabel
            ref={(el) => void (labelEls.current[i] = el)}
            className="math-label math-label--big"
            color={color}
          >
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
