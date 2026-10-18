import * as THREE from 'three';
import { mulberry32 } from '../../../engine/dust/shapes';
import { LAND_RINGS, surface } from '../earth';

/** The map's size: an equirectangular image, longitude across and latitude down. */
const W = 1024;
const H = 512;

/** A smooth 3D value noise (to vary the land and seas a little), from a seeded lattice. */
function valueNoise(seed: number) {
  const rng = mulberry32(seed);
  const table = Float32Array.from({ length: 4096 }, () => rng());
  const at = (x: number, y: number, z: number) =>
    table[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & 4095]!;
  const s = (t: number) => t * t * (3 - 2 * t);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = s(x - xi);
    const v = s(y - yi);
    const w = s(z - zi);
    return l(
      l(l(at(xi, yi, zi), at(xi + 1, yi, zi), u), l(at(xi, yi + 1, zi), at(xi + 1, yi + 1, zi), u), v),
      l(
        l(at(xi, yi, zi + 1), at(xi + 1, yi, zi + 1), u),
        l(at(xi, yi + 1, zi + 1), at(xi + 1, yi + 1, zi + 1), u),
        v,
      ),
      w,
    );
  };
}

/** A box blur of a W × H field, `passes` times: wrapping round the globe across, held at the poles down. */
function blur(field: Float32Array, radius: number, passes: number): Float32Array {
  const a = Float32Array.from(field);
  const b = new Float32Array(W * H);
  const n = 2 * radius + 1;
  const row = (j: number) => Math.min(H - 1, Math.max(0, j)) * W;
  for (let p = 0; p < passes; p++) {
    for (let j = 0; j < H; j++) {
      const r = j * W;
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += a[r + ((k + W) % W)]!;
      for (let i = 0; i < W; i++) {
        b[r + i] = sum / n;
        sum += a[r + ((i + radius + 1) % W)]! - a[r + ((i - radius + W) % W)]!;
      }
    }
    for (let i = 0; i < W; i++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += b[row(k) + i]!;
      for (let j = 0; j < H; j++) {
        a[j * W + i] = sum / n;
        sum += b[row(j + radius + 1) + i]! - b[row(j - radius) + i]!;
      }
    }
  }
  return a;
}

const linear = (hex: string) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b] as const;
};

/** Land colours by latitude (degrees from the equator): rainforest, savanna, desert, fields, forest, tundra, ice. */
const LAND_STOPS: Array<[number, readonly [number, number, number]]> = [
  [0, linear('#4c7a4a')],
  [11, linear('#4c7a4a')],
  [18, linear('#8e9a62')],
  [23, linear('#b5a06f')],
  [31, linear('#b5a06f')],
  [38, linear('#6c9467')],
  [51, linear('#6c9467')],
  [59, linear('#55725a')],
  [66, linear('#8a957f')],
  [72, linear('#e4e9ee')],
];
const DEEP = linear('#1f4f94');
const OPEN = linear('#2f6cc0');
const SHALLOW = linear('#5a98e4');
const ICE = linear('#e4e9ee');
const GREEN = linear('#6c9467');

function landAt(latitude: number, out: number[]) {
  const a = Math.min(Math.abs(latitude), 90);
  let k = 0;
  while (k < LAND_STOPS.length - 2 && LAND_STOPS[k + 1]![0] <= a) k++;
  const [a0, c0] = LAND_STOPS[k]!;
  const [a1, c1] = LAND_STOPS[k + 1]!;
  const t = Math.min(1, Math.max(0, (a - a0) / (a1 - a0)));
  for (let i = 0; i < 3; i++) out[i] = c0[i]! + (c1[i]! - c0[i]!) * t;
}

/** Linear 0..1 to an sRGB byte. */
const SRGB = Uint8Array.from({ length: 4096 }, (_, i) => {
  const v = i / 4095;
  return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
});
const byte = (v: number) => SRGB[Math.min(4095, Math.max(0, Math.round(v * 4095)))]!;

/** Fills every coastline on a 2D canvas in the current fill style (antialiased, so the coasts come out smooth). */
function fillLand(ctx: CanvasRenderingContext2D) {
  for (const rings of LAND_RINGS) {
    ctx.beginPath();
    for (const r of rings) {
      for (let i = 0; i < r.length; i += 2) {
        const x = ((r[i]! + 180) / 360) * W;
        const y = ((90 - r[i + 1]!) / 180) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
    ctx.fill('evenodd');
  }
}

/** How much of each pixel of the map is land, 0..1. */
function landMask(): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  fillLand(ctx);
  const data = ctx.getImageData(0, 0, W, H).data;
  const mask = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) mask[k] = data[k * 4]! / 255;
  return mask;
}

/** The mottling: soft noise over the globe, worked out at half the map's size (it is read back smoothly). */
function mottling() {
  const noise = valueNoise(7);
  const NW = W / 2;
  const NH = H / 2;
  const soft = new Float32Array(NW * NH);
  for (let j = 0; j < NH; j++) {
    const lat = 90 - ((j + 0.5) / NH) * 180;
    for (let i = 0; i < NW; i++) {
      const [x, y, z] = surface(lat, ((i + 0.5) / NW) * 360 - 180);
      soft[j * NW + i] = noise(x * 6 + 9, y * 6 + 9, z * 6 + 9) * 0.65 + noise(x * 17, y * 17, z * 17) * 0.35;
    }
  }
  return (i: number, j: number) => {
    const u = (i + 0.5) / 2 - 0.5;
    const v = Math.min(NH - 1, Math.max(0, (j + 0.5) / 2 - 0.5));
    const i0 = Math.floor(u);
    const j0 = Math.floor(v);
    const fu = u - i0;
    const fv = v - j0;
    const a = (i0 + NW) % NW;
    const b = (i0 + 1) % NW;
    const r0 = j0 * NW;
    const r1 = Math.min(NH - 1, j0 + 1) * NW;
    const top = soft[r0 + a]! + (soft[r0 + b]! - soft[r0 + a]!) * fu;
    const bottom = soft[r1 + a]! + (soft[r1 + b]! - soft[r1 + a]!) * fu;
    return top + (bottom - top) * fv;
  };
}

/** Paints the map onto `ctx` in steps (each a few milliseconds' work), and refreshes the texture at the end. */
function* paint(ctx: CanvasRenderingContext2D, tex: THREE.Texture) {
  const mask = landMask();
  yield;
  // Shallow seas round every coast: the land spread out a few degrees (three blurs, a step each).
  let shelf = mask;
  for (let p = 0; p < 3; p++) {
    shelf = blur(shelf, 7, 1);
    yield;
  }
  const mottleAt = mottling();
  yield;
  const img = ctx.createImageData(W, H);
  const land = [0, 0, 0];
  for (let j = 0; j < H; j++) {
    const lat = 90 - ((j + 0.5) / H) * 180;
    for (let i = 0; i < W; i++) {
      const k = j * W + i;
      const n = mottleAt(i, j);
      const m = mask[k]!;
      // Land: its colour by latitude, the bands wavering a few degrees; the dry belt greener near the sea.
      const a = Math.abs(lat) + (n - 0.5) * 14;
      landAt(a, land);
      const desert = Math.min(1, Math.max(0, (a - 17) / 5)) * Math.min(1, Math.max(0, (37 - a) / 5));
      const wet = desert * Math.min(1, Math.max(0, (0.8 - shelf[k]!) * 2.5)) * 0.75;
      for (let c = 0; c < 3; c++) land[c] = land[c]! + (GREEN[c]! - land[c]!) * wet;
      if (lat < -62) for (let c = 0; c < 3; c++) land[c] = ICE[c]!;
      const mottle = 0.9 + 0.2 * n;
      // Sea: deep in the open ocean, shallower towards the coasts.
      const s = Math.min(1, shelf[k]! * 2.2);
      const o = k * 4;
      for (let c = 0; c < 3; c++) {
        const open = DEEP[c]! + (OPEN[c]! - DEEP[c]!) * (0.55 + 0.45 * n);
        const sea = open + (SHALLOW[c]! - open) * s * s;
        img.data[o + c] = byte(sea + (land[c]! * mottle - sea) * m);
      }
      img.data[o + 3] = 255;
    }
    if (j % 16 === 15) yield;
  }
  ctx.putImageData(img, 0, 0);
  tex.needsUpdate = true;
}

let earth: THREE.CanvasTexture | null = null;

/**
 * The Earth's map, painted: the real coastlines (Natural Earth's, see land.ts) filled in, the seas shading from deep
 * blue to shallow near every coast, the land coloured by latitude (forest, savanna, desert, fields, tundra) with
 * Antarctica and the far north under ice, all a little mottled so it reads as painted rather than printed.
 *
 * Painting it takes longer than a frame, so it starts as a flat two-colour map and is painted over a few frames
 * (well before the planet is on screen: the station is mounted a chapter ahead). It is painted once per visit.
 */
export function earthTexture(): THREE.Texture {
  if (earth) return earth;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#2f6cc0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#6c9467';
  fillLand(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  earth = tex;
  const steps = paint(ctx, tex);
  const next = () => {
    if (!steps.next().done) setTimeout(next, 0);
  };
  setTimeout(next, 0);
  return tex;
}
