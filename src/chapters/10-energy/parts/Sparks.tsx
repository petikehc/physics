import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { trackAt } from '../math';
import { coasterRide, coasterTrack, energyRig, TEST_MU, trainNow } from '../rig';
import { testNow } from '../sandbox';

const MAX = 600;
const LIFE = 0.9;

/**
 * Sparks where friction works hardest: off the coaster's brakes as they clamp, and off the test car's wheels when it
 * runs with friction. Each spark flies off, falls and fades, orange going to red.
 */
export function Sparks() {
  const rig = energyRig();
  const points = useRef<THREE.Points>(null);
  const sim = useMemo(
    () => ({
      pos: new Float32Array(MAX * 3),
      vel: new Float32Array(MAX * 3),
      age: new Float32Array(MAX).fill(LIFE),
      next: 0,
      carry: 0,
    }),
    [],
  );
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(sim.pos, 3));
    g.setAttribute('aAge', new THREE.BufferAttribute(sim.age, 1));
    return g;
  }, [sim]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uLife: { value: LIFE } },
        vertexShader: /* glsl */ `
          attribute float aAge;
          uniform float uLife;
          varying float vK;
          void main() {
            vK = clamp(1.0 - aAge / uLife, 0.0, 1.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(90.0 * vK / -mv.z, 0.0, 6.0);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vK;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vK;
            vec3 c = mix(vec3(1.0, 0.25, 0.15), vec3(1.0, 0.85, 0.5), vK);
            gl_FragColor = vec4(c * a * 2.0, 1.0);
          }
        `,
      }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // Where sparks fly from now, and how many a second.
    const emit: Array<{ at: [number, number, number]; rate: number; dir: number }> = [];
    const on = clamp01(rig.sparks);
    if (on > 0.01) {
      if (rig.train > 0.5 && rig.gauge < 0.5) {
        const now = trainNow(rig);
        const brakes = coasterRide().brakes!;
        if (now.s >= brakes.from && now.v > 0.3) {
          const at = trackAt(coasterTrack(), now.s - 1).p;
          emit.push({ at: [at[0], at[1] + 0.15, at[2]], rate: 220 * Math.min(now.v / 20, 1) * on, dir: 1 });
        }
      }
      if (rig.test > 0.5) {
        const t = testNow(rig);
        const mu = t.live ? rig.mu : rig.run > 0.5 ? TEST_MU : 0;
        const v = t.sample.v;
        if (mu > 0 && Math.abs(v) > 0.3) {
          const at = trackAt(t.track, t.sample.s).p;
          emit.push({
            at: [at[0], at[1] + 0.1, at[2]],
            rate: 900 * mu * Math.min(Math.abs(v) / 10, 1) * on,
            dir: Math.sign(v),
          });
        }
      }
    }
    for (const e of emit) {
      sim.carry += e.rate * dt;
      while (sim.carry >= 1) {
        sim.carry -= 1;
        const i = sim.next;
        sim.next = (sim.next + 1) % MAX;
        sim.pos.set(e.at, i * 3);
        // Thrown back from the wheels and up, spraying out to the sides.
        sim.vel[i * 3] = -e.dir * (2 + Math.random() * 5);
        sim.vel[i * 3 + 1] = 1.5 + Math.random() * 4;
        sim.vel[i * 3 + 2] = (Math.random() - 0.5) * 5;
        sim.age[i] = Math.random() * 0.2;
      }
    }
    if (emit.length === 0) sim.carry = 0;
    for (let i = 0; i < MAX; i++) {
      if (sim.age[i]! >= LIFE) continue;
      sim.age[i]! += dt;
      sim.vel[i * 3 + 1]! -= 9.8 * dt;
      sim.pos[i * 3]! += sim.vel[i * 3]! * dt;
      sim.pos[i * 3 + 1]! += sim.vel[i * 3 + 1]! * dt;
      sim.pos[i * 3 + 2]! += sim.vel[i * 3 + 2]! * dt;
    }
    geo.attributes.position!.needsUpdate = true;
    geo.attributes.aAge!.needsUpdate = true;
    if (points.current) points.current.visible = sim.age.some((a) => a < LIFE);
  });

  return <points ref={points} geometry={geo} material={mat} frustumCulled={false} renderOrder={12} />;
}
