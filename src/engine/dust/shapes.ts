/**
 * Procedural point clouds for the Dust. Every generator fills `n` xyz triples and is deterministic
 * (seeded), so a shape looks identical every time and can be cached.
 *
 * Icons are authored in the xy-plane facing +z, roughly within a radius of 2.4 units.
 */

export type Vec3 = [number, number, number];

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
type Sampler = (rng: Rng) => Vec3;

/** Picks samplers by weight and writes n points. */
function mix(n: number, seed: number, parts: Array<[number, Sampler]>, jitter = 0.02): Float32Array {
  const rng = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const total = parts.reduce((s, [w]) => s + w, 0);
  for (let i = 0; i < n; i++) {
    let r = rng() * total;
    let sampler = parts[0]![1];
    for (const [w, s] of parts) {
      if (r < w) {
        sampler = s;
        break;
      }
      r -= w;
    }
    const [x, y, z] = sampler(rng);
    out[i * 3] = x + (rng() - 0.5) * jitter;
    out[i * 3 + 1] = y + (rng() - 0.5) * jitter;
    out[i * 3 + 2] = z + (rng() - 0.5) * jitter;
  }
  return out;
}

const TAU = Math.PI * 2;

/** Uniform point on the polyline through `pts`. */
function polyline(pts: Vec3[], closed = false): Sampler {
  const segs: Array<[Vec3, Vec3, number]> = [];
  let total = 0;
  const count = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    segs.push([a, b, len]);
    total += len;
  }
  return (rng) => {
    let r = rng() * total;
    for (const [a, b, len] of segs) {
      if (r <= len) {
        const t = len === 0 ? 0 : r / len;
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }
      r -= len;
    }
    const last = segs[segs.length - 1]!;
    return [...last[1]];
  };
}

function circle(cx: number, cy: number, r: number, z = 0): Sampler {
  return (rng) => {
    const t = rng() * TAU;
    return [cx + Math.cos(t) * r, cy + Math.sin(t) * r, z];
  };
}

function disc(cx: number, cy: number, r: number, z = 0): Sampler {
  return (rng) => {
    const t = rng() * TAU;
    const rr = Math.sqrt(rng()) * r;
    return [cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, z];
  };
}

function ball(cx: number, cy: number, cz: number, r: number, shell = false): Sampler {
  return (rng) => {
    const u = rng() * 2 - 1;
    const t = rng() * TAU;
    const s = Math.sqrt(1 - u * u);
    const rr = shell ? r : r * Math.cbrt(rng());
    return [cx + s * Math.cos(t) * rr, cy + s * Math.sin(t) * rr, cz + u * rr];
  };
}

function curve(fn: (t: number) => Vec3): Sampler {
  return (rng) => fn(rng());
}

/** Fill of a triangle in the xy-plane. */
function triangleFill(a: Vec3, b: Vec3, c: Vec3): Sampler {
  return (rng) => {
    let u = rng();
    let v = rng();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    return [
      a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
      a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
      a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
    ];
  };
}

// ---------- Icons ----------

function pythagorasIcon(n: number) {
  // 3-4-5 triangle with squares on its sides, centred.
  const s = 0.36;
  const off: [number, number] = [-0.3, -0.25];
  const p = (u: number, v: number): Vec3 => [(u + off[0] / s) * s, (v + off[1] / s) * s, 0];
  const P0 = p(0, 0);
  const P1 = p(3, 0);
  const P2 = p(0, 4);
  const sqA = [p(0, 0), p(3, 0), p(3, -3), p(0, -3)];
  const sqB = [p(0, 0), p(0, 4), p(-4, 4), p(-4, 0)];
  const sqC = [p(3, 0), p(0, 4), p(4, 7), p(7, 3)];
  return mix(
    n,
    11,
    [
      [3, polyline([P0, P1, P2], true)],
      [2, polyline(sqA, true)],
      [2.4, polyline(sqB, true)],
      [3, polyline(sqC, true)],
      [1.2, triangleFill(P0, P1, P2)],
      [0.6, polyline([p(0, 0.5), p(0.5, 0.5), p(0.5, 0)])],
    ],
    0.03,
  );
}

function circleIcon(n: number) {
  const R = 2;
  const spokes: Sampler = (rng) => {
    const k = Math.floor(rng() * 8);
    const t = (k / 8) * TAU;
    const r = rng() * R;
    return [Math.cos(t) * r, Math.sin(t) * r, 0];
  };
  return mix(n, 12, [
    [4, circle(0, 0, R)],
    [2, spokes],
    [1.6, disc(0, 0, R)],
  ]);
}

function crownIcon(n: number) {
  const R = 1.35;
  const band: Sampler = (rng) => {
    const t = rng() * TAU;
    const y = -0.6 + rng() * 0.55;
    return [Math.cos(t) * R, y, Math.sin(t) * R];
  };
  const spikes: Sampler = (rng) => {
    const k = Math.floor(rng() * 7);
    const t0 = (k / 7) * TAU;
    const w = TAU / 14;
    const h = rng();
    const side = rng() < 0.5 ? -1 : 1;
    const t = t0 + side * w * (1 - h);
    return [Math.cos(t) * R, -0.05 + h * 0.95, Math.sin(t) * R];
  };
  const jewels: Sampler = (rng) => {
    const k = Math.floor(rng() * 7);
    const t = (k / 7) * TAU;
    return ball(Math.cos(t) * R, 1.0, Math.sin(t) * R, 0.09)(rng);
  };
  return mix(n, 13, [
    [4, band],
    [3, spikes],
    [0.8, jewels],
    [1, circle(0, -0.6, R)],
  ]);
}

function orbitIcon(n: number) {
  const a = 2.3;
  const b = 1.55;
  const c = Math.sqrt(a * a - b * b);
  const tilt = 0.45;
  const ellipse: Sampler = (rng) => {
    const t = rng() * TAU;
    const x = Math.cos(t) * a;
    const y = Math.sin(t) * b;
    return [x, y * Math.cos(tilt), y * Math.sin(tilt)];
  };
  const sweep: Sampler = (rng) => {
    // Two swept sectors from the focus: Kepler's equal areas.
    const k = rng() < 0.5 ? 0 : 1;
    const t = k === 0 ? -0.35 + rng() * 0.7 : Math.PI - 0.12 + rng() * 0.24;
    const s = Math.sqrt(rng());
    const x = (Math.cos(t) * a - c) * s + c;
    const y = Math.sin(t) * b * s;
    return [x, y * Math.cos(tilt), y * Math.sin(tilt)];
  };
  return mix(n, 14, [
    [4, ellipse],
    [2.5, ball(c, 0, 0, 0.34)],
    [0.6, ball(-a, 0, 0, 0.12)],
    [1.4, sweep],
  ]);
}

function appleIcon(n: number) {
  const body: Sampler = (rng) => {
    const u = Math.acos(rng() * 2 - 1); // 0 = top
    const t = rng() * TAU;
    const r = Math.sin(u) * (1.25 + 0.12 * Math.cos(u)) * (1 - 0.18 * Math.exp(-Math.pow(u / 0.5, 2)));
    const y =
      Math.cos(u) * 1.15 -
      0.32 * Math.exp(-Math.pow(u / 0.45, 2)) +
      0.22 * Math.exp(-Math.pow((Math.PI - u) / 0.35, 2));
    return [Math.cos(t) * r, y - 0.1, Math.sin(t) * r];
  };
  const stem = polyline([
    [0, 0.75, 0],
    [0.08, 1.15, 0],
    [0.2, 1.42, 0],
  ]);
  const leaf: Sampler = (rng) => {
    const t = rng();
    const w = Math.sin(t * Math.PI) * 0.22 * (rng() * 2 - 1);
    return [0.15 + t * 0.75, 1.25 + t * 0.32 + w, w * 0.4];
  };
  return mix(n, 15, [
    [7, body],
    [0.5, stem],
    [1, leaf],
  ]);
}

function calculusIcon(n: number) {
  const f = (x: number) => 0.9 + 0.55 * Math.sin(x * 1.3) + 0.25 * x;
  const x0 = -2.2;
  const x1 = 2.2;
  const base = -1.3;
  const graph = curve((t) => {
    const x = x0 + (x1 - x0) * t;
    return [x, base + f(x), 0];
  });
  const bars: Sampler = (rng) => {
    const k = Math.floor(rng() * 10);
    const w = (x1 - x0) / 10;
    const xl = x0 + k * w;
    const h = f(xl + w / 2);
    const edge = rng();
    if (edge < 0.45) return [xl, base + rng() * h, 0];
    if (edge < 0.7) return [xl + rng() * w, base + h, 0];
    return [xl + rng() * w, base + rng() * h, 0];
  };
  const axes = polyline([
    [x0 - 0.2, 2.1, 0],
    [x0 - 0.2, base, 0],
    [x1 + 0.3, base, 0],
  ]);
  return mix(n, 16, [
    [3, graph],
    [4, bars],
    [1.4, axes],
  ]);
}

function helixIcon(n: number) {
  const turns = 2.6;
  const len = 4.6;
  const helix = curve((t) => {
    const a = t * turns * TAU;
    return [-len / 2 + t * len, Math.sin(a), Math.cos(a)];
  });
  return mix(n, 17, [
    [6, helix],
    [1.6, circle(-len / 2, 0, 1, 0)],
    [
      0.8,
      polyline([
        [-len / 2 - 0.3, 0, 0],
        [len / 2 + 0.3, 0, 0],
      ]),
    ],
  ]);
}

function epicyclesIcon(n: number) {
  const radii = [1.05, 0.45, 0.24, 0.14];
  const angles = [0.6, 2.1, -0.8, 1.4];
  const centres: Array<[number, number]> = [[-1.2, 0]];
  for (let i = 1; i < radii.length; i++) {
    const [cx, cy] = centres[i - 1]!;
    const r = radii[i - 1]!;
    const a = angles[i - 1]!;
    centres.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const circles: Array<[number, Sampler]> = radii.map((r, i) => [
    1.5 * r + 0.3,
    circle(centres[i]![0], centres[i]![1], r),
  ]);
  const wave = curve((t) => {
    const x = -0.1 + t * 2.8;
    let y = 0;
    for (const k of [1, 3, 5, 7]) y += ((4 / Math.PI) * Math.sin(k * (t * 2 * TAU))) / k;
    return [x, y * 0.75, 0];
  });
  return mix(n, 18, [...circles, [2.6, wave]]);
}

function wavesIcon(n: number) {
  const rings: Array<[number, Sampler]> = [];
  for (let i = 0; i < 6; i++) {
    const r = 0.35 + i * 0.38;
    const cx = -0.12 * i * 2.2 + 0.9;
    rings.push([r, circle(cx, 0, r)]);
  }
  return mix(n, 19, [...rings, [0.5, ball(0.9, 0, 0, 0.1)]]);
}

function coasterIcon(n: number) {
  const track = curve((t) => {
    // Lift hill, drop, then a vertical loop.
    const x = -2.4 + t * 4.8;
    const y = 1.4 * Math.exp(-Math.pow((x + 1.2) / 0.6, 2)) - 1;
    const loopC = 1.1;
    if (x > loopC - 0.6 && x < loopC + 0.6) {
      const a = ((x - (loopC - 0.6)) / 1.2) * TAU - Math.PI / 2;
      return [loopC + Math.cos(a) * 0.6 * 0.95, -0.4 + Math.sin(a) * 0.6, 0];
    }
    return [x, y, 0];
  });
  return mix(n, 20, [
    [6, track],
    [0.6, ball(-1.2, 0.55, 0, 0.12)],
  ]);
}

function grain(n: number) {
  return mix(n, 21, [[1, ball(0, 0, 0, 0.035)]], 0);
}

/** Glinting grains lying on the beach (local y = 0), denser near the centre. */
function sand(n: number) {
  const rng = mulberry32(22);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = rng() * TAU;
    const r = Math.pow(rng(), 0.75) * 16;
    out[i * 3] = Math.cos(t) * r;
    out[i * 3 + 1] = 0.01 + rng() * 0.015;
    out[i * 3 + 2] = Math.sin(t) * r;
  }
  return out;
}

function stars(n: number) {
  return mix(n, 23, [[1, ball(0, 0, 0, 90, true)]], 6);
}

export const SHAPES: Record<string, (n: number) => Float32Array> = {
  pythagoras: pythagorasIcon,
  circle: circleIcon,
  crown: crownIcon,
  orbit: orbitIcon,
  apple: appleIcon,
  calculus: calculusIcon,
  helix: helixIcon,
  epicycles: epicyclesIcon,
  waves: wavesIcon,
  coaster: coasterIcon,
  grain,
  sand,
  stars,
};

export const ICON_ORDER = [
  'pythagoras',
  'circle',
  'crown',
  'orbit',
  'apple',
  'calculus',
  'helix',
  'epicycles',
  'waves',
  'coaster',
] as const;

const cache = new Map<string, Float32Array>();

export function getShape(key: string, n: number): Float32Array {
  const id = `${key}:${n}`;
  let arr = cache.get(id);
  if (!arr) {
    const gen = SHAPES[key] ?? SHAPES.grain!;
    arr = gen(n);
    cache.set(id, arr);
  }
  return arr;
}
