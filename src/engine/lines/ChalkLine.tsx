import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export type Pts = Array<[number, number, number]>;

/** Returns the prefix of a polyline covering `progress` (0..1) of its total length. */
export function partialPolyline(points: Pts, progress: number): Pts {
  if (points.length < 2) return points.slice();
  const p = Math.min(Math.max(progress, 0), 1);
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    lens.push(l);
    total += l;
  }
  let remaining = p * total;
  const out: Pts = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const l = lens[i - 1]!;
    const a = points[i - 1]!;
    const b = points[i]!;
    if (remaining >= l) {
      out.push(b);
      remaining -= l;
    } else {
      const t = l === 0 ? 0 : remaining / l;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
      break;
    }
  }
  return out;
}

export interface ChalkLineHandle {
  /** Updates the drawn points; call from useFrame. */
  set: (points: Pts, progress?: number, opacity?: number) => void;
}

interface Props {
  color?: string;
  width?: number;
  handle: React.RefObject<ChalkLineHandle | null>;
  depthTest?: boolean;
  renderOrder?: number;
}

/**
 * A fat screen-space line that can be drawn in progressively. Imperative by design: the owner pushes
 * points every frame through `handle.current.set`, so animating it never re-renders React.
 */
export function ChalkLine({
  color = '#f4efe6',
  width = 2.2,
  handle,
  depthTest = true,
  renderOrder = 5,
}: Props) {
  const size = useThree((s) => s.size);
  const line = useMemo(() => {
    const geometry = new LineGeometry();
    geometry.setPositions([0, 0, 0, 0, 0, 0]);
    const material = new LineMaterial({
      color: new THREE.Color(color).getHex(),
      linewidth: width,
      transparent: true,
      depthTest,
      depthWrite: false,
      worldUnits: false,
    });
    const l = new Line2(geometry, material);
    l.frustumCulled = false;
    l.renderOrder = renderOrder;
    l.visible = false;
    return l;
  }, [color, width, depthTest, renderOrder]);

  const last = useRef('');
  const count = useRef(0);

  useEffect(() => {
    handle.current = {
      set: (points, progress = 1, opacity = 1) => {
        const pts = progress >= 1 ? points : partialPolyline(points, progress);
        const visible = opacity > 0.002 && pts.length >= 2 && progress > 0;
        line.visible = visible;
        line.material.opacity = opacity;
        if (!visible) return;
        // three remembers how many segments an instanced line had when it first drew it, so a line that grows
        // would stay cut short: keep the count fixed by repeating the last point (zero-length segments draw
        // nothing), and start a fresh geometry if the count itself changes.
        const padded = pts.length < points.length ? [...pts] : pts;
        while (padded.length < points.length) padded.push(padded[padded.length - 1]!);
        const flat = padded.flat();
        const key = flat.map((v) => v.toFixed(4)).join(',');
        if (key === last.current) return;
        last.current = key;
        if (flat.length !== count.current) {
          count.current = flat.length;
          line.geometry.dispose();
          line.geometry = new LineGeometry();
        }
        line.geometry.setPositions(flat);
        line.computeLineDistances();
      },
    };
    return () => {
      handle.current = null;
    };
  }, [line, handle]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      line.material.dispose();
    },
    [line],
  );

  useFrame(() => {
    line.material.resolution.set(size.width, size.height);
  });

  return <primitive object={line} />;
}
