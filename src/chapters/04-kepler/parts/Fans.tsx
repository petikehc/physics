import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, lerp } from '../../../engine/ease';
import { fanOutline, orbitAt, STORY } from '../math';
import { keplerRig, MAX_FANS, pickedFans, plane, SYM4 } from '../rig';

const A = STORY.a;
const STEPS = 40;

/** A triangle fan from the Sun to STEPS + 1 points along the orbit; its positions are rewritten in place. */
function fanGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((STEPS + 2) * 3), 3));
  const idx: number[] = [];
  for (let i = 1; i <= STEPS; i++) idx.push(0, i, i + 1);
  g.setIndex(idx);
  return g;
}

/**
 * Kepler's second law made visible: the orbit cut into fans swept in equal times, alternately shaded in the
 * area's amber, with a mark in time's blue at each tick along the orbit. The fan being swept grows with the
 * planet; in Your turn the one the planet is crossing lights up.
 */
export function Fans() {
  const rig = keplerRig();
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const geos = useMemo(() => Array.from({ length: MAX_FANS }, fanGeometry), []);
  const mats = useMemo(
    () =>
      Array.from(
        { length: MAX_FANS },
        () =>
          new THREE.MeshBasicMaterial({
            color: SYM4.area,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );
  const tickGeo = useMemo(() => new THREE.SphereGeometry(0.05, 12, 8), []);
  const tickMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: SYM4.time, transparent: true, toneMapped: false }),
    [],
  );
  const keys = useRef<string[]>([]);
  const _m = useMemo(() => new THREE.Matrix4(), []);

  useFrame(() => {
    const n = Math.max(1, Math.min(MAX_FANS, Math.round(rig.fanCount)));
    const e = rig.e;
    const show = clamp01(rig.fans);
    const swept = Math.min(rig.swept, n);
    const picked = pickedFans(n);
    const pick = clamp01(rig.pick);
    const live = rig.interactive > 0.5 || rig.lab > 0.5;
    const current = Math.floor((((rig.phase % 1) + 1) % 1) * n);

    for (let k = 0; k < MAX_FANS; k++) {
      const mesh = meshes.current[k];
      if (!mesh) continue;
      const reach = Math.min(1, swept - k);
      mesh.visible = k < n && show > 0.001 && reach > 0.001;
      if (!mesh.visible) continue;
      const key = `${n}:${e.toFixed(5)}:${reach.toFixed(4)}`;
      if (keys.current[k] !== key) {
        keys.current[k] = key;
        const pts = fanOutline(A, e, k / n, (k + reach) / n, STEPS);
        const attr = geos[k]!.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        pts.forEach(([x, y], i) => arr.set(plane(x, y, -0.002), i * 3));
        attr.needsUpdate = true;
        geos[k]!.computeBoundingSphere();
      }
      const base = k % 2 === 0 ? 0.42 : 0.26;
      const isPicked = picked.includes(k);
      let o = lerp(base, isPicked ? 0.72 : 0.08, pick);
      if (live && k === current) o = Math.min(0.85, o + 0.3);
      mats[k]!.opacity = o * show;
    }

    // Ticks: where the planet was at each equal step of time.
    const t = ticks.current;
    if (t) {
      t.count = n;
      for (let k = 0; k < n; k++) {
        const q = orbitAt(A, e, k / n);
        const on = swept >= k ? 1 : 0;
        _m.makeScale(on, on, on).setPosition(...plane(q.x, q.y, 0.01));
        t.setMatrixAt(k, _m);
      }
      t.instanceMatrix.needsUpdate = true;
      t.visible = show > 0.001;
      tickMat.opacity = show;
    }

    // "Same area" on the two picked fans.
    picked.forEach((k, i) => {
      const pts = fanOutline(A, e, k / n, (k + 1) / n, 12);
      let cx = 0;
      let cy = 0;
      for (const [x, y] of pts) {
        cx += x;
        cy += y;
      }
      labels.current[i]?.position.set(...plane(cx / pts.length, cy / pts.length, 0.05));
      const el = texts.current[i];
      if (el) {
        el.style.opacity = String(pick * show);
        const text = `1/${n} of the area`;
        if (el.textContent !== text) el.textContent = text;
      }
    });
  });

  return (
    <group>
      {geos.map((g, k) => (
        <mesh
          key={k}
          ref={(el) => void (meshes.current[k] = el)}
          geometry={g}
          material={mats[k]}
          visible={false}
          renderOrder={1}
        />
      ))}
      <instancedMesh ref={ticks} args={[tickGeo, tickMat, MAX_FANS]} visible={false} renderOrder={3} />
      {[0, 1].map((i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--chip"
            color={SYM4.area}
          >
            {''}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
