import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic, staggered } from '../../../engine/ease';
import { ellipsePoint, lawThree, PLANETS } from '../math';
import { AU, keplerRig, PILLARS, SYM4 } from '../rig';
import { planetAt, systemPoint } from '../system';

const OTHERS = PLANETS.filter((p) => p.id !== 'mars');
const sphereGeo = new THREE.SphereGeometry(1, 32, 20);
const ringGeo = new THREE.RingGeometry(1.45, 2.3, 64);
const pillarGeo = new THREE.CylinderGeometry(1, 1, 1, 28).translate(0, 0.5, 0);
const SHORT: Record<string, string> = {
  mercury: 'Me',
  venus: 'V',
  earth: 'E',
  mars: 'Ma',
  jupiter: 'J',
  saturn: 'S',
};

/**
 * Sets a material's opacity; while it is fading (`fade` below 1) it stops writing depth, so it never hides the
 * lines behind it.
 */
function fadeTo(mat: THREE.Material, opacity: number, fade = opacity) {
  mat.opacity = opacity;
  mat.depthWrite = fade > 0.99;
}

function orbitLine(p: (typeof PLANETS)[number]) {
  const pts: number[] = [];
  for (let i = 0; i <= 180; i++) {
    const [x, y] = ellipsePoint(p.a * AU, p.e, (i / 180) * Math.PI * 2);
    pts.push(...systemPoint(p, x, y, -0.003));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/**
 * The other five planets Kepler knew, each on its real orbit and turning at its real rate, and the third law's
 * row of pillars: each planet's year squared over its distance cubed, all reaching the same height.
 */
export function System() {
  const rig = keplerRig();
  const bodies = useRef<Array<THREE.Group | null>>([]);
  const pillars = useRef<Array<THREE.Group | null>>([]);
  const names = useRef<Array<HTMLDivElement | null>>([]);
  const nameAt = useRef<Array<THREE.Group | null>>([]);
  const ruleText = useRef<HTMLDivElement>(null);
  const ruleAt = useRef<THREE.Group>(null);
  const rule = useRef<ChalkLineHandle | null>(null);
  const mats = useMemo(
    () =>
      PLANETS.map(
        (p) =>
          new THREE.MeshStandardMaterial({
            color: p.color,
            roughness: 0.7,
            emissive: new THREE.Color(p.color).multiplyScalar(0.16),
            transparent: true,
          }),
      ),
    [],
  );
  const lineMats = useMemo(
    () => OTHERS.map(() => new THREE.LineBasicMaterial({ color: '#f4efe6', transparent: true, opacity: 0 })),
    [],
  );
  const lines = useMemo(() => OTHERS.map((p, i) => new THREE.Line(orbitLine(p), lineMats[i])), [lineMats]);
  const pillarMats = useMemo(
    () =>
      PLANETS.map(
        (p) =>
          new THREE.MeshStandardMaterial({
            color: p.color,
            emissive: new THREE.Color(p.color).multiplyScalar(0.3),
            roughness: 0.35,
            transparent: true,
            opacity: 0.8,
          }),
      ),
    [],
  );
  useEffect(() => () => lines.forEach((l) => l.geometry.dispose()), [lines]);

  useFrame((state) => {
    const on = clamp01(rig.system);
    const keep = 1 - clamp01(rig.dive);
    OTHERS.forEach((p, i) => {
      const g = bodies.current[i];
      const fade = p.id === 'earth' ? 1 : keep;
      if (g) {
        // Gone once faded: a see-through planet would still hide the orbit lines behind it.
        g.visible = on > 0.001 && fade > 0.01;
        g.position.set(...planetAt(p, rig.years));
        g.scale.setScalar(Math.max(p.size * easeOutCubic(on), 0.001));
      }
      fadeTo(mats[PLANETS.indexOf(p)]!, fade);
      lines[i]!.visible = on > 0.001;
      lineMats[i]!.opacity = on * (p.id === 'earth' ? 0.55 : 0.3 * keep);
    });

    // Pillars: in a row in front of the system, rising one after another.
    const narrow = state.size.width < 560;
    PLANETS.forEach((p, i) => {
      const k = easeOutCubic(staggered(rig.pillars, i, PLANETS.length, 0.1));
      const g = pillars.current[i];
      const x = PILLARS.x0 + i * PILLARS.dx;
      if (g) {
        g.visible = k > 0.001 && keep > 0.01;
        g.position.set(x, 0, PILLARS.z);
        const h = PILLARS.height * lawThree(p) * k;
        g.children[0]?.scale.set(PILLARS.radius, Math.max(h, 0.001), PILLARS.radius);
        g.children[1]?.position.set(0, h + 0.2, 0);
        g.children[1]?.scale.setScalar(Math.max(0.14 * k, 0.001));
      }
      fadeTo(pillarMats[i]!, 0.8 * keep, keep);
      // Mars is drawn by Orbit; here it only tops its pillar.
      if (p.id === 'mars') fadeTo(mats[i]!, keep);
      nameAt.current[i]?.position.set(x, -0.35 - (narrow ? (i % 2) * 0.45 : 0), PILLARS.z);
      const el = names.current[i];
      if (el) {
        el.style.opacity = String(k * keep);
        const text = narrow ? SHORT[p.id]! : p.name;
        if (el.textContent !== text) el.textContent = text;
      }
    });
    const all = clamp01((rig.pillars - 0.9) / 0.1) * keep;
    const y = PILLARS.height + 0.02;
    const xEnd = PILLARS.x0 + (PLANETS.length - 1) * PILLARS.dx;
    rule.current?.set(
      [
        [PILLARS.x0 - 0.5, y, PILLARS.z],
        [xEnd + 0.5, y, PILLARS.z],
      ],
      all,
      0.8 * all,
    );
    // Beside the line's end, or on a narrow screen under the row of names.
    ruleAt.current?.position.set(narrow ? (PILLARS.x0 + xEnd) / 2 : xEnd + 2.2, narrow ? -1.7 : y, PILLARS.z);
    if (ruleText.current) ruleText.current.style.opacity = String(all);
  });

  return (
    <group>
      {OTHERS.map((p, i) => (
        <group key={p.id} ref={(el) => void (bodies.current[i] = el)} visible={false}>
          <mesh geometry={sphereGeo} material={mats[PLANETS.indexOf(p)]} />
          {p.id === 'saturn' ? (
            <mesh geometry={ringGeo} material={mats[PLANETS.indexOf(p)]} rotation-x={-Math.PI / 2 + 0.47} />
          ) : null}
        </group>
      ))}
      {lines.map((l, i) => (
        <primitive key={`o-${OTHERS[i]!.id}`} object={l} />
      ))}
      {PLANETS.map((p, i) => (
        <group key={`p-${p.id}`} ref={(el) => void (pillars.current[i] = el)} visible={false}>
          <mesh geometry={pillarGeo} material={pillarMats[i]} />
          <mesh geometry={sphereGeo} material={mats[i]} />
        </group>
      ))}
      {PLANETS.map((p, i) => (
        <group key={`n-${p.id}`} ref={(el) => void (nameAt.current[i] = el)}>
          <MathLabel
            ref={(el) => void (names.current[i] = el)}
            className="math-label math-label--small"
            color={p.color}
          >
            {p.name}
          </MathLabel>
        </group>
      ))}
      <ChalkLine handle={rule} color={SYM4.area} width={1.6} />
      <group ref={ruleAt}>
        <MathLabel ref={ruleText} className="math-label math-label--chip" color={SYM4.area}>
          T² ÷ a³ = 1
        </MathLabel>
      </group>
    </group>
  );
}
