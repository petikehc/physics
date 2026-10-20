import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ChalkLine, type ChalkLineHandle } from '../../../engine/lines/ChalkLine';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { beside } from '../../../engine/labels/beside';
import { clamp01 } from '../../../engine/ease';
import { BALMER, recession, VISIBLE } from '../math';
import { dopplerRig, GALAXY, SPECTRA, SYM9 } from '../rig';

const STARS = 6000;
const RADIUS = 19;
/** Each spectrum strip's size, and the gap between the two. */
const STRIP = { w: 18, h: 1.1, gap: 1.5 };
/** How far the galaxy has drifted away by a red shift of 0.1. */
const RECEDE = 60;

/** The visible spectrum, roughly as the eye sees it: the same curve as `wavelengthRGB` in the maths. */
const SPECTRUM_GLSL = /* glsl */ `
  vec3 spectrum(float nm) {
    vec3 c = vec3(0.0);
    if (nm < 380.0 || nm > 750.0) return c;
    if (nm < 440.0) c = vec3((440.0 - nm) / 60.0, 0.0, 1.0);
    else if (nm < 490.0) c = vec3(0.0, (nm - 440.0) / 50.0, 1.0);
    else if (nm < 510.0) c = vec3(0.0, 1.0, (510.0 - nm) / 20.0);
    else if (nm < 580.0) c = vec3((nm - 510.0) / 70.0, 1.0, 0.0);
    else if (nm < 645.0) c = vec3(1.0, (645.0 - nm) / 65.0, 0.0);
    else c = vec3(1.0, 0.0, 0.0);
    float k = nm < 420.0 ? 0.3 + 0.7 * (nm - 380.0) / 40.0 : nm > 700.0 ? 0.3 + 0.7 * (750.0 - nm) / 50.0 : 1.0;
    return c * k;
  }
`;

function stripMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLines: { value: BALMER.map((l) => l.nm) },
      uShift: { value: 1 },
      uOpacity: { value: 0 },
      uRange: { value: new THREE.Vector2(...VISIBLE) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLines[4];
      uniform float uShift;
      uniform float uOpacity;
      uniform vec2 uRange;
      varying vec2 vUv;
      ${SPECTRUM_GLSL}
      void main() {
        float nm = mix(uRange.x, uRange.y, vUv.x);
        // Kept below the bloom's threshold, so the colours stay pure rather than washing out to white.
        vec3 c = spectrum(nm) * 0.62;
        // Hydrogen's dark lines, where its atoms soak up their own colours.
        float dark = 0.0;
        for (int i = 0; i < 4; i++) {
          float d = abs(nm - uLines[i] * uShift);
          dark = max(dark, 1.0 - smoothstep(0.9, 2.2, d));
        }
        c *= 1.0 - 0.94 * dark;
        float edge = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        gl_FragColor = vec4(c, uOpacity * (0.25 + 0.75 * edge));
      }
    `,
  });
}

function galaxyPoints(): THREE.BufferGeometry {
  let seed = 4242;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const pos = new Float32Array(STARS * 3);
  const col = new Float32Array(STARS * 3);
  const core = new THREE.Color('#ffe6b8');
  const arm = new THREE.Color('#a9c4ff');
  const pink = new THREE.Color('#ff9fc8');
  const c = new THREE.Color();
  for (let i = 0; i < STARS; i++) {
    const r = Math.pow(rand(), 1.6) * RADIUS;
    const twist = 2 * Math.PI * (i % 2) + r * 0.36 + (rand() - 0.5) * (0.5 + 2.4 / (r + 1));
    const a = twist + (i % 2) * Math.PI;
    const spread = (rand() - 0.5) * (0.7 + r * 0.16);
    pos[i * 3] = Math.cos(a) * r + spread;
    pos[i * 3 + 1] = (rand() - 0.5) * (1.4 * Math.exp(-r / 3) + 0.3);
    pos[i * 3 + 2] = Math.sin(a) * r + spread;
    c.copy(core).lerp(arm, clamp01(r / (RADIUS * 0.55)));
    if (rand() < 0.04 && r > 4) c.copy(pink);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function pointsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: { uOpacity: { value: 0 }, uRed: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(260.0 / -mv.z, 1.0, 6.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform float uRed;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        // Its light, stretched: everything a little redder.
        vec3 c = mix(vColor, vColor * vec3(1.25, 0.8, 0.6), uRed);
        gl_FragColor = vec4(c * a * uOpacity, 1.0);
      }
    `,
  });
}

/**
 * A spiral galaxy far out in space, drifting away from us, and two spectra in front of it: hydrogen's dark lines as
 * they are here, and as they come from the galaxy, every one shifted the same way, towards the red.
 */
export function Galaxy() {
  const rig = dopplerRig();
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Points>(null);
  const geo = useMemo(() => galaxyPoints(), []);
  const mat = useMemo(() => pointsMaterial(), []);
  const rest = useMemo(() => stripMaterial(), []);
  const shifted = useMemo(() => stripMaterial(), []);
  const links = useMemo(() => BALMER.map(() => ({ current: null as ChalkLineHandle | null })), []);
  const labels = useRef<Array<THREE.Group | null>>([]);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const said = useRef('');

  useFrame((_, delta) => {
    const on = clamp01(rig.galaxy);
    const strips = clamp01(rig.spectra);
    if (root.current) root.current.visible = on + strips > 0.001;
    if (on + strips <= 0.001) return;
    const z = rig.z;
    if (spin.current) {
      spin.current.rotation.y += Math.min(delta, 0.1) * 0.05;
      spin.current.position.set(GALAXY[0], GALAXY[1], GALAXY[2] - (RECEDE * z) / 0.1);
    }
    mat.uniforms.uOpacity!.value = on;
    mat.uniforms.uRed!.value = clamp01(z * 4);
    rest.uniforms.uOpacity!.value = strips;
    shifted.uniforms.uOpacity!.value = strips;
    shifted.uniforms.uShift!.value = 1 + z;

    // Each line, from where it is in the lab's spectrum down to where it is in the galaxy's.
    const x = (nm: number) => SPECTRA[0] + ((nm - VISIBLE[0]) / (VISIBLE[1] - VISIBLE[0]) - 0.5) * STRIP.w;
    const top = SPECTRA[1] + STRIP.gap / 2;
    const bottom = SPECTRA[1] - STRIP.gap / 2;
    BALMER.forEach((l, i) => {
      links[i]!.current?.set(
        [
          [x(l.nm), top - STRIP.h / 2, SPECTRA[2] + 0.01],
          [Math.min(x(l.nm * (1 + z)), x(VISIBLE[1])), bottom + STRIP.h / 2, SPECTRA[2] + 0.01],
        ],
        1,
        0.6 * strips,
      );
      labels.current[i]?.position.set(x(l.nm), top + STRIP.h / 2, SPECTRA[2]);
      const el = texts.current[i];
      if (el) {
        el.style.opacity = String(strips);
        beside(el, 0, 1, 4);
      }
    });
    // The strips' names, inside their dim violet ends so they never run off a narrow screen, and how fast the galaxy
    // is going.
    const names: Array<[number, [number, number, number]]> = [
      [4, [x(VISIBLE[0]) + 0.2, top, SPECTRA[2] + 0.02]],
      [5, [x(VISIBLE[0]) + 0.2, bottom, SPECTRA[2] + 0.02]],
      [6, [SPECTRA[0], bottom - STRIP.h / 2, SPECTRA[2]]],
    ];
    for (const [i, at] of names) {
      labels.current[i]?.position.set(...at);
      const el = texts.current[i];
      if (!el) continue;
      el.style.opacity = String(strips);
      beside(el, i === 6 ? 0 : 1, i === 6 ? -1 : 0, i === 6 ? 8 : 2);
    }
    const speed = recession(z) * 100;
    const words = `z = ${z.toFixed(2)} · moving away at ${speed.toFixed(1)}% of light's speed`;
    if (said.current !== words && texts.current[6]) {
      said.current = words;
      texts.current[6].textContent = words;
    }
  });

  return (
    <group ref={root} visible={false}>
      <points ref={spin} geometry={geo} material={mat} rotation-x={0.5} frustumCulled={false} />
      <mesh position={[SPECTRA[0], SPECTRA[1] + STRIP.gap / 2, SPECTRA[2]]} material={rest}>
        <planeGeometry args={[STRIP.w, STRIP.h]} />
      </mesh>
      <mesh position={[SPECTRA[0], SPECTRA[1] - STRIP.gap / 2, SPECTRA[2]]} material={shifted}>
        <planeGeometry args={[STRIP.w, STRIP.h]} />
      </mesh>
      {links.map((h, i) => (
        <ChalkLine key={i} handle={h} color={SYM9.chalk} width={1.2} renderOrder={6} />
      ))}
      {[...BALMER.map((l) => l.name), 'here', 'the galaxy', ''].map((name, i) => (
        <group key={i} ref={(el) => void (labels.current[i] = el)}>
          <MathLabel
            ref={(el) => void (texts.current[i] = el)}
            className="math-label math-label--small"
            color={i === 5 ? SYM9.red : SYM9.chalk}
          >
            {name}
          </MathLabel>
        </group>
      ))}
    </group>
  );
}
