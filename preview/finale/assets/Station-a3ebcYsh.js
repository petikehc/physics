import{d as e,m as t,n,u as r}from"./stations-C2bbVstv.js";import{t as i}from"./MathLabel-DxZAYyo3.js";import{t as a}from"./RoundedBox-zQQ1lA5c.js";import{A as o,Ct as s,D as c,F as l,K as u,L as d,M as f,N as p,O as m,Q as h,R as g,Tt as _,V as v,ct as ee,et as y,ft as b,ht as te,lt as ne,mt as x,rt as S,st as re,u as ie,v as ae,vt as oe,wt as C,x as w}from"./index-BUyJ30Ln.js";import{t as se}from"./ChalkLine-C9ylL-Jk.js";import{n as T}from"./ease-7End8lFK.js";import{t as E}from"./beside-C5LnErlj.js";import{A as ce,C as D,D as O,E as le,F as k,I as ue,M as A,O as j,P as M,R as de,S as N,V as fe,_ as P,a as pe,c as me,d as he,f as ge,g as _e,i as ve,j as F,k as I,t as ye,v as L,x as R,y as be,z as xe}from"./sound-DxxTlaYo.js";var z=t(e(),1),B=r(),Se=2.6;function Ce(){let e=F(),t=(0,z.useRef)(null),n=(0,z.useRef)(null),r=(0,z.useRef)(null),i=(0,z.useRef)(null),o=(0,z.useMemo)(()=>{let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t},[]),s=(0,z.useMemo)(()=>[0,1].map(()=>new y({color:I.blue,toneMapped:!1})),[]),c=(0,z.useMemo)(()=>new S({color:`#e7e8ec`,roughness:.45}),[]),u=(0,z.useMemo)(()=>new S({color:`#0b0f18`,roughness:.15,metalness:.6}),[]),d=(0,z.useMemo)(()=>new S({color:`#111216`,roughness:.9}),[]);return w(()=>{let a=T(e.ambulance),o=t.current;if(!o)return;if(o.visible=a>.01&&e.kind<.5,!o.visible){n.current&&(n.current.intensity=0);return}let c=A(e);o.position.set(c.at[0],0,be);let l=c.now*Se%1,u=l<.5&&l%.25<.14?1:.15,d=l>=.5&&l%.25<.14?1:.15;s[0].color.set(I.blue).multiplyScalar(.4+3.2*u),s[1].color.set(I.blue).multiplyScalar(.4+3.2*d);let f=Math.max(u,d);n.current&&(n.current.intensity=26*f*a),r.current&&(r.current.opacity=.32*f*a),i.current&&(i.current.opacity=.5*a)}),(0,B.jsxs)(`group`,{ref:t,visible:!1,children:[(0,B.jsx)(a,{args:[3.7,2.35,2.2],radius:.12,position:[-.85,1.73,0],material:c}),(0,B.jsx)(a,{args:[1.9,1.65,2.1],radius:.14,position:[1.95,1.38,0],material:c}),(0,B.jsxs)(`mesh`,{position:[.1,1.25,0],children:[(0,B.jsx)(`boxGeometry`,{args:[5.62,.26,2.24]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#d23a31`,roughness:.5})]}),(0,B.jsxs)(`mesh`,{position:[.1,1.54,0],children:[(0,B.jsx)(`boxGeometry`,{args:[5.62,.08,2.24]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#2c5bd8`,roughness:.5})]}),(0,B.jsx)(`mesh`,{position:[2.91,1.72,0],material:u,children:(0,B.jsx)(`boxGeometry`,{args:[.04,.62,1.86]})}),[1,-1].map(e=>(0,B.jsx)(`mesh`,{position:[2.05,1.76,e*1.06],material:u,children:(0,B.jsx)(`boxGeometry`,{args:[1.1,.5,.02]})},e)),[1,-1].map((e,t)=>(0,B.jsx)(`mesh`,{position:[1.9,2.29,e*.45],material:s[t],children:(0,B.jsx)(`boxGeometry`,{args:[.42,.16,.78]})},e)),[1,-1].map((e,t)=>(0,B.jsx)(`mesh`,{position:[-2.55,2.96,e*.92],material:s[t],children:(0,B.jsx)(`boxGeometry`,{args:[.18,.12,.18]})},e)),[1,-1].map(e=>(0,B.jsxs)(`mesh`,{position:[2.92,.92,e*.76],children:[(0,B.jsx)(`boxGeometry`,{args:[.04,.2,.34]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#fff6e0`,toneMapped:!1})]},e)),[1,-1].map(e=>(0,B.jsxs)(`mesh`,{position:[-2.72,1,e*.9],children:[(0,B.jsx)(`boxGeometry`,{args:[.04,.3,.2]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#ff3020`,toneMapped:!1})]},e)),[[1.95,1],[1.95,-1],[-1.75,1],[-1.75,-1]].map(([e,t])=>(0,B.jsx)(`mesh`,{position:[e,.42,t*.98],"rotation-x":Math.PI/2,material:d,children:(0,B.jsx)(`cylinderGeometry`,{args:[.42,.42,.3,18]})},`${e}${t}`)),(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[8.5,.03,0],scale:[12,3.4,1],renderOrder:3,children:[(0,B.jsx)(`planeGeometry`,{}),(0,B.jsx)(`meshBasicMaterial`,{ref:i,color:`#fff1d0`,alphaMap:o,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[0,.2,0],scale:[16,16,1],renderOrder:3,children:[(0,B.jsx)(`planeGeometry`,{}),(0,B.jsx)(`meshBasicMaterial`,{ref:r,color:I.blue,alphaMap:o,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,B.jsx)(`pointLight`,{ref:n,position:[1.9,3.1,0],color:I.blue,intensity:0,distance:22,decay:2})]})}var V=6e3,we=19,H={w:18,h:1.4,gap:2},Te=600,Ee=40,De=new C(..._e).sub(new C(...le)).normalize(),Oe=`
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
`;function ke(){return new x({transparent:!0,depthWrite:!1,uniforms:{uLines:{value:M.map(e=>e.nm)},uShift:{value:1},uOpacity:{value:0},uRange:{value:new s(...k)}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform float uLines[4];
      uniform float uShift;
      uniform float uOpacity;
      uniform vec2 uRange;
      varying vec2 vUv;
      ${Oe}
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
    `})}function Ae(){let e=4242,t=()=>(e=e*16807%2147483647,(e-1)/2147483646),n=new Float32Array(V*3),r=new Float32Array(V*3),i=new f(`#ffe6b8`),a=new f(`#a9c4ff`),o=new f(`#ff9fc8`),s=new f;for(let e=0;e<V;e++){let c=t()**1.6*we,l=2*Math.PI*(e%2)+c*.36+(t()-.5)*(.5+2.4/(c+1))+e%2*Math.PI,u=(t()-.5)*(.7+c*.16);n[e*3]=Math.cos(l)*c+u,n[e*3+1]=(t()-.5)*(1.4*Math.exp(-c/3)+.3),n[e*3+2]=Math.sin(l)*c+u,s.copy(i).lerp(a,T(c/(we*.55))),t()<.04&&c>4&&s.copy(o),r.set([s.r,s.g,s.b],e*3)}let l=new m;return l.setAttribute(`position`,new c(n,3)),l.setAttribute(`color`,new c(r,3)),l}function je(){return new x({transparent:!0,depthWrite:!1,blending:2,vertexColors:!0,uniforms:{uOpacity:{value:0},uRed:{value:0}},vertexShader:`
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(260.0 / -mv.z, 1.0, 6.0);
        gl_Position = projectionMatrix * mv;
      }
    `,fragmentShader:`
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
    `})}function Me(){let e=F(),t=(0,z.useRef)(null),n=(0,z.useRef)(null),r=(0,z.useMemo)(()=>Ae(),[]),a=(0,z.useMemo)(()=>je(),[]),o=(0,z.useMemo)(()=>ke(),[]),s=(0,z.useMemo)(()=>ke(),[]),c=(0,z.useMemo)(()=>M.map(()=>({current:null})),[]),l=(0,z.useRef)([]),u=(0,z.useRef)([]),d=(0,z.useRef)(``);return w((r,i)=>{let f=T(e.galaxy),p=T(e.spectra);if(t.current&&(t.current.visible=f+p>.001),f+p<=.001){for(let e of u.current)e&&e.style.opacity!==`0`&&(e.style.opacity=`0`);return}let m=e.z,h=r.size.width<Te;n.current&&(n.current.rotation.y+=Math.min(i,.1)*.05,n.current.position.set(..._e).addScaledVector(De,Ee*m/.1)),a.uniforms.uOpacity.value=f,a.uniforms.uRed.value=T(m*4),o.uniforms.uOpacity.value=p,s.uniforms.uOpacity.value=p,s.uniforms.uShift.value=1+m;let g=e=>O[0]+((e-k[0])/(k[1]-k[0])-.5)*H.w,_=O[1]+H.gap/2,v=O[1]-H.gap/2;M.forEach((e,t)=>{c[t].current?.set([[g(e.nm),_-H.h/2,O[2]+.01],[Math.min(g(e.nm*(1+m)),g(k[1])),v+H.h/2,O[2]+.01]],1,.6*p),l.current[t]?.position.set(g(e.nm),_+H.h/2,O[2]);let n=u.current[t];n&&(n.style.opacity=String(h&&t>=2?0:p),E(n,0,1,8))});let ee=[[4,[g(k[0])+.2,_,O[2]+.02]],[5,[g(k[0])+.2,v,O[2]+.02]],[6,[h?O[0]:g(k[1]),v-H.h/2,O[2]]]];for(let[e,t]of ee){l.current[e]?.position.set(...t);let n=u.current[e];n&&(n.style.opacity=String(p),E(n,e===6?h?0:-1:1,e===6?-1:0,e===6?6:2))}let y=xe(m)*100,b=`z = ${m.toFixed(2)} · receding at ${y.toFixed(1)}% of light speed`;d.current!==b&&u.current[6]&&(d.current=b,u.current[6].textContent=b)}),(0,B.jsxs)(`group`,{ref:t,visible:!1,children:[(0,B.jsx)(`points`,{ref:n,geometry:r,material:a,"rotation-x":.5,frustumCulled:!1}),(0,B.jsx)(`mesh`,{position:[O[0],O[1]+H.gap/2,O[2]],material:o,children:(0,B.jsx)(`planeGeometry`,{args:[H.w,H.h]})}),(0,B.jsx)(`mesh`,{position:[O[0],O[1]-H.gap/2,O[2]],material:s,children:(0,B.jsx)(`planeGeometry`,{args:[H.w,H.h]})}),c.map((e,t)=>(0,B.jsx)(se,{handle:e,color:I.chalk,width:1.2,renderOrder:6},t)),[...M.map(e=>e.name),`here`,`the galaxy`,``].map((e,t)=>(0,B.jsx)(`group`,{ref:e=>void(l.current[t]=e),children:(0,B.jsx)(i,{ref:e=>void(u.current[t]=e),className:`math-label math-label--small`,color:t===5?I.red:I.chalk,children:e})},t))]})}var U=n(`doppler`),Ne=new re(new C(0,1,0),-(U.y+L)),W=new C;function Pe(){let e=F(),t=ae(e=>e.set),n=(0,z.useRef)(null),[r,i]=(0,z.useState)(!1),a=(0,z.useRef)(!1);return w(t=>{let i=n.current;if(!i)return;i.visible=e.interactive>.5&&e.you>.5,i.position.set(e.lx,L+.04,e.lz);let o=1+Math.sin(t.clock.elapsedTime*3)*.06;i.scale.setScalar((r||a.current?1.25:1)*o)}),(0,B.jsxs)(`group`,{ref:n,visible:!1,onPointerOver:t=>{e.interactive<.5||(t.stopPropagation(),i(!0),document.body.style.cursor=`grab`)},onPointerOut:()=>{i(!1),a.current||(document.body.style.cursor=``)},onPointerDown:n=>{e.interactive<.5||(n.stopPropagation(),n.target.setPointerCapture?.(n.pointerId),a.current=!0,document.body.style.cursor=`grabbing`,t({dragging:!0}))},onPointerMove:e=>{a.current&&(e.stopPropagation(),e.ray.intersectPlane(Ne,W)&&me(W.x-U.x,W.z-U.z))},onPointerUp:e=>{e.target.releasePointerCapture?.(e.pointerId),a.current=!1,document.body.style.cursor=r?`grab`:``,t({dragging:!1})},children:[(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,renderOrder:20,children:[(0,B.jsx)(`ringGeometry`,{args:[.62,.74,40]}),(0,B.jsx)(`meshBasicMaterial`,{color:I.ear,transparent:!0,opacity:.9,toneMapped:!1,depthTest:!1})]}),(0,B.jsxs)(`mesh`,{position:[0,.9,0],children:[(0,B.jsx)(`cylinderGeometry`,{args:[1.1,1.1,1.9,16]}),(0,B.jsx)(`meshBasicMaterial`,{transparent:!0,opacity:0,depthWrite:!1})]})]})}var G=1.5;function Fe(){let e=[[0,0],[.14,-.35],[.3,-.9],[.42,-1.7],[.46,-3],[.46,-5.6],[.38,-6.7],[.3,-7]].map(([e,t])=>new s(e,t)),t=new u(e,24);return t.rotateZ(-Math.PI/2),t}function Ie(e,t){let n=new te(e.map(([e,t])=>new s(e,t))),r=new g(n,{depth:t,bevelEnabled:!1});return r.translate(0,0,-t/2),r}function Le(){let e=new p(1,1,48,1,!0);return e.translate(0,-.5,0),e.rotateZ(-Math.PI/2),e}function Re(e,t){return new x({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new f(e)},uOpacity:{value:0},uTime:{value:0}},vertexShader:`
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
    `,fragmentShader:`
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
        ${t?`float ang = atan(vLocal.z, vLocal.y);
               a *= 0.35 + 0.9 * noise(vec2(ang * 3.0, along * 6.0 - uTime * 3.0));`:``}
        gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
      }
    `})}function ze(){let e=F(),t=(0,z.useRef)(null),n=(0,z.useRef)(null),r=(0,z.useRef)(null),i=(0,z.useRef)(null),a=(0,z.useRef)(null),o=(0,z.useMemo)(()=>({body:Fe(),wings:Ie([[-2.3,0],[-5.4,3.3],[-6.1,3.3],[-5.9,0],[-6.1,-3.3],[-5.4,-3.3]],.08),fin:Ie([[-4.9,.3],[-6.55,2.15],[-6.95,2.15],[-6.9,.3]],.07),cone:Le()}),[]),s=(0,z.useMemo)(()=>Re(`#cfe0ff`,!1),[]),c=(0,z.useMemo)(()=>Re(`#ffffff`,!0),[]),l=(0,z.useMemo)(()=>new S({color:`#8a93a3`,roughness:.38,metalness:.55}),[]);return w(o=>{let l=T(e.jet),u=t.current;if(!u||(u.visible=l>.01&&e.kind>.5,!u.visible))return;let d=A(e);u.position.set(...d.at),s.uniforms.uTime.value=o.clock.elapsedTime,c.uniforms.uTime.value=o.clock.elapsedTime;let f=de(d.m);if(n.current&&(n.current.visible=f!==null&&e.cone>.01,f!==null)){let t=Math.max(d.now-R,e.from),r=Math.ceil(t/D)*D,i=d.at[0]-d.path(Math.min(r,d.now)),a=Math.max(i*Math.cos(f)**2,.01);n.current.scale.set(a,a*Math.tan(f),a*Math.tan(f)),s.uniforms.uOpacity.value=.2*T(e.cone)*T((d.m-1)*8)}let p=Math.exp(-(((d.m-1.02)/.09)**2));if(r.current&&(r.current.visible=p>.02,c.uniforms.uOpacity.value=.5*p*l),i.current&&i.current.color.set(`#ffb070`).multiplyScalar(1.2+2.4*T(d.m)),a.current){let e=d.now*1.1%1<.06?4:.2;a.current.color.set(`#ffffff`).multiplyScalar(e)}}),(0,B.jsxs)(`group`,{ref:t,visible:!1,children:[(0,B.jsxs)(`group`,{scale:G,children:[(0,B.jsx)(`mesh`,{geometry:o.body,material:l}),(0,B.jsx)(`mesh`,{geometry:o.wings,material:l,"rotation-x":Math.PI/2}),(0,B.jsx)(`mesh`,{geometry:o.fin,material:l}),(0,B.jsxs)(`mesh`,{position:[-1.7,.3,0],scale:[.95,.3,.3],children:[(0,B.jsx)(`sphereGeometry`,{args:[1,18,12]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#0c1424`,roughness:.1,metalness:.7})]}),(0,B.jsxs)(`mesh`,{position:[-7.02,0,0],"rotation-z":Math.PI/2,children:[(0,B.jsx)(`circleGeometry`,{args:[.28,18]}),(0,B.jsx)(`meshBasicMaterial`,{ref:i,color:`#ffb070`,toneMapped:!1,side:2})]}),(0,B.jsxs)(`mesh`,{position:[-5.75,0,-3.3],children:[(0,B.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#ff4030`,toneMapped:!1})]}),(0,B.jsxs)(`mesh`,{position:[-5.75,0,3.3],children:[(0,B.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,B.jsx)(`meshBasicMaterial`,{color:`#40ff70`,toneMapped:!1})]}),(0,B.jsxs)(`mesh`,{position:[-6.8,2.15,0],children:[(0,B.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,B.jsx)(`meshBasicMaterial`,{ref:a,color:`#ffffff`,toneMapped:!1})]})]}),(0,B.jsx)(`mesh`,{ref:n,geometry:o.cone,material:s,visible:!1,renderOrder:12}),(0,B.jsx)(`mesh`,{ref:r,geometry:o.cone,material:c,position:[-1.6*G,0,0],scale:[3.2*G,2.5*G,2.5*G],visible:!1,renderOrder:13}),(0,B.jsx)(`pointLight`,{position:[-7.6,0,0],color:I.sodium,intensity:6,distance:10,decay:2})]})}function Be(e,t){let n=A(e);return n.now<=e.from?1/0:ue(n.path,n.at[1],n.at[2],n.c,[t[0],t[1]+ye,t[2]],e.from,n.now).at}var K=[`ahead`,`behind`,`under`,`you`],q={ahead:I.blue,behind:I.red,under:I.chalk,you:I.ear};function Ve(){let e=F(),t=(0,z.useRef)([]),n=(0,z.useRef)([]),r=(0,z.useRef)([]),a=(0,z.useMemo)(()=>new o(.2,.8,4,12),[]),s=(0,z.useMemo)(()=>new oe(.15,14,10),[]),c=(0,z.useMemo)(()=>{let e=new b(.42,.5,40);return e.rotateX(-Math.PI/2),e},[]),l=(0,z.useMemo)(()=>K.map(e=>new S({color:`#2a2e38`,roughness:.7,emissive:q[e],emissiveIntensity:.18})),[]),u=(0,z.useMemo)(()=>K.map(e=>new y({color:q[e],transparent:!0,toneMapped:!1})),[]);return w(()=>{let i=T(e.listeners),a=e.kind<.5,o={ahead:he,behind:ge,under:ce,you:[e.lx,L,e.lz]},s={ahead:a?i:0,behind:a?i:0,under:a?0:i,you:T(e.you)};K.forEach((i,a)=>{let c=t.current[a],l=n.current[a];if(!c||(c.visible=s[i]>.01,c.position.set(...o[i]),u[a].opacity=.8*s[i],!l))return;let d=``;if(c.visible){let t=o[i],n=pe(e,[t[0],t[1]+ye,t[2]],i===`you`?e.lm:0),r=i===`you`?`you hear`:`hears`;d=n===null?`${r} nothing yet`:`${r} ${n.ratio.toFixed(2)} f`,i===`under`&&n!==null&&A(e).now-Be(e,t)<1.6&&(d=`boom!`)}r.current[a]!==d&&(r.current[a]=d,l.textContent=d),l.style.opacity=String(i===`you`?s[i]:s[i]*T(e.hears)),i===`under`?E(l,-1,1,2):E(l,0,1,4)})}),(0,B.jsx)(`group`,{children:K.map((e,r)=>(0,B.jsxs)(`group`,{ref:e=>void(t.current[r]=e),visible:!1,children:[(0,B.jsx)(`mesh`,{geometry:a,material:l[r],position:[0,.62,0]}),(0,B.jsx)(`mesh`,{geometry:s,material:l[r],position:[0,1.38,0]}),(0,B.jsx)(`mesh`,{geometry:c,material:u[r],position:[0,.02,0]}),(0,B.jsx)(`group`,{position:[0,1.75,0],children:(0,B.jsx)(i,{ref:e=>void(n.current[r]=e),className:`math-label math-label--small`,color:q[e]})})]},e))})}var He=`
  uniform vec3 uBlue;
  uniform vec3 uRed;
  vec3 stretchColor(float m, float cosTheta) {
    float t = clamp((1.0 - m * cosTheta - 1.0) / 0.45, -1.0, 1.0);
    vec3 white = vec3(0.92, 0.94, 1.0);
    return t < 0.0 ? mix(white, uBlue, -t) : mix(white, uRed, t);
  }
`,J=()=>({uBlue:{value:new f(I.blue).multiplyScalar(1.3)},uRed:{value:new f(I.red).multiplyScalar(1.2)}});function Ue(){return new x({transparent:!0,depthWrite:!1,side:0,blending:2,uniforms:{...J(),uOpacity:{value:0}},vertexShader:`
      attribute vec2 aInfo;
      varying vec3 vLocal;
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vInfo;
      void main() {
        vLocal = position;
        vInfo = aInfo;
        vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalize(mat3(viewMatrix) * mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,fragmentShader:`
      uniform float uOpacity;
      varying vec3 vLocal;
      varying vec3 vN;
      varying vec3 vView;
      varying vec2 vInfo;
      ${He}
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vView)));
        float a = (0.03 + 0.97 * pow(rim, 4.0)) * vInfo.x * uOpacity;
        gl_FragColor = vec4(stretchColor(vInfo.y, normalize(vLocal).x) * a * 0.2, 1.0);
      }
    `})}function We(){return new x({transparent:!0,depthWrite:!1,blending:2,uniforms:{...J(),uShells:{value:Array.from({length:40},()=>new _)},uCount:{value:0},uSource:{value:new s},uOpacity:{value:0}},vertexShader:`
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      #define MAX 40
      uniform vec4 uShells[MAX];
      uniform int uCount;
      uniform vec2 uSource;
      uniform float uOpacity;
      varying vec2 vXZ;
      ${He}
      void main() {
        vec3 col = vec3(0.0);
        for (int i = 0; i < MAX; i++) {
          if (i >= uCount) break;
          vec4 s = uShells[i];
          // Where the sphere sent from height uSource.x meets the ground: a ring.
          float h = uSource.x;
          if (s.y <= h) continue;
          float g = sqrt(s.y * s.y - h * h);
          float d = length(vXZ - vec2(s.x, uSource.y));
          float w = max(fwidth(d) * 1.4, 0.035);
          float line = 1.0 - smoothstep(0.0, w, abs(d - g));
          float cosTheta = (vXZ.x - s.x) / s.y;
          col += stretchColor(s.w, cosTheta) * line * s.z;
        }
        gl_FragColor = vec4(col * uOpacity * 0.75, 1.0);
      }
    `})}function Ge(){let e=F(),t=(0,z.useRef)(null),n=(0,z.useMemo)(()=>Ue(),[]),r=(0,z.useMemo)(()=>We(),[]),i=(0,z.useMemo)(()=>new v(new Float32Array(80),2),[]),a=(0,z.useMemo)(()=>{let e=new oe(1,40,24);return e.setAttribute(`aInfo`,i),e},[i]),o=(0,z.useMemo)(()=>{let e=new ee(240,90,1,1);return e.rotateX(-Math.PI/2),e.translate(0,L+.035,0),e},[]),s=(0,z.useMemo)(()=>new h,[]);return w(()=>{let a=T(e.spheres),o=T(e.rings),c=t.current;if(!c)return;if(a+o<.001){c.count=0,r.uniforms.uCount.value=0;return}let l=A(e),u=fe(l.path,l.c,l.now,D,e.from,R).slice(0,40),d=r.uniforms.uShells.value;u.forEach((e,t)=>{let n=l.now-e.sent,r=T(e.r/.6)*T((R-n)/1.2),a=l.machAt(e.sent);s.makeScale(Math.max(e.r,.001),Math.max(e.r,.001),Math.max(e.r,.001)).setPosition(e.x,l.at[1],l.at[2]),c.setMatrixAt(t,s),i.setXY(t,r,a),d[t].set(e.x,e.r,r,a)}),c.count=u.length,c.instanceMatrix.needsUpdate=!0,i.needsUpdate=!0,n.uniforms.uOpacity.value=a,r.uniforms.uCount.value=u.length,r.uniforms.uSource.value.set(l.at[1]-L,l.at[2]),r.uniforms.uOpacity.value=o}),(0,B.jsxs)(`group`,{children:[(0,B.jsx)(`instancedMesh`,{ref:t,args:[a,n,40],frustumCulled:!1,renderOrder:11}),(0,B.jsx)(`mesh`,{geometry:o,material:r,frustumCulled:!1,renderOrder:10})]})}var Y=j[1]-j[0],X=(j[0]+j[1])/2,Z=[j[0]-130,j[1]+5],Ke=(Z[0]+Z[1])/2,qe=32,Je=7.2,Q=1.9;function Ye(e){let t=e;return()=>(t=t*16807%2147483647,(t-1)/2147483646)}function Xe(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i*(3-2*i)),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t}function Ze(){let e=Ye(9),t=[];for(let n of[-1,1]){let r=j[0];for(;r<j[1];){let i=9+e()*14,a=e()<.25?3+e()*4:.4,o=r+i/2,s=n>0;if(!s||Math.abs(o)>40){let r=10+e()*8,a=s?9:N+1;t.push({x:o,z:n*(a+r/2),w:i,d:r,h:8+e()*(s?14:24)})}r+=i+a}}return t}function Qe(){let e=new S({color:`#16171d`,roughness:.92,metalness:0}),t={uLit:{value:0}};return e.userData.uniforms=t,e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWorld;
varying vec3 vWorldN;`).replace(`#include <project_vertex>`,`#include <project_vertex>
        mat4 placed = modelMatrix;
        #ifdef USE_INSTANCING
          placed = modelMatrix * instanceMatrix;
        #endif
        vWorld = (placed * vec4(transformed, 1.0)).xyz;
        vWorldN = normalize(mat3(placed) * objectNormal);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
        uniform float uLit;
        varying vec3 vWorld;
        varying vec3 vWorldN;
        float hash3(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
        if (abs(vWorldN.y) < 0.5 && vWorld.y > 3.2) {
          float u = abs(vWorldN.x) > 0.5 ? vWorld.z : vWorld.x;
          vec2 cell = vec2(u / 3.1, (vWorld.y - 3.2) / 3.3);
          vec2 f = fract(cell);
          float inside = step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.82);
          // Which wall it is, rounded: the interpolated normal wavers, and a floor would flicker between walls.
          float h = hash3(vec3(floor(cell), round(vWorldN.x * 2.0 + vWorldN.z * 3.0)));
          vec3 warm = vec3(1.0, 0.74, 0.42) * (0.34 + 0.26 * fract(h * 13.0));
          vec3 cool = vec3(0.55, 0.7, 1.0) * 0.3;
          vec3 glass = vec3(0.03, 0.035, 0.05);
          vec3 lit = h > 0.95 ? cool : h > 0.74 ? warm : glass;
          totalEmissiveRadiance += lit * inside * uLit;
        }`)},e}function $e(){let e=F(),t=(0,z.useMemo)(()=>Xe(),[]),n=(0,z.useMemo)(()=>{let e=[];for(let t=j[0]+22;t<j[1]-4;t+=qe)e.push({x:t,side:1}),e.push({x:t+qe/2,side:-1});return e},[]),r=(0,z.useMemo)(()=>{let e=[];for(let t=j[0];t<j[1];t+=9)e.push(t+1.5);return e},[]),i=(0,z.useMemo)(()=>Ze(),[]),a=(0,z.useMemo)(()=>Qe(),[]),o=(0,z.useRef)(null),s=(0,z.useRef)(null),c=(0,z.useRef)(null),l=(0,z.useRef)(null),u=(0,z.useRef)(null),f=(0,z.useRef)(null),p=(0,z.useRef)(null),m=(0,z.useRef)(null),g=(0,z.useRef)(null),_=(0,z.useRef)(null);return(0,z.useLayoutEffect)(()=>{let e=new h,t=new ne,a=new ne().setFromEuler(new d(-Math.PI/2,0,0)),p=new C,m=new C;n.forEach(({x:n,side:r},i)=>{let u=r*(P+1.2);o.current?.setMatrixAt(i,e.compose(m.set(n,Je/2,u),t.identity(),p.set(1,1,1))),s.current?.setMatrixAt(i,e.compose(m.set(n,7.15,u-r*Q/2),t.identity(),p.set(1,1,Q))),c.current?.setMatrixAt(i,e.compose(m.set(n,7,u-r*Q),t.identity(),p.set(1,1,1))),l.current?.setMatrixAt(i,e.compose(m.set(n,L+.02,u-r*Q),a,p.set(13,13,1)))});for(let e of[o,s,c,l])e.current&&(e.current.instanceMatrix.needsUpdate=!0);r.forEach((t,n)=>u.current?.setMatrixAt(n,e.compose(m.set(t,.035,0),a,p.set(3,.14,1)))),u.current&&(u.current.instanceMatrix.needsUpdate=!0),i.forEach((n,r)=>f.current?.setMatrixAt(r,e.compose(m.set(n.x,n.h/2,n.z),t.identity(),p.set(n.w,n.h,n.d)))),f.current&&(f.current.instanceMatrix.needsUpdate=!0)},[n,r,i]),w(()=>{let t=T(e.street);_.current&&(_.current.visible=t>.001),p.current&&p.current.color.set(I.sodium).multiplyScalar(.25+2.2*t),m.current&&(m.current.opacity=.42*t),g.current&&(g.current.emissiveIntensity=.08+.1*t),a.userData.uniforms.uLit.value=t}),(0,B.jsxs)(`group`,{ref:_,visible:!1,children:[(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Ke,0,0],receiveShadow:!0,children:[(0,B.jsx)(`planeGeometry`,{args:[Z[1]-Z[0],420]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#0d0e12`,roughness:1})]}),(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[X,.02,0],children:[(0,B.jsx)(`planeGeometry`,{args:[Y,P*2]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#1b1c22`,roughness:.82})]}),[1,-1].map(e=>(0,B.jsxs)(`group`,{children:[(0,B.jsxs)(`mesh`,{position:[X,L/2,e*((P+N)/2)],children:[(0,B.jsx)(`boxGeometry`,{args:[Y,L,N-P]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#2a2b31`,roughness:.95})]}),(0,B.jsxs)(`mesh`,{position:[X,L/2+.005,e*(P+.12)],children:[(0,B.jsx)(`boxGeometry`,{args:[Y,L+.01,.24]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#4a4b52`,roughness:.9})]}),(0,B.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[X,.035,e*(P-.35)],children:[(0,B.jsx)(`planeGeometry`,{args:[Y,.12]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#cfc8b4`,roughness:.7,emissive:`#cfc8b4`,emissiveIntensity:.1})]})]},e)),(0,B.jsxs)(`instancedMesh`,{ref:u,args:[void 0,void 0,r.length],frustumCulled:!1,children:[(0,B.jsx)(`planeGeometry`,{}),(0,B.jsx)(`meshStandardMaterial`,{ref:g,color:`#d8d1bd`,roughness:.7,emissive:`#d8d1bd`,emissiveIntensity:.1})]}),(0,B.jsxs)(`instancedMesh`,{ref:o,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,B.jsx)(`cylinderGeometry`,{args:[.09,.13,Je,8]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,B.jsxs)(`instancedMesh`,{ref:s,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,B.jsx)(`boxGeometry`,{args:[.1,.1,1]}),(0,B.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,B.jsxs)(`instancedMesh`,{ref:c,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,B.jsx)(`boxGeometry`,{args:[.7,.16,.36]}),(0,B.jsx)(`meshBasicMaterial`,{ref:p,color:I.sodium,toneMapped:!1})]}),(0,B.jsxs)(`instancedMesh`,{ref:l,args:[void 0,void 0,n.length],frustumCulled:!1,renderOrder:2,children:[(0,B.jsx)(`planeGeometry`,{}),(0,B.jsx)(`meshBasicMaterial`,{ref:m,color:I.sodium,alphaMap:t,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,B.jsx)(`instancedMesh`,{ref:f,args:[void 0,a,i.length],frustumCulled:!1,castShadow:!1,children:(0,B.jsx)(`boxGeometry`,{})})]})}var $=n(`doppler`),et=[[-12,7,-P+.7],[4,7,P-.7],[20,7,-P+.7]];function tt(){let e=F(),t=(0,z.useRef)([]),n=(0,z.useRef)(!0);return w((r,i)=>{let a=T(e.street);for(let e of t.current)e&&(e.intensity=60*a);if(e.mode>1.5&&(e.interactive>.5||e.lab>.5)){let t=Math.min(i,.1);e.sandT+=t,e.lm!==0&&(e.lx=((e.lx+e.lm*3*t+26)%52+52)%52-26);let r=ve(e)!==null;r&&!n.current&&e.kind>.5&&e.you>.5&&ie.cue(`boom`,{gain:.8}),n.current=r}}),(0,B.jsxs)(`group`,{position:[$.x,$.y,$.z],children:[(0,B.jsx)($e,{}),et.map((e,n)=>(0,B.jsx)(`pointLight`,{ref:e=>void(t.current[n]=e),position:e,color:I.sodium,intensity:0,distance:34,decay:2},n)),(0,B.jsx)(Ce,{}),(0,B.jsx)(ze,{}),(0,B.jsx)(Ge,{}),(0,B.jsx)(Ve,{}),(0,B.jsx)(Me,{}),(0,B.jsx)(Pe,{})]})}export{tt as default};