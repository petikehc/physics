import{M as e,pt as t,tt as n}from"./index-B3qk-4dW.js";var r=new n({color:`#cfe6ee`,transparent:!0,opacity:.13,roughness:.16,metalness:.1,envMapIntensity:1.6,specularIntensity:.6,side:2,depthWrite:!1});function i(t){return new n({color:t,transparent:!0,opacity:.86,roughness:.34,metalness:.05,emissive:new e(t),emissiveIntensity:.22,envMapIntensity:1,specularIntensity:.3})}function a(n){return new t({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uColor:{value:new e(n)},uOpacity:{value:0}},vertexShader:`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,fragmentShader:`
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
    `})}export{a as n,i as r,r as t};