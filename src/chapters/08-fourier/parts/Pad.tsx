import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle, type Pts } from '../../../engine/lines/ChalkLine';
import { station } from '../../../engine/world/stations';
import { useApp } from '../../../state/store';
import { audio } from '../../../audio';
import type { Complex } from '../math';
import { setDrawn, setPen } from '../drawn';
import { D, fourierRig, Q, SYM8 } from '../rig';

const ORIGIN = station('fourier');
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -(ORIGIN.z + Q[2]));
const hit = new THREE.Vector3();
/** The pad's size (world units: wider than any screen shows, so a press anywhere in the picture starts a stroke), and the
 * most points a stroke keeps. */
const PAD = { w: 40, h: 30 };
const MAX = 1200;

/**
 * The Lab's drawing pad, over the drawing's plane: press and draw any closed shape (it is closed up when you let go),
 * and the clockwork works out the circles that redraw it.
 */
export function Pad() {
  const rig = fourierRig();
  const set = useApp((s) => s.set);
  const mesh = useRef<THREE.Mesh>(null);
  const stroke = useRef<Complex[]>([]);
  const drawing = useRef(false);
  const line = useRef<ChalkLineHandle | null>(null);
  const pts = useMemo<Pts>(() => [], []);

  useFrame(() => {
    const live = rig.lab > 0.5 && rig.drawing > 0.5;
    if (mesh.current) mesh.current.visible = live;
    if (!drawing.current) {
      line.current?.set(
        [
          [0, 0, 0],
          [0, 0, 0],
        ],
        1,
        0,
      );
      return;
    }
    pts.length = 0;
    for (const [x, y] of stroke.current) pts.push([Q[0] + x * D, Q[1] + y * D, Q[2] + 0.05]);
    if (pts.length >= 2) line.current?.set(pts, 1, 0.9);
  });

  const local = (e: ThreeEvent<PointerEvent>): Complex | null => {
    if (!e.ray.intersectPlane(plane, hit)) return null;
    return [(hit.x - ORIGIN.x - Q[0]) / D, (hit.y - ORIGIN.y - Q[1]) / D];
  };

  return (
    <group>
      <mesh
        ref={mesh}
        position={Q}
        visible={false}
        onPointerDown={(e) => {
          if (!(rig.lab > 0.5 && rig.drawing > 0.5)) return;
          e.stopPropagation();
          (e.target as unknown as Element).setPointerCapture?.(e.pointerId);
          const p = local(e);
          if (!p) return;
          drawing.current = true;
          stroke.current = [p];
          setPen(true);
          document.body.style.cursor = 'crosshair';
          set({ dragging: true });
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          e.stopPropagation();
          const p = local(e);
          const last = stroke.current[stroke.current.length - 1];
          if (!p || !last || stroke.current.length >= MAX) return;
          if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 0.02) stroke.current.push(p);
        }}
        onPointerUp={(e) => {
          if (!drawing.current) return;
          (e.target as unknown as Element).releasePointerCapture?.(e.pointerId);
          drawing.current = false;
          document.body.style.cursor = '';
          set({ dragging: false });
          setDrawn(stroke.current);
          setPen(false);
          stroke.current = [];
          // The circles start again from the beginning, and draw the new shape.
          rig.dt = 0;
          audio.ui('click');
        }}
      >
        <planeGeometry args={[PAD.w, PAD.h]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ChalkLine handle={line} color={SYM8.wave} width={2.4} renderOrder={10} />
    </group>
  );
}
