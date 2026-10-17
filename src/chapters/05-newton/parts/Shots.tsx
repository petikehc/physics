import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01 } from '../../../engine/ease';
import { flightAt, type Flight } from '../math';
import { playerFlight } from '../interaction';
import { flat, newtonRig, RADIUS, SHOT, STORY_FLIGHTS, SYM5 } from '../rig';
import { glowMaterial } from './glow';

/** Points drawn along each path, evenly in time. */
const STEPS = 240;
const UP = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();

interface Trace {
  times: number[];
  pts: Pts;
}

/** A flight's path in station space, sampled evenly in time over one orbit or the whole flight. */
function trace(f: Flight): Trace {
  const end = f.outcome === 'orbits' ? f.period : f.duration;
  const times = Array.from({ length: STEPS + 1 }, (_, i) => (end * i) / STEPS);
  return {
    times,
    pts: times.map((t) => {
      const p = flightAt(f, f.outcome === 'orbits' && t >= end ? end - 1e-9 : t);
      return flat(p.x, p.y, 0.004);
    }),
  };
}

/** The path flown by time `t`, ending at the ball, padded to a fixed length (see ChalkLine). */
function flown(f: Flight, tr: Trace, t: number): Pts {
  const end = Math.min(t, f.outcome === 'orbits' ? f.period : f.duration);
  const out: Pts = [];
  for (let i = 0; i < tr.times.length && tr.times[i]! < end; i++) out.push(tr.pts[i]!);
  const p = flightAt(f, f.outcome === 'orbits' && end >= f.period ? f.period - 1e-9 : end);
  out.push(flat(p.x, p.y, 0.004));
  while (out.length < tr.times.length + 1) out.push(out[out.length - 1]!);
  return out;
}

/** Kepler's ellipse for an orbit: the planet's centre at one focus, the launch (its nearest point) at the top. */
function keplerEllipse(f: Flight): Pts {
  const p = f.a * (1 - f.e * f.e);
  return Array.from({ length: 201 }, (_, i) => {
    const nu = (i / 200) * Math.PI * 2;
    const r = p / (1 + f.e * Math.cos(nu));
    return flat(r * Math.sin(nu), r * Math.cos(nu), 0.006);
  });
}

/** Points an arrow (built along +y from its base) from `from` along `dir`, `length` long. */
function aim(g: THREE.Group | null, from: THREE.Vector3, dir: THREE.Vector3, length: number, show: number) {
  if (!g) return;
  g.visible = show > 0.001 && length > 0.02;
  if (!g.visible) return;
  g.position.copy(from);
  g.quaternion.setFromUnitVectors(UP, _dir.copy(dir).normalize());
  const head = Math.min(0.09, length * 0.4);
  const shaft = g.children[0]!;
  shaft.scale.set(1, Math.max(length - head, 0.001), 1);
  const tip = g.children[1]!;
  tip.position.set(0, length - head, 0);
  tip.scale.setScalar(head / 0.09);
  ((shaft as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = show;
}

/** An arrow's shaft (one unit long, from its base up) and head (0.09 long, from its base up). */
const shaftGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 10).translate(0, 0.5, 0);
const headGeo = new THREE.ConeGeometry(0.035, 0.09, 14).translate(0, 0.045, 0);

/** An arrow drawn over everything, so it reads against the planet. */
function Arrow({ arrow, color }: { arrow: React.RefObject<THREE.Group | null>; color: string }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    [color],
  );
  return (
    <group ref={arrow} visible={false}>
      <mesh geometry={shaftGeo} material={mat} renderOrder={20} />
      <mesh geometry={headGeo} material={mat} renderOrder={20} />
    </group>
  );
}

/**
 * Newton's cannonballs. Each story shot draws its path as it flies (the earlier ones stay, faint, with a mark where
 * they landed); in Your turn and the Lab the viewer's own shot does the same. On the ball: its velocity, the pull
 * towards the planet's centre, and the straight line it would follow without that pull. Over the fast shot,
 * Kepler's ellipse, its focus at the planet's centre.
 */
export function Shots() {
  const rig = newtonRig();
  const ball = useRef<THREE.Group>(null);
  const active = useRef<ChalkLineHandle | null>(null);
  const ghosts = useMemo(() => STORY_FLIGHTS.map(() => ({ current: null as ChalkLineHandle | null })), []);
  const marks = useRef<Array<THREE.Mesh | null>>([]);
  const speedArrow = useRef<THREE.Group>(null);
  const pullArrow = useRef<THREE.Group>(null);
  const straight = useRef<ChalkLineHandle | null>(null);
  const gap = useRef<ChalkLineHandle | null>(null);
  const ellipse = useRef<ChalkLineHandle | null>(null);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const traces = useMemo(() => STORY_FLIGHTS.map(trace), []);
  const ellipsePts = useMemo(() => keplerEllipse(STORY_FLIGHTS[SHOT.ellipse]!), []);
  const custom = useRef<{ f: Flight; tr: Trace } | null>(null);
  const markMats = useMemo(
    () =>
      STORY_FLIGHTS.map(
        () => new THREE.MeshBasicMaterial({ color: SYM5.path, transparent: true, toneMapped: false }),
      ),
    [],
  );
  const ballMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fff1d6', transparent: true, toneMapped: false }),
    [],
  );
  const halo = useMemo(() => glowMaterial('#ffd9a0'), []);
  const _p = useMemo(() => new THREE.Vector3(), []);
  const _v = useMemo(() => new THREE.Vector3(), []);
  const _c = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const play = rig.interactive > 0.5;
    let f: Flight;
    let tr: Trace;
    if (play) {
      const shot = playerFlight();
      if (custom.current?.f !== shot) custom.current = { f: shot, tr: trace(shot) };
      f = custom.current.f;
      tr = custom.current.tr;
    } else {
      const i = Math.min(Math.max(Math.round(rig.shot), 0), STORY_FLIGHTS.length - 1);
      f = STORY_FLIGHTS[i]!;
      tr = traces[i]!;
    }
    const t = rig.fly;
    const show = clamp01(rig.ball);
    active.current?.set(flown(f, tr, t), 1, t > 0 ? show * 0.9 : 0);

    // The ball, wherever its flight has got to (an orbit goes on round).
    const p = flightAt(f, t);
    _p.set(...flat(p.x, p.y, 0.004));
    const b = ball.current;
    if (b) {
      b.visible = show > 0.001;
      b.position.copy(_p);
    }
    ballMat.opacity = show;
    halo.opacity = show * 0.8;

    // Earlier shots: their paths left faint, and a mark where each landed.
    const current = Math.round(rig.shot);
    STORY_FLIGHTS.forEach((g, i) => {
      const ghost = !play && i < current ? clamp01(rig.ghosts) : 0;
      ghosts[i]!.current?.set(traces[i]!.pts, 1, ghost * 0.32);
      const m = marks.current[i];
      if (!m) return;
      const landed = g.outcome === 'lands' && !play && (i < current || (i === current && t >= g.duration));
      const o = i < current ? ghost : show;
      m.visible = landed && o > 0.001;
      const end = flightAt(g, g.duration);
      m.position.set(...flat(end.x, end.y, 0.004));
      markMats[i]!.opacity = o * 0.9;
    });

    // Its velocity (along the path), the pull towards the centre (weaker farther out: 1/r²), and where it
    // would go without the pull: on in a straight line, while it actually falls away from it.
    const arrows = clamp01(rig.arrows) * show;
    const r = Math.hypot(p.x, p.y);
    const speed = Math.hypot(p.vx, p.vy);
    _v.set(p.vx, p.vy, 0);
    aim(speedArrow.current, _p, _v, 0.62 * speed, arrows);
    _c.set(-p.x, -p.y, 0);
    aim(pullArrow.current, _p, _c, 0.5 / (r * r), arrows);
    const lead = speed > 1e-6 ? (0.5 * r) / speed : 0;
    const s = clamp01(rig.straight) * show;
    _v.normalize();
    const ahead: [number, number, number] = [
      _p.x + _v.x * speed * lead * RADIUS,
      _p.y + _v.y * speed * lead * RADIUS,
      0.004,
    ];
    straight.current?.set([[_p.x, _p.y, 0.004], ahead], 1, s * 0.85);
    const q = flightAt(f, t + lead);
    const fell: [number, number, number] = flat(q.x, q.y, 0.004);
    gap.current?.set([ahead, fell], 1, s);
    labels.current[0]?.position.set(ahead[0] + _v.x * 0.25, ahead[1] + _v.y * 0.25, 0.01);
    labels.current[1]?.position.set(
      (ahead[0] + fell[0]) / 2 + _v.x * 0.28,
      (ahead[1] + fell[1]) / 2 + _v.y * 0.28,
      0.01,
    );
    if (texts.current[0]) texts.current[0].style.opacity = String(s);
    if (texts.current[1]) texts.current[1].style.opacity = String(s);

    // Kepler's ellipse over the fast shot, its focus at the planet's centre (and the empty one below it).
    const k = play ? 0 : clamp01(rig.kepler);
    ellipse.current?.set(ellipsePts, 1, k * 0.85);
    const fe = STORY_FLIGHTS[SHOT.ellipse]!;
    labels.current[2]?.position.set(0, -0.25, 0.01);
    labels.current[3]?.position.set(0, -2 * fe.a * fe.e * RADIUS - 0.25, 0.01);
    marks.current[STORY_FLIGHTS.length]?.position.set(0, -2 * fe.a * fe.e * RADIUS, 0.006);
    const fm = marks.current[STORY_FLIGHTS.length];
    if (fm) fm.visible = k > 0.001;
    if (texts.current[2]) texts.current[2].style.opacity = String(k);
    if (texts.current[3]) texts.current[3].style.opacity = String(k);
  });

  return (
    <group>
      <ChalkLine handle={active} color={SYM5.path} width={2.2} />
      {ghosts.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM5.path} width={1.6} />
      ))}
      <ChalkLine handle={ellipse} color={SYM5.kepler} width={2.4} />
      <ChalkLine handle={straight} color={SYM5.speed} width={1.8} renderOrder={21} depthTest={false} />
      <ChalkLine handle={gap} color={SYM5.pull} width={2.6} renderOrder={21} depthTest={false} />
      {[...STORY_FLIGHTS, null].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => void (marks.current[i] = el)}
          material={i < STORY_FLIGHTS.length ? markMats[i] : undefined}
          visible={false}
        >
          <sphereGeometry args={[i < STORY_FLIGHTS.length ? 0.016 : 0.05, 12, 8]} />
          {i === STORY_FLIGHTS.length ? <meshBasicMaterial color={SYM5.kepler} toneMapped={false} /> : null}
        </mesh>
      ))}
      <group ref={ball} visible={false}>
        <mesh material={ballMat}>
          <sphereGeometry args={[0.022, 16, 12]} />
        </mesh>
        <sprite material={halo} scale={0.16} />
      </group>
      <Arrow arrow={speedArrow} color={SYM5.speed} />
      <Arrow arrow={pullArrow} color={SYM5.pull} />
      {[
        ['straight on', SYM5.speed],
        ['falls', SYM5.pull],
        ['focus', SYM5.kepler],
        ['focus', SYM5.kepler],
      ].map(([text, color], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={color}
          >
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
