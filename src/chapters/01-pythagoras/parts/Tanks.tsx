import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathLabel } from '../../../engine/labels/MathLabel';
import { clamp01, easeOutCubic, lerp, smooth } from '../../../engine/ease';
import { angleDelta, pourLevels, squaresOn, triangle } from '../math';
import { pythagorasRig, SYM, TANK_DEPTH, uvToLocal } from '../rig';

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitEdges = new THREE.EdgesGeometry(unitBox);
const streamGeo = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true);

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#cfe6ee',
  transparent: true,
  opacity: 0.13,
  // Not too glossy: a mirror-sharp sun highlight overflows the HDR buffer and blooms into rainbow rings.
  roughness: 0.16,
  metalness: 0.1,
  envMapIntensity: 1.6,
  specularIntensity: 0.6,
  side: THREE.DoubleSide,
  depthWrite: false,
});

function waterMaterial(color: string) {
  // Physical only for specularIntensity: the low virtual sun would otherwise glare off every water surface.
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity: 0.86,
    roughness: 0.34,
    metalness: 0.05,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.22,
    envMapIntensity: 1.0,
    specularIntensity: 0.3,
  });
}

function streamMaterial(color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float flow = sin(vUv.y * 40.0 + uTime * 26.0 + sin(vUv.x * 12.0) * 2.0) * 0.5 + 0.5;
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        vec3 col = uColor * (1.0 + flow * 0.6);
        gl_FragColor = vec4(col, uOpacity * (0.55 + 0.35 * flow) * (0.6 + 0.4 * edge));
      }
    `,
  });
}

type Which = 'a' | 'b' | 'c';

/** Pour phases of a small tank: fly over the big tank, drain into it, fly home. */
export function pourPhases(p: number) {
  const fly = smooth(p / 0.28);
  const back = smooth((p - 0.84) / 0.16);
  const drain = clamp01((p - 0.3) / 0.5);
  return { travel: fly - back, drain, back };
}

const HOVER = TANK_DEPTH + 0.85;

function Tank({ which }: { which: Which }) {
  const rig = pythagorasRig();
  const group = useRef<THREE.Group>(null);
  const glass = useRef<THREE.Mesh>(null);
  const edges = useRef<THREE.LineSegments>(null);
  const water1 = useRef<THREE.Mesh>(null);
  const water2 = useRef<THREE.Mesh>(null);
  const stream = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const sumLabel = useRef<HTMLDivElement>(null);
  const labelGroup = useRef<THREE.Group>(null);
  const lastText = useRef('');
  const lastSum = useRef('');

  const color = SYM[which];
  const mats = useMemo(
    () => ({
      w1: waterMaterial(which === 'c' ? SYM.a : color),
      w2: waterMaterial(SYM.b),
      stream: streamMaterial(color),
      edges: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }),
    }),
    [which, color],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const S = rig.scale;
    const D = TANK_DEPTH;
    const t = triangle(rig.a, rig.b, rig.gamma);
    const squares = squaresOn(t);
    const sq = squares[which];
    const side = sq.side * S;
    const [hx, , hz] = uvToLocal(sq.center[0], sq.center[1], S);
    const rise = easeOutCubic(rig.tanks);
    let x = hx;
    let z = hz;
    // Sit a hair above the sand: a glass floor exactly at y = 0 z-fights with it and flickers.
    let y = -D * 1.02 * (1 - rise) + 0.008;
    let rot = sq.angle;
    let level = 1;

    if (which !== 'c') {
      const p = which === 'a' ? rig.pourA : rig.pourB;
      const ph = pourPhases(p);
      const c = squares.c;
      const [cx, , cz] = uvToLocal(c.center[0], c.center[1], S);
      x = lerp(hx, cx, ph.travel);
      z = lerp(hz, cz, ph.travel);
      y = lerp(y, HOVER, ph.travel) + Math.sin(Math.PI * ph.travel) * 0.35;
      rot = sq.angle + angleDelta(sq.angle, c.angle) * ph.travel;
      level = 1 - ph.drain;

      // Stream from the hovering tank down to the water surface in the big tank.
      const st = stream.current;
      if (st) {
        const on = ph.drain > 0 && ph.drain < 1 ? 1 : 0;
        const dA = Math.max(pourPhases(rig.pourA).drain, rig.cFull);
        const dB = Math.max(pourPhases(rig.pourB).drain, rig.cFull);
        const surface = Math.min(pourLevels(t.a, t.b, t.c, dA, dB).total, 1) * D;
        const top = y;
        const len = Math.max(top - surface, 0.01);
        const width = 0.05 * Math.sin(Math.PI * ph.drain) ** 0.3;
        st.visible = on > 0 && rig.tanks > 0.01;
        st.position.set(x, surface + len / 2, z);
        st.scale.set(width, len, width);
        mats.stream.uniforms.uTime!.value = state.clock.elapsedTime;
        mats.stream.uniforms.uOpacity!.value = on;
      }
    }

    g.visible = rig.tanks > 0.001;
    g.position.set(x, y, z);
    g.rotation.y = rot;

    glass.current?.scale.set(side, D, side);
    glass.current?.position.set(0, D / 2, 0);
    edges.current?.scale.set(side, D, side);
    edges.current?.position.set(0, D / 2, 0);

    const inner = side * 0.965;
    const w1 = water1.current;
    const w2 = water2.current;
    if (which === 'c') {
      const dA = Math.max(pourPhases(rig.pourA).drain, rig.cFull);
      const dB = Math.max(pourPhases(rig.pourB).drain, rig.cFull);
      const lv = pourLevels(t.a, t.b, t.c, dA, dB);
      const hA = lv.layerA * D * 0.985;
      const hB = lv.layerB * D * 0.985;
      if (w1) {
        w1.visible = hA > 0.002;
        w1.scale.set(inner, Math.max(hA, 0.001), inner);
        w1.position.set(0, hA / 2 + 0.004, 0);
      }
      if (w2) {
        w2.visible = hB > 0.002;
        w2.scale.set(inner, Math.max(hB, 0.001), inner);
        w2.position.set(0, hA + hB / 2 + 0.006, 0);
      }
    } else if (w1) {
      const h = level * D * 0.985;
      w1.visible = h > 0.002;
      w1.scale.set(inner, Math.max(h, 0.001), inner);
      w1.position.set(0, h / 2 + 0.004, 0);
    }

    // Labels: area of each square, ticking up as the tanks rise.
    labelGroup.current?.position.set(0, D + 0.32, 0);
    const area = sq.side * sq.side;
    const k = clamp01(rig.areaLabels * 1.15);
    const shown = rig.lab > 0.5 ? (area * k).toFixed(2) : String(Math.round(area * k));
    const text = `${which}² = ${shown}`;
    const el = label.current;
    if (el) {
      if (text !== lastText.current) {
        el.textContent = text;
        lastText.current = text;
      }
      el.style.opacity = String(rig.areaLabels * rig.tanks);
    }
    const sl = sumLabel.current;
    if (sl && which === 'c') {
      const dA = pourPhases(rig.pourA).drain;
      const dB = pourPhases(rig.pourB).drain;
      const fa = Math.round(t.a * t.a * dA);
      const fb = Math.round(t.b * t.b * dB);
      const sum = `${fa} + ${fb} = ${fa + fb}`;
      if (sum !== lastSum.current) {
        sl.textContent = sum;
        lastSum.current = sum;
      }
      const pouring = Math.max(rig.pourA > 0 ? 1 : 0, rig.pourB > 0 ? 1 : 0) * (1 - rig.cFull);
      sl.style.opacity = String(pouring * rig.areaLabels * rig.tanks);
    }
  });

  return (
    <>
      <group ref={group} visible={false}>
        <mesh ref={water1} geometry={unitBox} material={mats.w1} renderOrder={1} castShadow />
        {which === 'c' ? (
          <mesh ref={water2} geometry={unitBox} material={mats.w2} renderOrder={1} castShadow />
        ) : null}
        <mesh ref={glass} geometry={unitBox} material={glassMaterial} renderOrder={2} />
        <lineSegments ref={edges} geometry={unitEdges} material={mats.edges} renderOrder={3} />
        <group ref={labelGroup}>
          <MathLabel ref={label} className="math-label math-label--chip" color={color} />
          {which === 'c' ? (
            <group position={[0, -0.36, 0]}>
              <MathLabel ref={sumLabel} className="math-label math-label--small" />
            </group>
          ) : null}
        </group>
      </group>
      {which !== 'c' ? (
        <mesh ref={stream} geometry={streamGeo} material={mats.stream} visible={false} renderOrder={2} />
      ) : null}
    </>
  );
}

export function Tanks() {
  return (
    <>
      <Tank which="c" />
      <Tank which="a" />
      <Tank which="b" />
    </>
  );
}
