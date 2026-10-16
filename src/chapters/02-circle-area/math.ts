/**
 * Pure geometry for chapter 2 (the area of a circle). Coordinates are on the station's (u, v) plane, with
 * u to the right and v away from the camera, as in chapter 1.
 */

export type V2 = [number, number];

/** A wedge's pose: its apex position and its rotation (CCW). At rot = 0 the wedge's axis points along +v. */
export interface Pose {
  u: number;
  v: number;
  rot: number;
}

const TAU = Math.PI * 2;

export function sectorAngle(n: number): number {
  return TAU / n;
}

/** The disc cut into n equal wedges; wedge j spans angles [jθ, (j+1)θ] measured from +u. */
export function discPoses(n: number, center: V2 = [0, 0]): Pose[] {
  const th = sectorAngle(n);
  return Array.from({ length: n }, (_, j) => ({
    u: center[0],
    v: center[1],
    rot: (j + 0.5) * th - Math.PI / 2,
  }));
}

/** Half-chord s and apex-to-chord height h of a wedge. */
export function wedgeChord(n: number, r: number) {
  const th = sectorAngle(n);
  return { s: r * Math.sin(th / 2), h: r * Math.cos(th / 2) };
}

/**
 * The wedges dealt into a row, alternately point-down (even j, arc on top) and point-up (odd j, arc below),
 * so neighbours share a straight side. Centred on the origin.
 */
export function rowPoses(n: number, r: number): Pose[] {
  const { s, h } = wedgeChord(n, r);
  const du = -((n - 1) * s) / 2;
  const dv = -h / 2;
  return Array.from({ length: n }, (_, j) =>
    j % 2 === 0 ? { u: j * s + du, v: dv, rot: 0 } : { u: j * s + du, v: h + dv, rot: Math.PI },
  );
}

/** Outer size of the row: width (n+1)·s, straight-edge height h, and how far the arcs bulge beyond it. */
export function rowSize(n: number, r: number) {
  const { s, h } = wedgeChord(n, r);
  return { width: (n + 1) * s, height: h, bump: r - h };
}

/**
 * The straight-edged shape the row approximates: n/2 · r² · sin(2π/n). It is also the area of the
 * inscribed n-gon, and tends to πr² as n grows.
 */
export function straightEstimate(n: number, r: number): number {
  return (n / 2) * r * r * Math.sin(TAU / n);
}

/** Relative error of the straight-edged estimate against πr². */
export function estimateError(n: number, r: number): number {
  const exact = Math.PI * r * r;
  return (exact - straightEstimate(n, r)) / exact;
}

/**
 * Re-slicing: each parent wedge (of nParent) splits into nChild / nParent children that start exactly inside
 * it, so swapping the meshes is seamless before the children move to their own row positions.
 */
export function childPoses(nParent: number, nChild: number, parents: Pose[]): Pose[] {
  const k = nChild / nParent;
  if (!Number.isInteger(k) || k < 1)
    throw new Error(`nChild (${nChild}) must be a multiple of nParent (${nParent})`);
  const t1 = sectorAngle(nParent);
  const t2 = sectorAngle(nChild);
  const out: Pose[] = [];
  for (let c = 0; c < nChild; c++) {
    const p = parents[Math.floor(c / k)]!;
    const i = c % k;
    out.push({ u: p.u, v: p.v, rot: p.rot - t1 / 2 + (i + 0.5) * t2 });
  }
  return out;
}

/** Apex and the two arc ends of a wedge at a pose. */
export function wedgeCorners(pose: Pose, n: number, r: number): [V2, V2, V2] {
  const th = sectorAngle(n);
  const axis = pose.rot + Math.PI / 2;
  const end = (a: number): V2 => [pose.u + r * Math.cos(a), pose.v + r * Math.sin(a)];
  return [[pose.u, pose.v], end(axis + th / 2), end(axis - th / 2)];
}

// ---------- The onion proof ----------

/** Mid-radii of m thin rings that make up a disc of radius r. */
export function ringRadii(m: number, r: number): number[] {
  return Array.from({ length: m }, (_, k) => ((k + 0.5) / m) * r);
}

/** Total area of the unrolled rings (each a bar 2πρ long and r/m thick). Exactly πr². */
export function ringsArea(m: number, r: number): number {
  const dr = r / m;
  return ringRadii(m, r).reduce((sum, rho) => sum + TAU * rho * dr, 0);
}

/**
 * Where each unrolled ring lands: bars stacked into a triangle with base 2πr (outermost ring at the bottom)
 * and height r, centred on the origin. `v` is the bar's centre line.
 */
export function triangleBars(m: number, r: number): Array<{ length: number; v: number }> {
  return ringRadii(m, r).map((rho) => ({ length: TAU * rho, v: r - rho - r / 2 }));
}
