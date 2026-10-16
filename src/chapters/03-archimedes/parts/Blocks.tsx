import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, staggered } from '../../../engine/ease';
import { FLUIDS, MATERIALS, settle, type Substance } from '../math';
import { waterY } from '../hang';
import { archimedesRig, BLOCK, LINEUP, SYM3, TANK, uv } from '../rig';

const _tint = new THREE.Color();
const blockGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK).translate(0, BLOCK / 2, 0);
/** Where a block starts its drop, above the water. */
const DROP_FROM = TANK.h + 0.75;

function substance(id: string): Substance {
  return MATERIALS.find((m) => m.id === id) ?? MATERIALS[0]!;
}

/** Bottom of a block once settled: floating with `fraction` under the surface, or resting on the floor. */
export function restingBottom(density: number, fluidDensity: number, level = 1) {
  const s = settle(density, fluidDensity);
  return s.floats ? waterY(level) - s.fraction * BLOCK : TANK.floor;
}

/**
 * A block drawn twice, split at the waterline by clipping planes: its own material above, and a glowing
 * version below, so the part under the surface (the volume of water it displaces) shows.
 */
function useSplitMaterials() {
  return useMemo(() => {
    const above = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const below = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const top = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      clippingPlanes: [above],
      transparent: true,
    });
    const under = new THREE.MeshStandardMaterial({
      color: SYM3.push,
      emissive: new THREE.Color(SYM3.push),
      emissiveIntensity: 0.4,
      roughness: 0.4,
      clippingPlanes: [below],
      transparent: true,
    });
    return {
      top,
      under,
      setWater(y: number) {
        above.constant = -y;
        below.constant = y;
      },
      setSubstance(s: Substance, opacity: number) {
        top.color.set(s.color);
        top.metalness = s.density > 2 ? 0.6 : 0;
        top.roughness = s.id === 'ice' ? 0.15 : s.density > 2 ? 0.3 : 0.7;
        const clear = s.id === 'ice' ? 0.82 : 1;
        top.opacity = clear * opacity;
        under.opacity = 0.9 * opacity;
        // Under the surface: still recognisably itself, washed with the water's glow.
        under.color.set(SYM3.push).lerp(_tint.set(s.color), 0.6);
        under.emissive.set(SYM3.push).lerp(_tint.set(s.color), 0.3);
      },
    };
  }, []);
}

/** Damped bob after a drop: offset from rest, `t` seconds after the block reached the water. */
function bob(t: number, amplitude: number) {
  if (t <= 0) return 0;
  return -amplitude * Math.exp(-t * 2.4) * Math.cos(t * 7.5);
}

function Block({
  place,
}: {
  place: () => { u: number; bottom: number; water: number; s: Substance; opacity: number } | null;
}) {
  const mesh = useRef<THREE.Group>(null);
  const m = useSplitMaterials();
  useEffect(
    () => () => {
      m.top.dispose();
      m.under.dispose();
    },
    [m],
  );
  useFrame(() => {
    const g = mesh.current;
    if (!g) return;
    const p = place();
    g.visible = p !== null;
    if (!p) return;
    g.position.set(...uv(p.u, 0, p.bottom));
    m.setWater(p.water);
    m.setSubstance(p.s, p.opacity);
  });
  return (
    <group ref={mesh} visible={false}>
      <mesh geometry={blockGeo} material={m.top} castShadow />
      <mesh geometry={blockGeo} material={m.under} />
    </group>
  );
}

/** The density line-up (wood, ice, gold) and the Your-turn block. */
export function Blocks() {
  const rig = archimedesRig();
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const was = gl.localClippingEnabled;
    gl.localClippingEnabled = true;
    return () => {
      gl.localClippingEnabled = was;
    };
  }, [gl]);

  // Each line-up block drops in turn, splashes and bobs to rest. Deterministic in rig.lineup.
  const lineupPlace = (i: number) => () => {
    if (rig.lineup <= 0.001) return null;
    const { material, u } = LINEUP[i]!;
    const s = substance(material);
    const water = waterY(rig.level);
    const rest = restingBottom(s.density, FLUIDS[1]!.density, rig.level);
    const q = staggered(rig.lineup, i, LINEUP.length, 0.22);
    // Fall for the first 30 % of q, then bob (q is mapped to about 2.5 s of motion).
    const fall = clamp01(q / 0.3);
    const y = DROP_FROM + (rest - DROP_FROM) * fall * fall;
    const settleT = (q - 0.3) * 3.6;
    const sinks = rest === TANK.floor;
    return {
      u,
      bottom: q < 0.3 ? y : rest + (sinks ? 0 : bob(settleT, 0.12)),
      water,
      s,
      opacity: clamp01(rig.lineup * 6) * (1 - clamp01(rig.play * 2)),
    };
  };

  // Your turn: one block in the centre, a spring pulling it to rest for the chosen material and fluid.
  const sim = useRef({ y: DROP_FROM, v: 0, key: '' });
  const playPlace = () => {
    if (rig.play <= 0.001) {
      sim.current.key = '';
      return null;
    }
    const s = MATERIALS[Math.round(rig.material)] ?? MATERIALS[2]!;
    return { u: 0, bottom: sim.current.y, water: waterY(rig.level), s, opacity: clamp01(rig.play) };
  };

  useFrame((_, dt) => {
    if (rig.play <= 0.001) return;
    const s = MATERIALS[Math.round(rig.material)] ?? MATERIALS[2]!;
    const f = FLUIDS[Math.round(rig.fluid)] ?? FLUIDS[1]!;
    const st = sim.current;
    const key = s.id;
    // A new material drops in from above; a new fluid just lets the block find its new level.
    if (key !== st.key) {
      st.y = DROP_FROM;
      st.v = 0;
      st.key = key;
    }
    const rest = restingBottom(s.density, f.density, rig.level);
    const step = Math.min(dt, 1 / 30);
    const inAir = st.y > waterY(rig.level);
    if (inAir) st.v -= 9.8 * 0.35 * step;
    else st.v += ((rest - st.y) * 40 - st.v * 6) * step;
    st.y = Math.max(TANK.floor, st.y + st.v * step);
    if (st.y === TANK.floor) st.v = Math.max(st.v, 0);
  });

  return (
    <group>
      {LINEUP.map((_, i) => (
        <Block key={i} place={lineupPlace(i)} />
      ))}
      <Block place={playPlace} />
      <LineupLabels />
    </group>
  );
}

/** "50 % under", "92 % under", "sinks" over the line-up blocks. */
function LineupLabels() {
  const rig = archimedesRig();
  const groups = useRef<Array<THREE.Group | null>>([]);
  const els = useRef<Array<HTMLDivElement | null>>([]);
  useFrame(() => {
    LINEUP.forEach(({ material, u }, i) => {
      const s = substance(material);
      const { floats, fraction } = settle(s.density, FLUIDS[1]!.density);
      groups.current[i]?.position.set(...uv(u, 0, TANK.h + 0.42));
      const el = els.current[i];
      if (!el) return;
      const q = staggered(rig.lineup, i, LINEUP.length, 0.22);
      el.style.opacity = String(clamp01((q - 0.55) * 4) * (1 - clamp01(rig.play * 2)));
      // Two short lines, so the three labels fit side by side on a phone.
      const t = `${s.name} ${s.density}\n${floats ? `${Math.round(fraction * 100)} % under` : 'sinks'}`;
      if (el.textContent !== t) {
        el.textContent = t;
        el.style.whiteSpace = 'pre-line';
        el.style.textAlign = 'center';
      }
    });
  });
  return (
    <>
      {LINEUP.map((_, i) => (
        <group key={i} ref={(el) => void (groups.current[i] = el)}>
          <MathLabel
            ref={(el) => void (els.current[i] = el)}
            className="math-label math-label--chip"
            color="#f4efe6"
          >
            {''}
          </MathLabel>
        </group>
      ))}
    </>
  );
}
