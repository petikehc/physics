import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { firstHeard, type V3 } from '../math';
import { AHEAD, BEHIND, dopplerRig, KERB, source, SYM9, UNDER, type DopplerRig } from '../rig';
import { EAR_H, hearingAt } from '../sound';

/** When the sound first reached a listener standing at `at` (the jet's boom), on the slowed run's clock. */
function firstArrival(rig: DopplerRig, at: V3): number {
  const s = source(rig);
  if (s.now <= rig.from) return Infinity;
  return firstHeard(s.path, s.at[1], s.at[2], s.c, [at[0], at[1] + EAR_H, at[2]], rig.from, s.now).at;
}

type Who = 'ahead' | 'behind' | 'under' | 'you';
const WHO: Who[] = ['ahead', 'behind', 'under', 'you'];
const COLOURS: Record<Who, string> = { ahead: SYM9.blue, behind: SYM9.red, under: SYM9.chalk, you: SYM9.ear };

/**
 * People on the pavement: one ahead of the ambulance and one behind it, each labelled with what they hear; one under
 * the jet's path; and in Your turn and the Lab, you, wherever you are put.
 */
export function Listeners() {
  const rig = dopplerRig();
  const groups = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef<string[]>([]);
  const body = useMemo(() => new THREE.CapsuleGeometry(0.2, 0.8, 4, 12), []);
  const head = useMemo(() => new THREE.SphereGeometry(0.15, 14, 10), []);
  const ring = useMemo(() => {
    const g = new THREE.RingGeometry(0.42, 0.5, 40);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const mats = useMemo(
    () =>
      WHO.map(
        (w) =>
          new THREE.MeshStandardMaterial({
            color: '#2a2e38',
            roughness: 0.7,
            emissive: COLOURS[w],
            emissiveIntensity: 0.18,
          }),
      ),
    [],
  );
  const rings = useMemo(
    () =>
      WHO.map(
        (w) => new THREE.MeshBasicMaterial({ color: COLOURS[w], transparent: true, toneMapped: false }),
      ),
    [],
  );

  useFrame(() => {
    const story = clamp01(rig.listeners);
    const ambulance = rig.kind < 0.5;
    const place: Record<Who, V3> = {
      ahead: AHEAD,
      behind: BEHIND,
      under: UNDER,
      you: [rig.lx, KERB, rig.lz],
    };
    const shown: Record<Who, number> = {
      ahead: ambulance ? story : 0,
      behind: ambulance ? story : 0,
      under: ambulance ? 0 : story,
      you: clamp01(rig.you),
    };
    WHO.forEach((w, i) => {
      const g = groups.current[i];
      const el = texts.current[i];
      if (!g) return;
      g.visible = shown[w] > 0.01;
      g.position.set(...place[w]);
      rings[i]!.opacity = 0.8 * shown[w];
      if (!el) return;
      let words = '';
      if (g.visible) {
        const at = place[w];
        const h = hearingAt(rig, [at[0], at[1] + EAR_H, at[2]], w === 'you' ? rig.lm : 0);
        const lead = w === 'you' ? 'you hear' : 'hears';
        words = h === null ? `${lead} nothing yet` : `${lead} ${h.ratio.toFixed(2)} f`;
        // Just after the jet's cone has gone over, what they heard was a boom.
        if (w === 'under' && h !== null && source(rig).now - firstArrival(rig, at) < 1.6) words = 'boom!';
      }
      if (said.current[i] !== words) {
        said.current[i] = words;
        el.textContent = words;
      }
      el.style.opacity = String(w === 'you' ? shown[w] : shown[w] * clamp01(rig.hears));
      // The one under the jet's path is first seen at the right edge of the picture: name them up and to the left.
      if (w === 'under') beside(el, -1, 1, 2);
      else beside(el, 0, 1, 4);
    });
  });

  return (
    <group>
      {WHO.map((w, i) => (
        <group key={w} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <mesh geometry={body} material={mats[i]} position={[0, 0.62, 0]} />
          <mesh geometry={head} material={mats[i]} position={[0, 1.38, 0]} />
          <mesh geometry={ring} material={rings[i]} position={[0, 0.02, 0]} />
          <group position={[0, 1.75, 0]}>
            <MathLabel
              ref={(el) => void (texts.current[i] = el)}
              className="math-label math-label--small"
              color={COLOURS[w]}
            />
          </group>
        </group>
      ))}
    </group>
  );
}
