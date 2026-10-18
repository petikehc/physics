import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { beside } from '../../../engine/labels/beside';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic, staggered } from '../../../engine/ease';
import { moonTest } from '../math';
import { MOON_ORBIT, MOON_RADIUS, newtonRig, RADIUS, SYM5 } from '../rig';
import { glowMaterial } from './glow';

const TEST = moonTest();
const BEADS = Math.round(TEST.distance);
const beadGeo = new THREE.SphereGeometry(0.42, 12, 8);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _t = new THREE.Vector3();

const ring: Pts = Array.from({ length: 257 }, (_, i) => {
  const a = (i / 256) * Math.PI * 2;
  return [Math.cos(a) * MOON_ORBIT, Math.sin(a) * MOON_ORBIT, 0];
});

const fmt = new Intl.NumberFormat('en-GB');

/**
 * The Moon on its orbit, to scale: 60 Earth radii out, marked off one radius at a time. And Newton's Moon test:
 * in one second the apple falls 4.9 m and the Moon 1.36 mm, 3,600 times less, and 3,600 is 60 × 60.
 */
export function Moon() {
  const rig = newtonRig();
  const moon = useRef<THREE.Group>(null);
  const orbit = useRef<ChalkLineHandle | null>(null);
  const beads = useRef<THREE.InstancedMesh>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const moonMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SYM5.moon,
        roughness: 0.9,
        emissive: new THREE.Color(SYM5.moon).multiplyScalar(0.35),
        transparent: true,
        // The Moon test is seen from far out: nothing in it fades into the fog.
        fog: false,
      }),
    [],
  );
  const halo = useMemo(() => Object.assign(glowMaterial('#e8eefc'), { fog: false }), []);
  const beadMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: SYM5.planet, transparent: true, toneMapped: false, fog: false }),
    [],
  );

  useFrame(() => {
    const on = clamp01(rig.moon);
    const a = rig.moonAngle;
    const x = Math.cos(a) * MOON_ORBIT;
    const y = Math.sin(a) * MOON_ORBIT;
    const g = moon.current;
    if (g) {
      g.visible = on > 0.001;
      g.position.set(x, y, 0);
    }
    moonMat.opacity = on;
    moonMat.depthWrite = on > 0.99;
    halo.opacity = on * 0.55;
    // Its orbit is drawn for the Moon test, with the distance.
    orbit.current?.set(ring, 1, on * 0.3 * clamp01(rig.sixty * 3));

    // One bead for every Earth radius between the Earth's centre and the Moon.
    const sixty = clamp01(rig.sixty);
    const b = beads.current;
    if (b) {
      b.visible = sixty > 0.001 && on > 0.001;
      for (let i = 0; i < BEADS; i++) {
        const k = easeOutCubic(staggered(sixty, i, BEADS, 0.012));
        const d = (i + 1) * RADIUS * (TEST.distance / BEADS);
        _t.set(Math.cos(a) * d, Math.sin(a) * d, 0);
        _s.setScalar(Math.max(k, 0.001));
        b.setMatrixAt(i, _m.compose(_t, _q, _s));
      }
      b.instanceMatrix.needsUpdate = true;
    }
    beadMat.opacity = sixty * 0.9;

    // Labels: the Moon, its distance, and the two falls. Each sits beside a point on the line out to the Moon,
    // to its left (n) or right, so none can cover another however small the picture is.
    const nx = -Math.sin(a);
    const ny = Math.cos(a);
    const falls = clamp01(rig.falls);
    const along = (k: number): [number, number] => [x * k, y * k];
    const place: Array<{ at: [number, number]; side: [number, number]; gap: number; show: number }> = [
      // The Moon's name, outwards, until its fall names it.
      { at: [x, y], side: [Math.cos(a), Math.sin(a)], gap: 10, show: on * (1 - falls) },
      { at: along(0.5), side: [nx, ny], gap: 10, show: sixty },
      { at: [0, 0], side: [-nx, -ny], gap: 10, show: falls },
      { at: [x, y], side: [nx, ny], gap: 12, show: falls },
      { at: along(0.3), side: [-nx, -ny], gap: 10, show: clamp01((rig.falls - 0.5) * 2) },
    ];
    place.forEach((l, i) => {
      labels.current[i]?.position.set(l.at[0], l.at[1], 0);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(l.show * on);
      beside(el, l.side[0], l.side[1], l.gap);
    });
  });

  const texts$ = [
    { text: 'Moon', color: SYM5.moon, cls: 'math-label math-label--small' },
    {
      text: `${Math.round(TEST.distance)} Earth radii`,
      color: SYM5.planet,
      cls: 'math-label math-label--chip',
    },
    {
      text: `apple: ${TEST.appleFall.toFixed(1)} m in 1 s`,
      color: SYM5.pull,
      cls: 'math-label math-label--chip',
    },
    {
      text: `Moon: ${(TEST.moonFall * 1000).toFixed(2)} mm in 1 s`,
      color: SYM5.pull,
      cls: 'math-label math-label--chip',
    },
    {
      // On two lines, narrow enough to sit beside the line on a phone.
      text: (
        <>
          {`${TEST.appleFall.toFixed(1)} m ÷ ${(TEST.moonFall * 1000).toFixed(2)} mm ≈ ${fmt.format(Math.round(TEST.ratio / 100) * 100)}`}
          <br />= 60 × 60
        </>
      ),
      color: SYM5.path,
      cls: 'math-label math-label--chip math-label--stack',
    },
  ];

  return (
    <group>
      <group ref={moon} visible={false}>
        <mesh material={moonMat}>
          <sphereGeometry args={[MOON_RADIUS, 32, 20]} />
        </mesh>
        <sprite material={halo} scale={MOON_RADIUS * 9} />
      </group>
      <ChalkLine handle={orbit} color={SYM5.moon} width={1.4} fog={false} />
      <instancedMesh ref={beads} args={[beadGeo, beadMat, BEADS]} visible={false} frustumCulled={false} />
      {texts$.map((l, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={l.cls} color={l.color}>
            {l.text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
