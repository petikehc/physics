import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { runtime } from '../../../engine/runtime';
import { station } from '../../../engine/world/stations';
import { glassMaterial, waterMaterial } from '../../../engine/materials/water';
import { energyRig, SYM10 } from '../rig';
import { readGauge } from '../sandbox';

const ORIGIN = station('energy');
/** Each tank's size, and the gap between their centres; the total's column is narrower. */
const TANK = { w: 3, h: 9, d: 2, gap: 3.7 };
const COLUMN = 1.5;
/** The whole set's width and height (tanks, column, and a little room for their labels). */
const SET = { w: TANK.gap * 3 + TANK.w / 2 + COLUMN / 2, h: TANK.h + 0.8 };
/** How far in front of the camera the set hangs. */
const DEPTH = 12;
const KINDS = ['pe', 'ke', 'heat'] as const;
type Kind = (typeof KINDS)[number];
const NAMES: Record<Kind, string> = { pe: 'height · mgh', ke: 'speed · ½mv²', heat: 'heat' };
/** On a phone, where the tanks stand closer together. */
const SHORT: Record<Kind, string> = { pe: 'height', ke: 'speed', heat: 'heat' };

const kJ = (j: number) => `${Math.round(j / 1000)} kJ`;
const x = (i: number) => (i - 1.5) * TANK.gap;

/** A material drawn over the scene: the tanks hang in front of everything. */
function onTop<T extends THREE.Material>(m: T, order: number): T {
  m.depthTest = false;
  m.depthWrite = false;
  m.userData.order = order;
  return m;
}

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();

/**
 * The train's energy in three glass tanks, hung beside the picture wherever the camera goes: height's part, speed's
 * part and friction's heat, each as full as that much energy. Beside them, a column with all three stacked: its top,
 * the total, never moves. On a wide screen they stand on the right; on a phone, across the top.
 */
export function Tanks() {
  const rig = energyRig();
  const root = useRef<THREE.Group>(null);
  const liquids = useRef<Array<THREE.Mesh | null>>([]);
  const stacks = useRef<Array<THREE.Mesh | null>>([]);
  const glasses = useRef<Array<THREE.Mesh | null>>([]);
  const line = useRef<THREE.Mesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef<string[]>([]);
  const mats = useMemo(() => KINDS.map((k) => onTop(waterMaterial(SYM10[k]), 31)), []);
  const glass = useMemo(() => onTop(glassMaterial.clone(), 32), []);
  const back = useMemo(
    () => onTop(new THREE.MeshBasicMaterial({ color: '#0b0c10', transparent: true, opacity: 0.55 }), 30),
    [],
  );

  // After the camera has moved (-2) and before the labels are projected (0), so they never trail it.
  useFrame((state) => {
    const on = clamp01(rig.tanks);
    const g = root.current;
    if (!g) return;
    g.visible = on > 0.01;
    if (!g.visible) {
      for (const el of texts.current) if (el && el.style.opacity !== '0') el.style.opacity = '0';
      return;
    }
    // Hang the set in front of the camera: on the right of a wide picture, across the top of a tall one.
    const cam = state.camera as THREE.PerspectiveCamera;
    const halfH = DEPTH * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const halfW = halfH * aspect;
    const wide = aspect >= 1;
    const k = wide ? (0.8 * halfH) / SET.h : Math.min((0.42 * halfH) / SET.h, (1.7 * halfW) / SET.w);
    // With the viewer's panel on the right (Your turn, the Lab), they hang on the left instead.
    const side = rig.lab > 0.5 || rig.interactive > 0.5 ? -1 : 1;
    const cx = wide ? side * (halfW * 0.92 - (SET.w * k) / 2) : 0;
    // A lens shift (a phone's panel lifting the picture) moves the top of the screen down the frustum.
    const shift = 2 * halfH * runtime.camera.lensY;
    const cy = (wide ? -halfH * 0.08 : halfH * 0.8 - (SET.h * k) / 2) - shift;
    cam.getWorldDirection(forward);
    right.set(1, 0, 0).applyQuaternion(cam.quaternion);
    up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    g.position
      .copy(cam.position)
      .addScaledVector(forward, DEPTH)
      .addScaledVector(right, cx)
      .addScaledVector(up, cy - (SET.h * k) / 2)
      .sub(new THREE.Vector3(ORIGIN.x, ORIGIN.y, ORIGIN.z));
    g.quaternion.copy(cam.quaternion);
    g.scale.setScalar(k);

    const r = readGauge(rig);
    const heatOn = clamp01(rig.heat);
    const parts: Record<Kind, number> = { pe: r.pe, ke: r.ke, heat: r.heat };
    const level = (j: number) => clamp01(j / Math.max(r.full, 1));
    let stacked = 0;
    KINDS.forEach((kind, i) => {
      const show = kind === 'heat' ? heatOn : 1;
      const f = level(parts[kind]) * TANK.h;
      const liq = liquids.current[i];
      if (liq) {
        liq.visible = f > 0.01 && show > 0.01;
        liq.scale.set(TANK.w - 0.2, Math.max(f, 0.001), TANK.d - 0.2);
        liq.position.set(x(i), 0.4 + f / 2, 0);
      }
      const gl = glasses.current[i];
      if (gl) gl.visible = show > 0.01;
      const part = level(parts[kind]) * TANK.h * (kind === 'heat' ? heatOn : 1);
      const st = stacks.current[i];
      if (st) {
        st.visible = part > 0.01;
        st.scale.set(COLUMN - 0.16, Math.max(part, 0.001), TANK.d * 0.6);
        st.position.set(x(3), 0.4 + stacked + part / 2, 0);
      }
      stacked += part;
    });
    if (line.current) {
      line.current.position.set(x(3), 0.4 + stacked, 0);
      line.current.visible = stacked > 0.05;
    }
    // Names under the tanks, amounts over them, and the total at the top of its column.
    const words: Array<[string, [number, number, number], number, number, number]> = [];
    KINDS.forEach((kind, i) => {
      const show = (kind === 'heat' ? heatOn : 1) * on;
      words.push([(wide ? NAMES : SHORT)[kind], [x(i), 0.3, TANK.d / 2], 0, -1, show]);
      words.push([kJ(parts[kind]), [x(i), 0.6 + level(parts[kind]) * TANK.h, TANK.d / 2], 0, 1, show]);
    });
    // The total: named under its column like the others, its amount over its line.
    words.push(['total', [x(3), 0.3, TANK.d / 2], 0, -1, on]);
    words.push([kJ(r.pe + r.ke + r.heat * heatOn), [x(3), 0.6 + stacked, TANK.d / 2], 0, 1, on]);
    words.forEach(([text, at, dx, dy, show], i) => {
      labels.current[i]?.position.set(...at);
      const el = texts.current[i];
      if (!el) return;
      if (said.current[i] !== text) {
        said.current[i] = text;
        el.textContent = text;
      }
      el.style.opacity = String(show);
      beside(el, dx, dy, 3);
    });
  }, -0.5);

  return (
    <group ref={root} visible={false}>
      <mesh position={[0.3, SET.h / 2 - 0.2, -TANK.d]} material={back} renderOrder={30}>
        <planeGeometry args={[SET.w + 1.6, SET.h + 3.2]} />
      </mesh>
      {KINDS.map((k, i) => (
        <group key={k}>
          <mesh ref={(el) => void (liquids.current[i] = el)} material={mats[i]} renderOrder={31}>
            <boxGeometry />
          </mesh>
          <mesh ref={(el) => void (stacks.current[i] = el)} material={mats[i]} renderOrder={31}>
            <boxGeometry />
          </mesh>
          <mesh
            ref={(el) => void (glasses.current[i] = el)}
            position={[x(i), 0.4 + TANK.h / 2, 0]}
            material={glass}
            renderOrder={32}
          >
            <boxGeometry args={[TANK.w, TANK.h, TANK.d]} />
          </mesh>
        </group>
      ))}
      <mesh position={[x(3), 0.4 + TANK.h / 2, 0]} material={glass} renderOrder={32}>
        <boxGeometry args={[COLUMN, TANK.h, TANK.d * 0.7]} />
      </mesh>
      <mesh ref={line} renderOrder={33}>
        <boxGeometry args={[COLUMN + 0.9, 0.1, TANK.d * 0.8]} />
        <meshBasicMaterial color={SYM10.chalk} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={i >= 6 ? SYM10.chalk : SYM10[KINDS[Math.floor(i / 2)]!]}
          />
        </group>
      ))}
    </group>
  );
}
