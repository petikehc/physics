import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic, lerp, staggered } from '../../../engine/ease';
import { bestCircle, ellipsePoint, foci, MARS, minorAxis, orbitAt, STORY } from '../math';
import { keplerRig, plane, SIGHTINGS, SYM4 } from '../rig';

const A = STORY.a;
const TAU = Math.PI * 2;
/** Height of the string loop above the orbit plane (half-way up the pins). */
const STRING_Y = 0.16;

const planetGeo = new THREE.SphereGeometry(1, 40, 24);
const dotGeo = new THREE.SphereGeometry(0.045, 16, 10);
const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10).translate(0, 0.17, 0);
const beadGeo = new THREE.SphereGeometry(0.05, 16, 10).translate(0, 0.36, 0);
const pencilGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10).translate(0, 0.31, 0);
const tipGeo = new THREE.ConeGeometry(0.03, 0.1, 10).rotateX(Math.PI).translate(0, 0.05, 0);

const marsMat = new THREE.MeshStandardMaterial({
  color: MARS.color,
  roughness: 0.75,
  emissive: new THREE.Color(MARS.color).multiplyScalar(0.18),
  // Always transparent: three compiles an opaque material with its alpha fixed at 1, so it could not fade.
  transparent: true,
});
const brass = new THREE.MeshStandardMaterial({ color: '#c9a25e', metalness: 0.6, roughness: 0.35 });
const wood = new THREE.MeshStandardMaterial({ color: '#d9b77e', roughness: 0.6, emissive: '#2a1d0c' });

/** Points round the ellipse from perihelion, evenly in eccentric anomaly (as the pencil draws it). */
function ellipsePts(e: number, n = 160): Pts {
  return Array.from({ length: n + 1 }, (_, i) => {
    const [x, y] = ellipsePoint(A, e, (i / n) * TAU);
    return plane(x, y, 0.002);
  });
}

const CRESCENT_STEPS = 64;

/** Positions of the two crescents between the best circle and the ellipse (where Kepler's circle missed Mars). */
function crescentPositions(e: number, out: Float32Array) {
  const { cx, r } = bestCircle(A, e);
  const b = minorAxis(A, e);
  let o = 0;
  for (const half of [0, 1]) {
    for (let i = 0; i <= CRESCENT_STEPS; i++) {
      const E = (half + i / CRESCENT_STEPS) * Math.PI;
      const x = cx + r * Math.cos(E);
      out.set([...plane(x, r * Math.sin(E), -0.004), ...plane(x, b * Math.sin(E), -0.004)], o);
      o += 6;
    }
  }
  return out;
}

function crescentGeometry() {
  const idx: number[] = [];
  for (const half of [0, 1]) {
    const base = half * (CRESCENT_STEPS + 1) * 2;
    for (let i = 0; i < CRESCENT_STEPS; i++) {
      const k = base + i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(2 * (CRESCENT_STEPS + 1) * 2 * 3);
  g.setAttribute('position', new THREE.BufferAttribute(crescentPositions(STORY.e, pos), 3));
  g.setIndex(idx);
  return g;
}

/**
 * Mars and everything drawn about its orbit: the trail it leaves, Tycho's sightings, the best circle and the
 * crescents where it misses, the pins, string and pencil that draw the ellipse, and the ellipse itself.
 */
export function Orbit() {
  const rig = keplerRig();
  const planet = useRef<THREE.Mesh>(null);
  const dots = useRef<Array<THREE.Mesh | null>>([]);
  const pins = useRef<THREE.Group>(null);
  const pinB = useRef<THREE.Group>(null);
  const pencil = useRef<THREE.Group>(null);
  const crescent = useRef<THREE.Mesh>(null);
  const trail = useRef<ChalkLineHandle | null>(null);
  const circle = useRef<ChalkLineHandle | null>(null);
  const loop = useRef<ChalkLineHandle | null>(null);
  const ellipse = useRef<ChalkLineHandle | null>(null);
  const marsLabel = useRef<THREE.Group>(null);
  const marsText = useRef<HTMLDivElement>(null);
  const focusLabels = useRef<Array<THREE.Group | null>>([]);
  const focusTexts = useRef<Array<HTMLDivElement | null>>([]);
  const missLabel = useRef<THREE.Group>(null);
  const missText = useRef<HTMLDivElement>(null);
  const cache = useRef({ e: -1, ellipse: [] as Pts, circle: [] as Pts });
  const dotMats = useMemo(
    () =>
      SIGHTINGS.map(
        () => new THREE.MeshBasicMaterial({ color: SYM4.sighting, transparent: true, toneMapped: false }),
      ),
    [],
  );
  const crescentMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: SYM4.miss,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );
  const crescentGeo = useMemo(() => crescentGeometry(), []);
  const _miss = useMemo(() => new THREE.Color(SYM4.miss), []);
  const _white = useMemo(() => new THREE.Color(SYM4.sighting), []);

  useFrame(() => {
    const e = rig.e;
    const c = cache.current;
    if (c.e !== e) {
      c.e = e;
      c.ellipse = ellipsePts(e);
      const bc = bestCircle(A, e);
      c.circle = Array.from({ length: 129 }, (_, i) =>
        plane(bc.cx + bc.r * Math.cos((i / 128) * TAU), bc.r * Math.sin((i / 128) * TAU), 0.003),
      );
      const attr = crescentGeo.getAttribute('position') as THREE.BufferAttribute;
      crescentPositions(e, attr.array as Float32Array);
      attr.needsUpdate = true;
    }

    // Mars, wherever its year has got to (in the solar-system view the years run on).
    const phase = rig.phase + rig.years / MARS.T;
    const p = orbitAt(A, e, phase);
    const m = planet.current;
    if (m) {
      m.visible = rig.planet > 0.001;
      m.position.set(...plane(p.x, p.y));
      m.scale.setScalar(Math.max(lerp(0.14, 0.11, rig.system) * easeOutCubic(rig.planet), 0.001));
      marsMat.opacity = 1 - clamp01(rig.dive);
    }
    marsLabel.current?.position.set(...plane(p.x, p.y, 0.42));
    if (marsText.current) marsText.current.style.opacity = String(clamp01(rig.trail) * clamp01(rig.planet));

    // The trail: the last fifth of an orbit, behind the planet.
    const tr: Pts = [];
    for (let i = 0; i <= 40; i++) {
      const q = orbitAt(A, e, phase - 0.2 * (1 - i / 40));
      tr.push(plane(q.x, q.y, 0.004));
    }
    trail.current?.set(tr, 1, clamp01(rig.trail) * 0.7 * clamp01(rig.planet));

    // Tycho's sightings: dots that appear one by one; once the circle is in, those it misses turn red.
    const bc = bestCircle(A, e);
    SIGHTINGS.forEach((s, i) => {
      const d = dots.current[i];
      if (!d) return;
      const k = staggered(rig.sightings, i, SIGHTINGS.length, 0.05);
      d.visible = k > 0.001;
      const q = orbitAt(A, e, s);
      d.position.set(...plane(q.x, q.y, 0.01));
      d.scale.setScalar(Math.max(easeOutCubic(k) * (1 + 0.6 * (1 - k)), 0.001));
      const off = Math.abs(Math.hypot(q.x - bc.cx, q.y) - bc.r) / bc.miss;
      dotMats[i]!.color.lerpColors(_white, _miss, clamp01(rig.miss) * clamp01(off * 1.6));
      dotMats[i]!.opacity = k;
    });
    circle.current?.set(c.circle, rig.circle, 0.7);
    crescentMat.opacity = clamp01(rig.miss) * 0.3;
    if (crescent.current) crescent.current.visible = rig.miss > 0.001;
    missLabel.current?.position.set(...plane(bc.cx, (bc.r + minorAxis(A, e)) / 2 + 0.25, 0.05));
    if (missText.current) missText.current.style.opacity = String(clamp01(rig.miss));

    // Pins at the foci, the pencil on the string, and the line it leaves.
    const [fa, fb] = foci(A, e);
    const showPins = rig.pins > 0.001;
    const grow = easeOutCubic(rig.pins);
    if (pins.current) {
      pins.current.visible = showPins;
      pins.current.position.set(...plane(fa[0], fa[1]));
      pins.current.scale.set(1, Math.max(grow, 0.001), 1);
    }
    if (pinB.current) {
      pinB.current.visible = showPins;
      pinB.current.position.set(...plane(fb[0], fb[1]));
      pinB.current.scale.set(1, Math.max(grow, 0.001), 1);
    }
    // "focus" under each pin (from above, a pin is only a dot).
    [fa, fb].forEach((f, i) => {
      focusLabels.current[i]?.position.set(...plane(f[0], f[1] - 0.42, 0.05));
      const el = focusTexts.current[i];
      if (el) el.style.opacity = String(clamp01(rig.pins));
    });
    const [px, py] = ellipsePoint(A, e, clamp01(rig.draw) * TAU);
    if (pencil.current) {
      pencil.current.visible = showPins;
      pencil.current.position.set(...plane(px, py));
      pencil.current.scale.setScalar(Math.max(grow, 0.001));
    }
    loop.current?.set(
      [
        plane(fa[0], fa[1], STRING_Y),
        plane(px, py, STRING_Y),
        plane(fb[0], fb[1], STRING_Y),
        plane(fa[0], fa[1], STRING_Y),
      ],
      1,
      clamp01(rig.pins) * 0.9,
    );
    ellipse.current?.set(c.ellipse, clamp01(rig.draw), clamp01(rig.ellipse) * (1 - 0.6 * rig.dive));
  });

  return (
    <group>
      <mesh ref={planet} geometry={planetGeo} material={marsMat} visible={false} />
      <group ref={marsLabel}>
        <MathLabel ref={marsText} className="math-label math-label--small" color={MARS.color}>
          Mars
        </MathLabel>
      </group>
      <ChalkLine handle={trail} color="#f0a77f" width={2} />
      <ChalkLine handle={circle} color="#f4efe6" width={1.6} />
      <ChalkLine handle={ellipse} color="#f4efe6" width={2.4} />
      <ChalkLine handle={loop} color={SYM4.string} width={1.4} />
      {SIGHTINGS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => void (dots.current[i] = el)}
          geometry={dotGeo}
          material={dotMats[i]}
          visible={false}
        />
      ))}
      <mesh ref={crescent} geometry={crescentGeo} material={crescentMat} visible={false} />
      <group ref={missLabel}>
        <MathLabel ref={missText} className="math-label math-label--chip" color={SYM4.miss}>
          8′ off
        </MathLabel>
      </group>
      {[0, 1].map((i) => (
        <group key={i} ref={(el) => void (focusLabels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (focusTexts.current[i] = el)}
            className="math-label math-label--small"
            color={SYM4.string}
          >
            focus
          </MathLabel>
        </group>
      ))}
      <group ref={pins} visible={false}>
        <mesh geometry={pinGeo} material={brass} />
        <mesh geometry={beadGeo} material={brass} />
      </group>
      <group ref={pinB} visible={false}>
        <mesh geometry={pinGeo} material={brass} />
        <mesh geometry={beadGeo} material={brass} />
      </group>
      <group ref={pencil} visible={false}>
        <mesh geometry={pencilGeo} material={wood} />
        <mesh geometry={tipGeo} material={brass} />
      </group>
    </group>
  );
}
