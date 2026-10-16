import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeInOutCubic, lerp } from '../../../engine/ease';
import { glassMaterial, streamMaterial, waterMaterial } from '../../../engine/materials/water';
import { buoyancy, FLUIDS, storyNumbers } from '../math';
import { hangState } from '../hang';
import {
  archimedesRig,
  BEAKER,
  BEAKER_ASIDE,
  BEAKER_UNDER,
  BEAKER_WAITING,
  OUT,
  SPOUT,
  SYM3,
  uv,
} from '../rig';

const NUMBERS = storyNumbers();
const glassGeo = new THREE.CylinderGeometry(BEAKER.r, BEAKER.r * 0.94, BEAKER.h, 40, 1, true).translate(
  0,
  BEAKER.h / 2,
  0,
);
const baseGeo = new THREE.CylinderGeometry(BEAKER.r * 0.94, BEAKER.r * 0.94, 0.02, 40).translate(0, 0.01, 0);
const waterGeo = new THREE.CylinderGeometry(BEAKER.r * 0.9, BEAKER.r * 0.86, 1, 40).translate(0, 0.5, 0);
const streamGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
const water = waterMaterial(FLUIDS[1]!.color);

/** Height of the water in a beaker holding `ml`. */
const columnHeight = (ml: number) => (ml / BEAKER.capacity) * BEAKER.fill * BEAKER.h;

/** An arrow (shaft and head) from its base along +y, drawn over everything so it reads through water. */
function Arrow({ arrow }: { arrow: React.RefObject<THREE.Group | null> }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SYM3.push,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  return (
    <group ref={arrow} visible={false} renderOrder={20}>
      <mesh position={[0, 0.2, 0]} material={mat} renderOrder={20}>
        <cylinderGeometry args={[0.022, 0.022, 0.4, 12]} />
      </mesh>
      <mesh position={[0, 0.46, 0]} material={mat} renderOrder={20}>
        <coneGeometry args={[0.06, 0.13, 16]} />
      </mesh>
    </group>
  );
}

/**
 * Two beakers by the spout and the stream that fills them, plus the two arrows that make the point: the
 * water's push on the crown, and the weight of the water it spilled, are the same size.
 */
export function Beakers() {
  const rig = archimedesRig();
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const wa = useRef<THREE.Mesh>(null);
  const wb = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const streamMat = useMemo(() => streamMaterial(FLUIDS[1]!.color), []);
  const flow = useRef({ value: 0, prev: 0 });
  const push = useRef<THREE.Group | null>(null);
  const spilled = useRef<THREE.Group | null>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);

  useFrame((state, dt) => {
    const show = rig.beakers > 0.001;
    const s = easeInOutCubic(rig.swap);
    const posA = [
      lerp(BEAKER_UNDER[0], BEAKER_ASIDE[0], s),
      lerp(BEAKER_UNDER[1], BEAKER_ASIDE[1], s),
    ] as const;
    const posB = [
      lerp(BEAKER_WAITING[0], BEAKER_UNDER[0], s),
      lerp(BEAKER_WAITING[1], BEAKER_UNDER[1], s),
    ] as const;
    const rise = -0.6 * (1 - clamp01(rig.beakers));
    const mlA = rig.spillA * NUMBERS.crownVolume;
    const mlB = rig.spillB * NUMBERS.barVolume;
    if (a.current) {
      a.current.visible = show;
      a.current.position.set(...uv(posA[0], posA[1], rise));
    }
    if (b.current) {
      b.current.visible = show && (rig.swap > 0.001 || rig.spillB > 0);
      b.current.position.set(...uv(posB[0], posB[1], rise));
    }
    wa.current?.scale.set(1, Math.max(columnHeight(mlA), 0.0001), 1);
    if (wa.current) wa.current.visible = mlA > 0.05;
    wb.current?.scale.set(1, Math.max(columnHeight(mlB), 0.0001), 1);
    if (wb.current) wb.current.visible = mlB > 0.05;

    // The stream runs while either beaker is filling.
    const f = flow.current;
    const total = rig.spillA + rig.spillB;
    const filling = total > f.prev + 1e-5 ? 1 : 0;
    f.value += (filling - f.value) * Math.min(1, dt * (filling ? 14 : 5));
    f.prev = total;
    streamMat.uniforms.uTime!.value = state.clock.elapsedTime;
    streamMat.uniforms.uOpacity!.value = f.value * clamp01(rig.beakers);
    const st = stream.current;
    if (st) {
      const under = rig.swap < 0.5 ? mlA : mlB;
      const bottom = columnHeight(under) + 0.02;
      const top = SPOUT.y - 0.02;
      st.visible = f.value > 0.01;
      st.position.set(...uv(SPOUT.u + OUT * 0.06, SPOUT.v, (top + bottom) / 2));
      st.scale.set(0.022, Math.max(top - bottom, 0.001), 0.022);
    }

    // Arrows: the push on the crown, and the weight of the water it spilled, at the same scale.
    const h = hangState(rig);
    const k = clamp01(rig.arrows);
    const p = push.current;
    if (p) {
      p.visible = k > 0.01;
      p.position.set(...uv(0, 0, h.bottom + h.height / 2));
      p.scale.setScalar(Math.max(k, 0.001));
    }
    const w = spilled.current;
    if (w) {
      w.visible = k > 0.01;
      // Pointing down, from just above the water in the first beaker.
      w.position.set(...uv(posA[0], posA[1], rise + columnHeight(mlA) + 0.55));
      w.rotation.set(Math.PI, 0, 0);
      w.scale.setScalar(Math.max(k, 0.001));
    }

    const n = (x: number) => x.toFixed(2);
    const spots: Array<[[number, number, number], number, string]> = [
      [uv(posA[0], posA[1], rise + BEAKER.h + 0.12), show && mlA > 0.5 ? 1 : 0, `${Math.round(mlA)} mL`],
      [uv(posB[0], posB[1], rise + BEAKER.h + 0.12), show && mlB > 0.5 ? 1 : 0, `${Math.round(mlB)} mL`],
      [uv(0.48, 0, h.bottom + h.height / 2 + 0.3), k, `push ${n(NUMBERS.crownPush)} N`],
      [uv(posA[0] + OUT * 0.55, posA[1], rise + columnHeight(mlA) + 0.4), k, `weighs ${n(buoyancy(mlA))} N`],
    ];
    spots.forEach(([pos, o, t], i) => {
      labels.current[i]?.position.set(...pos);
      const el = texts.current[i];
      if (el) {
        el.style.opacity = String(o);
        if (el.textContent !== t) el.textContent = t;
      }
    });
  });

  const beaker = (group: typeof a, column: typeof wa) => (
    <group ref={group} visible={false}>
      <mesh geometry={glassGeo} material={glassMaterial} renderOrder={3} />
      <mesh geometry={baseGeo} material={glassMaterial} renderOrder={3} />
      <mesh ref={column} geometry={waterGeo} material={water} visible={false} />
    </group>
  );

  return (
    <group>
      {beaker(a, wa)}
      {beaker(b, wb)}
      <mesh ref={stream} geometry={streamGeo} material={streamMat} visible={false} />
      <Arrow arrow={push} />
      <Arrow arrow={spilled} />
      {[SYM3.push, SYM3.push, SYM3.push, SYM3.push].map((color, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--chip"
            color={color}
          >
            {''}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
