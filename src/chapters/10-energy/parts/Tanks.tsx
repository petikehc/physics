import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { glassMaterial, waterMaterial } from '../../../engine/materials/water';
import { energyRig, SYM10 } from '../rig';
import { readGauge } from '../sandbox';

/** Each tank's size, and the gap between their centres; the total's column is narrower. */
const TANK = { w: 3, h: 9, d: 2, gap: 3.7 };
const COLUMN = 1.5;
const KINDS = ['pe', 'ke', 'heat'] as const;
type Kind = (typeof KINDS)[number];
const NAMES: Record<Kind, string> = { pe: 'height · mgh', ke: 'speed · ½mv²', heat: 'heat' };

const kJ = (j: number) => `${Math.round(j / 1000)} kJ`;

/**
 * Three glass tanks of the train's energy, standing by the track: height's part, speed's part, and friction's heat,
 * each as full as that much energy. Beside them, a column with all three stacked: its top, the total, never moves.
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
  const mats = useMemo(() => KINDS.map((k) => waterMaterial(SYM10[k])), []);
  const glass = useMemo(() => glassMaterial.clone(), []);

  const x = (i: number) => (i - 1.5) * TANK.gap;

  useFrame(() => {
    const on = clamp01(rig.tanks);
    const g = root.current;
    if (!g) return;
    g.visible = on > 0.01;
    g.position.set(rig.gx, 0, rig.gz);
    const r = readGauge(rig);
    const heatOn = clamp01(rig.heat);
    const parts: Record<Kind, number> = { pe: r.pe, ke: r.ke, heat: r.heat };
    const level = (j: number) => clamp01(j / Math.max(r.full, 1));
    let stacked = 0;
    KINDS.forEach((k, i) => {
      const show = k === 'heat' ? heatOn : 1;
      const f = level(parts[k]) * TANK.h;
      const liq = liquids.current[i];
      if (liq) {
        liq.visible = f > 0.01 && show > 0.01;
        liq.scale.set(TANK.w - 0.2, Math.max(f, 0.001), TANK.d - 0.2);
        liq.position.set(x(i), 0.4 + f / 2, 0);
      }
      const gl = glasses.current[i];
      if (gl) gl.visible = show > 0.01;
      // The same energy stacked in the total's column (heat only once it is counted).
      const part = level(parts[k]) * TANK.h * (k === 'heat' ? heatOn : 1);
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
    KINDS.forEach((k, i) => {
      const show = (k === 'heat' ? heatOn : 1) * on;
      words.push([NAMES[k], [x(i), 0.2, TANK.d / 2], 0, -1, show]);
      words.push([kJ(parts[k]), [x(i), 0.6 + level(parts[k]) * TANK.h, TANK.d / 2], 0, 1, show]);
    });
    words.push([`total ${kJ(r.pe + r.ke + r.heat * heatOn)}`, [x(3), 0.4 + stacked, TANK.d / 2], 0, 1, on]);
    words.forEach(([text, at, dx, dy, show], i) => {
      labels.current[i]?.position.set(...at);
      const el = texts.current[i];
      if (!el) return;
      if (said.current[i] !== text) {
        said.current[i] = text;
        el.textContent = text;
      }
      el.style.opacity = String(show);
      beside(el, dx, dy, 4);
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[TANK.gap * 3 + COLUMN + 2, 0.4, TANK.d + 1]} />
        <meshStandardMaterial color="#20232b" roughness={0.8} />
      </mesh>
      {KINDS.map((k, i) => (
        <group key={k}>
          <mesh
            ref={(el) => void (glasses.current[i] = el)}
            position={[x(i), 0.4 + TANK.h / 2, 0]}
            material={glass}
            renderOrder={5}
          >
            <boxGeometry args={[TANK.w, TANK.h, TANK.d]} />
          </mesh>
          <mesh ref={(el) => void (liquids.current[i] = el)} material={mats[i]} renderOrder={4}>
            <boxGeometry />
          </mesh>
          <mesh ref={(el) => void (stacks.current[i] = el)} material={mats[i]} renderOrder={4}>
            <boxGeometry />
          </mesh>
        </group>
      ))}
      <mesh position={[x(3), 0.4 + TANK.h / 2, 0]} material={glass} renderOrder={5}>
        <boxGeometry args={[COLUMN, TANK.h, TANK.d * 0.7]} />
      </mesh>
      <mesh ref={line} renderOrder={6}>
        <boxGeometry args={[COLUMN + 0.9, 0.08, TANK.d * 0.8]} />
        <meshBasicMaterial color={SYM10.chalk} toneMapped={false} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={i === 6 ? SYM10.chalk : SYM10[KINDS[Math.floor(i / 2)]!]}
          />
        </group>
      ))}
    </group>
  );
}
