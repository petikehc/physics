import * as THREE from 'three';

let texture: THREE.Texture | null = null;

/** A soft round glow (white, fading to nothing at the edge), shared by every halo in the chapter. */
export function glowTexture(): THREE.Texture {
  if (texture) return texture;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot(i + 0.5 - size / 2, j + 0.5 - size / 2) / (size / 2);
      const a = Math.max(0, Math.exp(-d * d * 4.5) - 0.012 * d) * (d < 1 ? 1 : 0);
      const k = (j * size + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(Math.min(1, a) * 255);
    }
  }
  texture = new THREE.DataTexture(data, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** A camera-facing halo of the given colour (it adds light, so it reads against the dark). */
export function glowMaterial(color: string) {
  return new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
