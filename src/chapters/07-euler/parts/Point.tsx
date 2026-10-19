import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { thetaText } from '../math';
import { C, eulerRig, K, onPlane, R, SYM7, THETA_MAX } from '../rig';
import { Arrow } from './Arrow';
import { aim } from './aim';

/** Samples along the way the point has come (two turns' worth at most). */
const TRAIL = 480;
const ARC = 64;
/** The radii (as shares of the circle's) of the angle's arc and of the quarter turns' arcs. */
const ANGLE_R = 0.3;
const TURN_R = 0.42;
/** The push is drawn this long (a share of the point's own arrow). */
const PUSH = 0.75;
const TICK = 0.14;

type V3 = [number, number, number];
type LineRef = { current: ChalkLineHandle | null };

/** Angles a resting point is named at: e^{iπ/2} = i, and so on. */
const AT: Record<string, string> = {
  '0': '1',
  'π/2': 'i',
  π: '−1',
  '−π/2': '−i',
  '3π/2': '−i',
  '2π': '1',
  '−π': '−1',
};

/**
 * The point e^{iθ} and everything that rides with it: its arrow from the centre, its push at right angles, the angle
 * it has turned, and the way it has come, round the circle or, drawn out along time, a helix. Also the chapter's
 * first picture: an arrow from 1 turned a quarter turn at a time, × i each time.
 */
export function Point() {
  const rig = eulerRig();
  const point = useRef<THREE.Mesh>(null);
  const arrows = useRef<Array<THREE.Group | null>>([]);
  const trail = useRef<ChalkLineHandle | null>(null);
  const angle = useRef<ChalkLineHandle | null>(null);
  const tick = useRef<ChalkLineHandle | null>(null);
  const axis = useRef<ChalkLineHandle | null>(null);
  const turns = useMemo<LineRef[]>(() => [0, 1, 2, 3].map(() => ({ current: null })), []);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef('');
  const last = useRef(NaN);
  const trailPts = useMemo<Pts>(() => Array.from({ length: TRAIL + 1 }, () => [0, 0, 0]), []);
  const arcPts = useMemo<Pts>(() => Array.from({ length: ARC + 1 }, () => [0, 0, 0]), []);
  const turnPts = useMemo<Pts[]>(
    () => [0, 1, 2, 3].map(() => Array.from({ length: ARC / 4 + 1 }, (): V3 => [0, 0, 0])),
    [],
  );

  useFrame(() => {
    const th = rig.theta;
    const along = clamp01(rig.along);
    const on = clamp01(rig.point);
    const [c, s] = [Math.cos(th), Math.sin(th)];
    const p = onPlane(c, s, along * th);
    const centre: V3 = [C[0], C[1], C[2] - K * along * th];
    if (point.current) {
      point.current.visible = on > 0.01;
      point.current.position.set(...p);
    }
    aim(arrows.current[0] ?? null, centre, p, on * 0.9);
    // The push: a quarter turn on from the point's arrow, with the right angle marked where they meet.
    const push = clamp01(rig.push) * on;
    const end: V3 = [p[0] - s * R * PUSH, p[1] + c * R * PUSH, p[2]];
    aim(arrows.current[1] ?? null, p, end, push, 0.02);
    tick.current?.set(
      [
        [p[0] - c * TICK, p[1] - s * TICK, p[2]],
        [p[0] - c * TICK - s * TICK, p[1] - s * TICK + c * TICK, p[2]],
        [p[0] - s * TICK, p[1] + c * TICK, p[2]],
      ],
      1,
      push * 0.8,
    );

    // The way it has come: from θ = 0 round to θ, laid back along time by `along`.
    for (let i = 0; i <= TRAIL; i++) {
      const t = (i / TRAIL) * th;
      const q = onPlane(Math.cos(t), Math.sin(t), along * t);
      trailPts[i]![0] = q[0];
      trailPts[i]![1] = q[1];
      trailPts[i]![2] = q[2];
    }
    trail.current?.set(trailPts, 1, Math.abs(th) > 1e-3 ? clamp01(rig.trail) : 0);
    axis.current?.set(
      [
        [C[0], C[1], C[2] + 0.4],
        [C[0], C[1], C[2] - K * THETA_MAX - 0.6],
      ],
      along,
      0.45 * along * clamp01(rig.trail),
    );

    // The angle, as an arc near the centre (only while the point goes round in the plane).
    const shown = clamp01(rig.angle) * (1 - along);
    const sweep = Math.max(Math.min(th, Math.PI * 2), -Math.PI * 2);
    for (let i = 0; i <= ARC; i++) {
      const t = (i / ARC) * sweep;
      const q = onPlane(Math.cos(t) * ANGLE_R, Math.sin(t) * ANGLE_R, 0);
      arcPts[i]![0] = q[0];
      arcPts[i]![1] = q[1];
      arcPts[i]![2] = q[2] + 0.01;
    }
    angle.current?.set(arcPts, 1, Math.abs(sweep) > 0.05 ? shown : 0);

    // The quarter turns: the arrow from 1, and an arc for each turn it has made.
    const qs = clamp01(rig.quarters);
    const q = rig.quarter;
    const dir = (q * Math.PI) / 2;
    aim(arrows.current[2] ?? null, C, onPlane(Math.cos(dir), Math.sin(dir)), qs * 0.95, 0.022);
    turns.forEach((h, k) => {
      const part = clamp01(q - k);
      const pts = turnPts[k]!;
      pts.forEach((pt, i) => {
        const t = ((k + (i / (pts.length - 1)) * part) * Math.PI) / 2;
        const w = onPlane(Math.cos(t) * TURN_R, Math.sin(t) * TURN_R, 0);
        pt[0] = w[0];
        pt[1] = w[1];
        pt[2] = w[2] + 0.01;
      });
      h.current?.set(pts, 1, part > 0.01 ? qs : 0);
    });

    // Words: e^{iθ} by the point (and what it equals, once it rests on one of the four), θ by its arc, × i by each
    // quarter turn, and i × i = −1.
    const resting = Math.abs(th - last.current) < 1e-4;
    last.current = th;
    const name = thetaText(th);
    const value = resting ? AT[name] : undefined;
    const power = name.startsWith('−') ? `−i${name.slice(1)}` : `i${name}`;
    const tag = value ? `e<sup>${power}</sup> = ${value}` : 'e<sup>iθ</sup>';
    const el0 = texts.current[0];
    if (el0 && said.current !== tag) {
      said.current = tag;
      el0.innerHTML = tag;
    }
    const mid = sweep / 2;
    const place: Array<[V3, number, number, number]> = [
      [p, c, s, clamp01(rig.tag) * on],
      [
        onPlane(Math.cos(mid) * ANGLE_R, Math.sin(mid) * ANGLE_R),
        Math.cos(mid),
        Math.sin(mid),
        Math.abs(sweep) > 0.35 ? shown : 0,
      ],
      ...[0, 1, 2, 3].map((k): [V3, number, number, number] => {
        const t = ((k + 0.5) * Math.PI) / 2;
        return [onPlane(Math.cos(t) * 0.68, Math.sin(t) * 0.68), 0, 0, qs * clamp01((q - k - 0.4) * 2.5)];
      }),
      [onPlane(-1.08, 1.08), 0, 0, qs * clamp01((q - 1.7) / 0.3)],
      [[C[0], C[1], C[2] - K * THETA_MAX - 0.6], 0, 1, along * clamp01(rig.trail)],
    ];
    place.forEach(([at, dx, dy, show], i) => {
      labels.current[i]?.position.set(...at);
      const el = texts.current[i];
      if (!el) return;
      el.style.opacity = String(show);
      if (dx || dy) beside(el, dx, dy, i === 0 ? 10 : 4);
    });
  });

  const words: Array<[string, string, string]> = [
    ['', SYM7.point, 'math-label'],
    ['θ', SYM7.point, 'math-label math-label--small'],
    ['× i', SYM7.sin, 'math-label math-label--small'],
    ['× i', SYM7.sin, 'math-label math-label--small'],
    ['× i', SYM7.sin, 'math-label math-label--small'],
    ['× i', SYM7.sin, 'math-label math-label--small'],
    ['i × i = −1', SYM7.point, 'math-label math-label--chip'],
    ['θ', SYM7.point, 'math-label math-label--small'],
  ];

  return (
    <group>
      <ChalkLine handle={trail} color={SYM7.sin} width={3} renderOrder={8} />
      <ChalkLine handle={axis} color={SYM7.point} width={1.2} renderOrder={6} />
      <ChalkLine handle={angle} color={SYM7.point} width={1.8} renderOrder={9} />
      <ChalkLine handle={tick} color={SYM7.point} width={1.4} renderOrder={9} />
      {turns.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM7.sin} width={2} renderOrder={9} />
      ))}
      <Arrow arrow={(el) => void (arrows.current[0] = el)} color={SYM7.point} />
      <Arrow arrow={(el) => void (arrows.current[1] = el)} color={SYM7.sin} />
      <Arrow arrow={(el) => void (arrows.current[2] = el)} color={SYM7.point} />
      <mesh ref={point} visible={false} renderOrder={10}>
        <sphereGeometry args={[0.075, 18, 12]} />
        <meshBasicMaterial color={SYM7.point} toneMapped={false} />
      </mesh>
      {words.map(([text, color, className], i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel ref={(el) => void (texts.current[i] = el)} className={className} color={color}>
            {text}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
