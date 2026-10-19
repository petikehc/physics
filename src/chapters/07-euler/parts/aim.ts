import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();
const HEAD = 0.14;
export const shaftGeo = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0);
export const headGeo = new THREE.ConeGeometry(1, 1, 16).translate(0, 0.5, 0);

/** An arrow from one point to another: a shaft and a head, `width` thick. Hidden while `on` is near 0. */
export function aim(
  g: THREE.Group | null,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  on: number,
  width = 0.016,
) {
  if (!g) return;
  _d.set(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const len = _d.length();
  g.visible = on > 0.01 && len > 1e-4;
  if (!g.visible) return;
  g.position.set(...from);
  g.quaternion.setFromUnitVectors(UP, _d.normalize());
  // Short arrows get a smaller head, so it never overshoots the tip.
  const head = Math.min(HEAD, len * 0.45);
  const shaft = g.children[0]!;
  shaft.scale.set(width, Math.max(len - head * 0.9, 1e-4), width);
  const tip = g.children[1]!;
  tip.position.set(0, len - head, 0);
  tip.scale.set(head * 0.36, head, head * 0.36);
  ((shaft as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = on;
}
