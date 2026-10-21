import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { station } from '../../engine/world/stations';
import { clamp01 } from '../../engine/ease';
import { ChalkLine, partialPolyline, type ChalkLineHandle } from '../../engine/lines/ChalkLine';
import { MathLabel } from '../../engine/labels/MathLabel';
import { beside } from '../../engine/labels/beside';
import { tex } from '../../engine/labels/tex';
import { CHAPTERS } from '../registry';
import { iconAt, ICON_DISTANCE, STARS } from './layout';
import { finaleRig, SLUG } from './rig';
import { useConstellation } from './store';

const ORIGIN = station(SLUG);
/** A star before the epilogue has given it its chapter's colour: warm white. */
const WHITE = new THREE.Color('#fff1d8');

/** A soft round glow, white at the centre and fading to nothing, for every star's halo. */
function glowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const colour = new THREE.Color();

function Star({ i, glow }: { i: number; glow: THREE.Texture }) {
  const rig = finaleRig();
  const meta = CHAPTERS[i]!;
  const accent = useMemo(() => new THREE.Color(meta.accent), [meta.accent]);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const label = useRef<HTMLDivElement>(null);
  const formula = useRef<HTMLDivElement>(null);
  const said = useRef('');
  const coreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), []);
  const haloMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glow,
        color: '#ffffff',
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [glow],
  );
  const html = useMemo(() => tex(meta.formulaTeX), [meta.formulaTeX]);
  // Which way is out from the thread's bend at this star (where its icon forms): its numeral sits that way, and its
  // formula straight above or below, away from the icon, so neighbours' numerals stay apart and a formula never meets
  // its icon (or runs off the side of a phone).
  const out = useMemo(() => {
    const c = iconAt(i);
    const s = STARS[i]!;
    return [(c[0] - s[0]) / ICON_DISTANCE, (c[1] - s[1]) / ICON_DISTANCE] as const;
  }, [i]);

  useFrame((state) => {
    const { hovered, selected } = useConstellation.getState();
    const on = clamp01(rig.on);
    const lit = clamp01(rig.lit - i) * on;
    const here = rig.focus === i ? clamp01(rig.focusAmt) : 0;
    const away = rig.focus >= 0 && rig.focus !== i ? clamp01(rig.focusAmt) : 0;
    const picked = rig.index > 0.5 && (hovered === i || selected === i) ? 1 : 0;
    const tint = Math.max(clamp01(rig.visited - i), here, clamp01(rig.glow), picked);
    const twinkle = 1 + Math.sin(state.clock.elapsedTime * (1.3 + i * 0.17) + i * 2.1) * 0.06;
    const bright =
      lit * (1 - 0.55 * away) * (1 + 0.7 * Math.max(here, picked) + 0.3 * clamp01(rig.glow)) * twinkle;

    colour.copy(WHITE).lerp(accent, tint);
    coreMat.color.copy(colour).multiplyScalar(1.4 + bright);
    if (core.current) {
      core.current.visible = lit > 0.01;
      core.current.scale.setScalar(0.42 * (0.5 + 0.5 * Math.min(bright, 1.6)));
    }
    haloMat.color.copy(colour);
    haloMat.opacity = Math.min(bright, 1.6) * 0.75;
    if (halo.current) {
      halo.current.visible = lit > 0.01;
      halo.current.scale.setScalar(5.5 * (0.7 + 0.3 * Math.min(bright, 1.6)));
    }

    // Its numeral beside it; as the index, its name too while it is pointed at or chosen.
    const el = label.current;
    if (el) {
      // (On a phone the stars stand too close for names: the panel below says which it is.)
      const words = picked && state.size.width >= 600 ? `${meta.numeral} · ${meta.short}` : meta.numeral;
      if (said.current !== words) {
        said.current = words;
        el.textContent = words;
      }
      // Close on another star, this one's numeral steps aside altogether (it may be off the edge of the picture).
      el.style.opacity = String(clamp01(rig.labels) * lit * (1 - away));
      beside(el, out[0], out[1], 10);
    }
    // Its formula under it while the epilogue is at it.
    const f = formula.current;
    if (f) {
      f.style.opacity = String(here * clamp01(rig.formula) * lit);
      beside(f, 0, out[1] > 0 ? -1 : 1, 34);
    }
  });

  const pick = (e: { stopPropagation: () => void }) => {
    if (rig.index < 0.5) return false;
    e.stopPropagation();
    return true;
  };

  return (
    <group position={STARS[i]}>
      <mesh ref={core} material={coreMat} visible={false}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <sprite ref={halo} material={haloMat} visible={false} />
      {/* A generous invisible target, for pointing at a star (and for touch). */}
      <mesh
        onPointerOver={(e) => {
          if (!pick(e)) return;
          useConstellation.getState().set({ hovered: i });
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (useConstellation.getState().hovered === i) useConstellation.getState().set({ hovered: null });
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          if (!pick(e)) return;
          useConstellation.getState().set({ selected: i });
        }}
      >
        <sphereGeometry args={[3, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <MathLabel ref={label} className="math-label math-label--small" color={meta.accent} />
      <Html center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={formula}
          className="math-label"
          style={{ color: meta.accent, opacity: 0 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Html>
    </group>
  );
}

/** The thread through the stars, in the order the story told them. */
function Thread() {
  const rig = finaleRig();
  const line = useRef<ChalkLineHandle | null>(null);
  useFrame(() => {
    const on = clamp01(rig.on);
    const pts = partialPolyline(STARS, clamp01(rig.thread));
    line.current?.set(pts, 1, on * (0.35 + 0.4 * clamp01(rig.glow)));
  });
  return <ChalkLine handle={line} color="#f4e6cc" width={1.4} fog={false} renderOrder={4} />;
}

/**
 * The finale, high in the night sky over the fairground: ten stars, one for each chapter, joined by the thread of the
 * story. At the end of the journey (and on the map) it is the index: point at a star, choose it, go back to its chapter.
 */
export default function FinaleStation() {
  const rig = finaleRig();
  const glow = useMemo(() => glowTexture(), []);
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = rig.on > 0.001;
  });
  return (
    <group ref={group} position={[ORIGIN.x, ORIGIN.y, ORIGIN.z]} visible={false}>
      <Thread />
      {STARS.map((_, i) => (
        <Star key={i} i={i} glow={glow} />
      ))}
    </group>
  );
}
