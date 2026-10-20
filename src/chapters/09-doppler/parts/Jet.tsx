import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp01 } from '../../../engine/ease';
import { machAngle } from '../math';
import { dopplerRig, MAX_AGE, PERIOD, source, SYM9 } from '../rig';

const LENGTH = 7;

function fuselage(): THREE.LatheGeometry {
  // Nose at the origin, tail back along −y (turned onto −x below).
  const profile = [
    [0, 0],
    [0.14, -0.35],
    [0.3, -0.9],
    [0.42, -1.7],
    [0.46, -3],
    [0.46, -5.6],
    [0.38, -6.7],
    [0.3, -LENGTH],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(profile, 24);
  g.rotateZ(-Math.PI / 2);
  return g;
}

function plate(points: Array<[number, number]>, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A translucent cone opening backwards from the origin along −x, one unit long and one unit in radius at its base. */
function unitCone(): THREE.ConeGeometry {
  const g = new THREE.ConeGeometry(1, 1, 48, 1, true);
  g.translate(0, -0.5, 0);
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Glows at the edges seen side on, faint face on: a surface of sound, or of mist. */
function sheen(color: string, noise: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vView;
      varying vec3 vLocal;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vView)));
        float a = 0.18 + 0.82 * pow(rim, 2.0);
        // Along the cone (local x runs 0 at the tip to −1 at the base): fade in from the tip and out at the base.
        float along = -vLocal.x;
        a *= smoothstep(0.0, 0.08, along) * (1.0 - smoothstep(0.7, 1.0, along));
        ${
          noise
            ? `float ang = atan(vLocal.z, vLocal.y);
               a *= 0.35 + 0.9 * noise(vec2(ang * 3.0, along * 6.0 - uTime * 3.0));`
            : ''
        }
        gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
      }
    `,
  });
}

/**
 * The jet: a small swept-wing plane facing along +x, nose at its origin. Past the speed of sound it drags a cone behind
 * it (the waves it outruns, piled into one surface); through the speed of sound, a cone of mist rings its wings.
 */
export function Jet() {
  const rig = dopplerRig();
  const group = useRef<THREE.Group>(null);
  const cone = useRef<THREE.Mesh>(null);
  const vapour = useRef<THREE.Mesh>(null);
  const flame = useRef<THREE.MeshBasicMaterial>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(
    () => ({
      body: fuselage(),
      wings: plate(
        [
          [-2.3, 0],
          [-5.4, 3.3],
          [-6.1, 3.3],
          [-5.9, 0],
          [-6.1, -3.3],
          [-5.4, -3.3],
        ],
        0.08,
      ),
      fin: plate(
        [
          [-4.9, 0.3],
          [-6.55, 2.15],
          [-6.95, 2.15],
          [-6.9, 0.3],
        ],
        0.07,
      ),
      cone: unitCone(),
    }),
    [],
  );
  const coneMat = useMemo(() => sheen('#cfe0ff', false), []);
  const mistMat = useMemo(() => sheen('#ffffff', true), []);
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#8a93a3', roughness: 0.38, metalness: 0.55 }),
    [],
  );

  useFrame((state) => {
    const on = clamp01(rig.jet);
    const g = group.current;
    if (!g) return;
    g.visible = on > 0.01 && rig.kind > 0.5;
    if (!g.visible) return;
    const s = source(rig);
    g.position.set(...s.at);
    coneMat.uniforms.uTime!.value = state.clock.elapsedTime;
    mistMat.uniforms.uTime!.value = state.clock.elapsedTime;

    // The cone reaches back to where the oldest wave still drawn touches it.
    const mu = machAngle(s.m);
    if (cone.current) {
      cone.current.visible = mu !== null && rig.cone > 0.01;
      if (mu !== null) {
        const oldest = Math.max(s.now - MAX_AGE, rig.from);
        const sent = Math.ceil(oldest / PERIOD) * PERIOD;
        const d = s.at[0] - s.path(Math.min(sent, s.now));
        const len = Math.max(d * Math.cos(mu) ** 2, 0.01);
        cone.current.scale.set(len, len * Math.tan(mu), len * Math.tan(mu));
        coneMat.uniforms.uOpacity!.value = 0.55 * clamp01(rig.cone) * clamp01((s.m - 1) * 8);
      }
    }
    // The mist shows only close to the speed of sound.
    const mist = Math.exp(-(((s.m - 1.02) / 0.09) ** 2));
    if (vapour.current) {
      vapour.current.visible = mist > 0.02;
      mistMat.uniforms.uOpacity!.value = 0.9 * mist * on;
    }
    if (flame.current) flame.current.color.set('#ffb070').multiplyScalar(1.2 + 2.4 * clamp01(s.m));
    if (strobe.current) {
      const blink = (s.now * 1.1) % 1 < 0.06 ? 4 : 0.2;
      strobe.current.color.set('#ffffff').multiplyScalar(blink);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geo.body} material={metal} />
      <mesh geometry={geo.wings} material={metal} rotation-x={Math.PI / 2} />
      <mesh geometry={geo.fin} material={metal} />
      <mesh position={[-1.7, 0.3, 0]} scale={[0.95, 0.3, 0.3]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color="#0c1424" roughness={0.1} metalness={0.7} />
      </mesh>
      <mesh position={[-LENGTH - 0.02, 0, 0]} rotation-z={Math.PI / 2}>
        <circleGeometry args={[0.28, 18]} />
        <meshBasicMaterial ref={flame} color="#ffb070" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Wingtip lights, red to port and green to starboard, and a white strobe on the tail. */}
      <mesh position={[-5.75, 0, -3.3]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#ff4030" toneMapped={false} />
      </mesh>
      <mesh position={[-5.75, 0, 3.3]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial color="#40ff70" toneMapped={false} />
      </mesh>
      <mesh position={[-6.8, 2.15, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshBasicMaterial ref={strobe} color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh ref={cone} geometry={geo.cone} material={coneMat} visible={false} renderOrder={12} />
      <mesh
        ref={vapour}
        geometry={geo.cone}
        material={mistMat}
        position={[-1.6, 0, 0]}
        scale={[3.2, 2.5, 2.5]}
        visible={false}
        renderOrder={13}
      />
      <pointLight
        position={[-LENGTH - 0.6, 0, 0]}
        color={SYM9.sodium}
        intensity={6}
        distance={10}
        decay={2}
      />
    </group>
  );
}
