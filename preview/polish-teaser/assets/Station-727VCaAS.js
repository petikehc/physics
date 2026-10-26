import{d as e,m as t,n,u as r}from"./stations-C9SaMvFw.js";import{t as i}from"./MathLabel-AAlbLW5S.js";import{t as a}from"./RoundedBox-B_Z5gMSA.js";import{$ as o,Et as s,H as c,I as l,N as u,O as d,P as f,R as p,S as m,Tt as h,b as g,c as _,ct as v,gt as y,ht as b,it as x,j as ee,k as te,lt as ne,pt as re,q as ie,tt as ae,ut as oe,wt as S,yt as se,z as ce}from"./index-CLF9qDsF.js";import{t as le}from"./ChalkLine-Bj8jzXCo.js";import{n as C}from"./ease-7End8lFK.js";import{t as w}from"./beside-C5LnErlj.js";import{A as ue,C as T,D as E,E as de,F as D,I as fe,M as O,O as k,P as A,R as pe,S as j,V as me,_ as M,a as he,c as ge,d as _e,f as ve,g as ye,i as be,j as N,k as P,t as F,v as I,x as L,y as xe,z as Se}from"./sound-S0QCs3Xs.js";var R=t(e(),1),z=r(),Ce=2.6;function we(){let e=N(),t=(0,R.useRef)(null),n=(0,R.useRef)(null),r=(0,R.useRef)(null),i=(0,R.useRef)(null),o=(0,R.useMemo)(()=>{let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t},[]),s=(0,R.useMemo)(()=>[0,1].map(()=>new ae({color:P.blue,toneMapped:!1})),[]),c=(0,R.useMemo)(()=>new x({color:`#e7e8ec`,roughness:.45}),[]),u=(0,R.useMemo)(()=>new x({color:`#0b0f18`,roughness:.15,metalness:.6}),[]),d=(0,R.useMemo)(()=>new x({color:`#111216`,roughness:.9}),[]);return m(()=>{let a=C(e.ambulance),o=t.current;if(!o)return;if(o.visible=a>.01&&e.kind<.5,!o.visible){n.current&&(n.current.intensity=0);return}let c=O(e);o.position.set(c.at[0],0,xe);let l=c.now*Ce%1,u=l<.5&&l%.25<.14?1:.15,d=l>=.5&&l%.25<.14?1:.15;s[0].color.set(P.blue).multiplyScalar(.4+3.2*u),s[1].color.set(P.blue).multiplyScalar(.4+3.2*d);let f=Math.max(u,d);n.current&&(n.current.intensity=26*f*a),r.current&&(r.current.opacity=.32*f*a),i.current&&(i.current.opacity=.5*a)}),(0,z.jsxs)(`group`,{ref:t,visible:!1,children:[(0,z.jsx)(a,{args:[3.7,2.35,2.2],radius:.12,position:[-.85,1.73,0],material:c}),(0,z.jsx)(a,{args:[1.9,1.65,2.1],radius:.14,position:[1.95,1.38,0],material:c}),(0,z.jsxs)(`mesh`,{position:[.1,1.25,0],children:[(0,z.jsx)(`boxGeometry`,{args:[5.62,.26,2.24]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#d23a31`,roughness:.5})]}),(0,z.jsxs)(`mesh`,{position:[.1,1.54,0],children:[(0,z.jsx)(`boxGeometry`,{args:[5.62,.08,2.24]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#2c5bd8`,roughness:.5})]}),(0,z.jsx)(`mesh`,{position:[2.91,1.72,0],material:u,children:(0,z.jsx)(`boxGeometry`,{args:[.04,.62,1.86]})}),[1,-1].map(e=>(0,z.jsx)(`mesh`,{position:[2.05,1.76,e*1.06],material:u,children:(0,z.jsx)(`boxGeometry`,{args:[1.1,.5,.02]})},e)),[1,-1].map((e,t)=>(0,z.jsx)(`mesh`,{position:[1.9,2.29,e*.45],material:s[t],children:(0,z.jsx)(`boxGeometry`,{args:[.42,.16,.78]})},e)),[1,-1].map((e,t)=>(0,z.jsx)(`mesh`,{position:[-2.55,2.96,e*.92],material:s[t],children:(0,z.jsx)(`boxGeometry`,{args:[.18,.12,.18]})},e)),[1,-1].map(e=>(0,z.jsxs)(`mesh`,{position:[2.92,.92,e*.76],children:[(0,z.jsx)(`boxGeometry`,{args:[.04,.2,.34]}),(0,z.jsx)(`meshBasicMaterial`,{color:`#fff6e0`,toneMapped:!1})]},e)),[1,-1].map(e=>(0,z.jsxs)(`mesh`,{position:[-2.72,1,e*.9],children:[(0,z.jsx)(`boxGeometry`,{args:[.04,.3,.2]}),(0,z.jsx)(`meshBasicMaterial`,{color:`#ff3020`,toneMapped:!1})]},e)),[[1.95,1],[1.95,-1],[-1.75,1],[-1.75,-1]].map(([e,t])=>(0,z.jsx)(`mesh`,{position:[e,.42,t*.98],"rotation-x":Math.PI/2,material:d,children:(0,z.jsx)(`cylinderGeometry`,{args:[.42,.42,.3,18]})},`${e}${t}`)),(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[8.5,.03,0],scale:[12,3.4,1],renderOrder:3,children:[(0,z.jsx)(`planeGeometry`,{}),(0,z.jsx)(`meshBasicMaterial`,{ref:i,color:`#fff1d0`,alphaMap:o,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[0,.2,0],scale:[16,16,1],renderOrder:3,children:[(0,z.jsx)(`planeGeometry`,{}),(0,z.jsx)(`meshBasicMaterial`,{ref:r,color:P.blue,alphaMap:o,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,z.jsx)(`pointLight`,{ref:n,position:[1.9,3.1,0],color:P.blue,intensity:0,distance:22,decay:2})]})}var B=6e3,Te=19,V={w:18,h:1.4,gap:2},Ee=600,De=40,Oe=new h(...ye).sub(new h(...de)).normalize(),ke=`
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
`;function Ae(){return new b({transparent:!0,depthWrite:!1,uniforms:{uLines:{value:A.map(e=>e.nm)},uShift:{value:1},uOpacity:{value:0},uRange:{value:new S(...D)}},vertexShader:`
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
      ${ke}
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
    `})}function je(){let e=4242,t=()=>(e=e*16807%2147483647,(e-1)/2147483646),n=new Float32Array(B*3),r=new Float32Array(B*3),i=new u(`#ffe6b8`),a=new u(`#a9c4ff`),o=new u(`#ff9fc8`),s=new u;for(let e=0;e<B;e++){let c=t()**1.6*Te,l=2*Math.PI*(e%2)+c*.36+(t()-.5)*(.5+2.4/(c+1))+e%2*Math.PI,u=(t()-.5)*(.7+c*.16);n[e*3]=Math.cos(l)*c+u,n[e*3+1]=(t()-.5)*(1.4*Math.exp(-c/3)+.3),n[e*3+2]=Math.sin(l)*c+u,s.copy(i).lerp(a,C(c/(Te*.55))),t()<.04&&c>4&&s.copy(o),r.set([s.r,s.g,s.b],e*3)}let c=new te;return c.setAttribute(`position`,new d(n,3)),c.setAttribute(`color`,new d(r,3)),c}function Me(){return new b({transparent:!0,depthWrite:!1,blending:2,vertexColors:!0,uniforms:{uOpacity:{value:0},uRed:{value:0}},vertexShader:`
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
    `})}function Ne(){let e=N(),t=(0,R.useRef)(null),n=(0,R.useRef)(null),r=(0,R.useMemo)(()=>je(),[]),a=(0,R.useMemo)(()=>Me(),[]),o=(0,R.useMemo)(()=>Ae(),[]),s=(0,R.useMemo)(()=>Ae(),[]),c=(0,R.useMemo)(()=>A.map(()=>({current:null})),[]),l=(0,R.useRef)([]),u=(0,R.useRef)([]),d=(0,R.useRef)(``);return m((r,i)=>{let f=C(e.galaxy),p=C(e.spectra);if(t.current&&(t.current.visible=f+p>.001),f+p<=.001){for(let e of u.current)e&&e.style.opacity!==`0`&&(e.style.opacity=`0`);return}let m=e.z,h=r.size.width<Ee;n.current&&(n.current.rotation.y+=Math.min(i,.1)*.05,n.current.position.set(...ye).addScaledVector(Oe,De*m/.1)),a.uniforms.uOpacity.value=f,a.uniforms.uRed.value=C(m*4),o.uniforms.uOpacity.value=p,s.uniforms.uOpacity.value=p,s.uniforms.uShift.value=1+m;let g=e=>E[0]+((e-D[0])/(D[1]-D[0])-.5)*V.w,_=E[1]+V.gap/2,v=E[1]-V.gap/2;A.forEach((e,t)=>{c[t].current?.set([[g(e.nm),_-V.h/2,E[2]+.01],[Math.min(g(e.nm*(1+m)),g(D[1])),v+V.h/2,E[2]+.01]],1,.6*p),l.current[t]?.position.set(g(e.nm),_+V.h/2,E[2]);let n=u.current[t];n&&(n.style.opacity=String(h&&t>=2?0:p),w(n,0,1,8))});let y=[[4,[g(D[0])+.2,_,E[2]+.02]],[5,[g(D[0])+.2,v,E[2]+.02]],[6,[h?E[0]:g(D[1]),v-V.h/2,E[2]]]];for(let[e,t]of y){l.current[e]?.position.set(...t);let n=u.current[e];n&&(n.style.opacity=String(p),w(n,e===6?h?0:-1:1,e===6?-1:0,e===6?6:2))}let b=Se(m)*100,x=`z = ${m.toFixed(2)} · receding at ${b.toFixed(1)}% of light speed`;d.current!==x&&u.current[6]&&(d.current=x,u.current[6].textContent=x)}),(0,z.jsxs)(`group`,{ref:t,visible:!1,children:[(0,z.jsx)(`points`,{ref:n,geometry:r,material:a,"rotation-x":.5,frustumCulled:!1}),(0,z.jsx)(`mesh`,{position:[E[0],E[1]+V.gap/2,E[2]],material:o,children:(0,z.jsx)(`planeGeometry`,{args:[V.w,V.h]})}),(0,z.jsx)(`mesh`,{position:[E[0],E[1]-V.gap/2,E[2]],material:s,children:(0,z.jsx)(`planeGeometry`,{args:[V.w,V.h]})}),c.map((e,t)=>(0,z.jsx)(le,{handle:e,color:P.chalk,width:1.2,renderOrder:6},t)),[...A.map(e=>e.name),`here`,`the galaxy`,``].map((e,t)=>(0,z.jsx)(`group`,{ref:e=>void(l.current[t]=e),children:(0,z.jsx)(i,{ref:e=>void(u.current[t]=e),className:`math-label math-label--small`,color:t===5?P.red:P.chalk,children:e})},t))]})}var H=n(`doppler`),Pe=new v(new h(0,1,0),-(H.y+I)),U=new h;function Fe(){let e=N(),t=g(e=>e.set),n=(0,R.useRef)(null),[r,i]=(0,R.useState)(!1),a=(0,R.useRef)(!1);return m(t=>{let i=n.current;if(!i)return;i.visible=e.interactive>.5&&e.you>.5,i.position.set(e.lx,I+.04,e.lz);let o=1+Math.sin(t.clock.elapsedTime*3)*.06;i.scale.setScalar((r||a.current?1.25:1)*o)}),(0,z.jsxs)(`group`,{ref:n,visible:!1,onPointerOver:t=>{e.interactive<.5||(t.stopPropagation(),i(!0),document.body.style.cursor=`grab`)},onPointerOut:()=>{i(!1),a.current||(document.body.style.cursor=``)},onPointerDown:n=>{e.interactive<.5||(n.stopPropagation(),n.target.setPointerCapture?.(n.pointerId),a.current=!0,document.body.style.cursor=`grabbing`,t({dragging:!0}))},onPointerMove:e=>{a.current&&(e.stopPropagation(),e.ray.intersectPlane(Pe,U)&&ge(U.x-H.x,U.z-H.z))},onPointerUp:e=>{e.target.releasePointerCapture?.(e.pointerId),a.current=!1,document.body.style.cursor=r?`grab`:``,t({dragging:!1})},children:[(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,renderOrder:20,children:[(0,z.jsx)(`ringGeometry`,{args:[.62,.74,40]}),(0,z.jsx)(`meshBasicMaterial`,{color:P.ear,transparent:!0,opacity:.9,toneMapped:!1,depthTest:!1})]}),(0,z.jsxs)(`mesh`,{position:[0,.9,0],children:[(0,z.jsx)(`cylinderGeometry`,{args:[1.1,1.1,1.9,16]}),(0,z.jsx)(`meshBasicMaterial`,{transparent:!0,opacity:0,depthWrite:!1})]})]})}var W=1.5;function Ie(){let e=[[0,0],[.14,-.35],[.3,-.9],[.42,-1.7],[.46,-3],[.46,-5.6],[.38,-6.7],[.3,-7]].map(([e,t])=>new S(e,t)),t=new ie(e,24);return t.rotateZ(-Math.PI/2),t}function Le(e,t){let n=new y(e.map(([e,t])=>new S(e,t))),r=new ce(n,{depth:t,bevelEnabled:!1});return r.translate(0,0,-t/2),r}function Re(){let e=new f(1,1,48,1,!0);return e.translate(0,-.5,0),e.rotateZ(-Math.PI/2),e}function ze(e,t){return new b({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new u(e)},uOpacity:{value:0},uTime:{value:0}},vertexShader:`
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
    `})}function Be(){let e=N(),t=(0,R.useRef)(null),n=(0,R.useRef)(null),r=(0,R.useRef)(null),i=(0,R.useRef)(null),a=(0,R.useRef)(null),o=(0,R.useMemo)(()=>({body:Ie(),wings:Le([[-2.3,0],[-5.4,3.3],[-6.1,3.3],[-5.9,0],[-6.1,-3.3],[-5.4,-3.3]],.08),fin:Le([[-4.9,.3],[-6.55,2.15],[-6.95,2.15],[-6.9,.3]],.07),cone:Re()}),[]),s=(0,R.useMemo)(()=>ze(`#cfe0ff`,!1),[]),c=(0,R.useMemo)(()=>ze(`#ffffff`,!0),[]),l=(0,R.useMemo)(()=>new x({color:`#8a93a3`,roughness:.38,metalness:.55}),[]);return m(o=>{let l=C(e.jet),u=t.current;if(!u||(u.visible=l>.01&&e.kind>.5,!u.visible))return;let d=O(e);u.position.set(...d.at),s.uniforms.uTime.value=o.clock.elapsedTime,c.uniforms.uTime.value=o.clock.elapsedTime;let f=pe(d.m);if(n.current&&(n.current.visible=f!==null&&e.cone>.01,f!==null)){let t=Math.max(d.now-L,e.from),r=Math.ceil(t/T)*T,i=d.at[0]-d.path(Math.min(r,d.now)),a=Math.max(i*Math.cos(f)**2,.01);n.current.scale.set(a,a*Math.tan(f),a*Math.tan(f)),s.uniforms.uOpacity.value=.2*C(e.cone)*C((d.m-1)*8)}let p=Math.exp(-(((d.m-1.02)/.09)**2));if(r.current&&(r.current.visible=p>.02,c.uniforms.uOpacity.value=.5*p*l),i.current&&i.current.color.set(`#ffb070`).multiplyScalar(1.2+2.4*C(d.m)),a.current){let e=d.now*1.1%1<.06?4:.2;a.current.color.set(`#ffffff`).multiplyScalar(e)}}),(0,z.jsxs)(`group`,{ref:t,visible:!1,children:[(0,z.jsxs)(`group`,{scale:W,children:[(0,z.jsx)(`mesh`,{geometry:o.body,material:l}),(0,z.jsx)(`mesh`,{geometry:o.wings,material:l,"rotation-x":Math.PI/2}),(0,z.jsx)(`mesh`,{geometry:o.fin,material:l}),(0,z.jsxs)(`mesh`,{position:[-1.7,.3,0],scale:[.95,.3,.3],children:[(0,z.jsx)(`sphereGeometry`,{args:[1,18,12]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#0c1424`,roughness:.1,metalness:.7})]}),(0,z.jsxs)(`mesh`,{position:[-7.02,0,0],"rotation-z":Math.PI/2,children:[(0,z.jsx)(`circleGeometry`,{args:[.28,18]}),(0,z.jsx)(`meshBasicMaterial`,{ref:i,color:`#ffb070`,toneMapped:!1,side:2})]}),(0,z.jsxs)(`mesh`,{position:[-5.75,0,-3.3],children:[(0,z.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,z.jsx)(`meshBasicMaterial`,{color:`#ff4030`,toneMapped:!1})]}),(0,z.jsxs)(`mesh`,{position:[-5.75,0,3.3],children:[(0,z.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,z.jsx)(`meshBasicMaterial`,{color:`#40ff70`,toneMapped:!1})]}),(0,z.jsxs)(`mesh`,{position:[-6.8,2.15,0],children:[(0,z.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,z.jsx)(`meshBasicMaterial`,{ref:a,color:`#ffffff`,toneMapped:!1})]})]}),(0,z.jsx)(`mesh`,{ref:n,geometry:o.cone,material:s,visible:!1,renderOrder:12}),(0,z.jsx)(`mesh`,{ref:r,geometry:o.cone,material:c,position:[-1.6*W,0,0],scale:[3.2*W,2.5*W,2.5*W],visible:!1,renderOrder:13}),(0,z.jsx)(`pointLight`,{position:[-7.6,0,0],color:P.sodium,intensity:6,distance:10,decay:2})]})}function Ve(e,t){let n=O(e);return n.now<=e.from?1/0:fe(n.path,n.at[1],n.at[2],n.c,[t[0],t[1]+F,t[2]],e.from,n.now).at}var G=[`ahead`,`behind`,`under`,`you`],K={ahead:P.blue,behind:P.red,under:P.chalk,you:P.ear};function He(){let e=N(),t=(0,R.useRef)([]),n=(0,R.useRef)([]),r=(0,R.useRef)([]),a=(0,R.useMemo)(()=>new ee(.2,.8,4,12),[]),o=(0,R.useMemo)(()=>new se(.15,14,10),[]),s=(0,R.useMemo)(()=>{let e=new re(.42,.5,40);return e.rotateX(-Math.PI/2),e},[]),c=(0,R.useMemo)(()=>G.map(e=>new x({color:`#2a2e38`,roughness:.7,emissive:K[e],emissiveIntensity:.18})),[]),l=(0,R.useMemo)(()=>G.map(e=>new ae({color:K[e],transparent:!0,toneMapped:!1})),[]);return m(()=>{let i=C(e.listeners),a=e.kind<.5,o={ahead:_e,behind:ve,under:ue,you:[e.lx,I,e.lz]},s={ahead:a?i:0,behind:a?i:0,under:a?0:i,you:C(e.you)};G.forEach((i,a)=>{let c=t.current[a],u=n.current[a];if(!c||(c.visible=s[i]>.01,c.position.set(...o[i]),l[a].opacity=.8*s[i],!u))return;let d=``;if(c.visible){let t=o[i],n=he(e,[t[0],t[1]+F,t[2]],i===`you`?e.lm:0),r=i===`you`?`you hear`:`hears`;d=n===null?`${r} nothing yet`:`${r} ${n.ratio.toFixed(2)} f`,i===`under`&&n!==null&&O(e).now-Ve(e,t)<1.6&&(d=`boom!`)}r.current[a]!==d&&(r.current[a]=d,u.textContent=d),u.style.opacity=String(i===`you`?s[i]:s[i]*C(e.hears)),i===`under`?w(u,-1,1,2):w(u,0,1,4)})}),(0,z.jsx)(`group`,{children:G.map((e,r)=>(0,z.jsxs)(`group`,{ref:e=>void(t.current[r]=e),visible:!1,children:[(0,z.jsx)(`mesh`,{geometry:a,material:c[r],position:[0,.62,0]}),(0,z.jsx)(`mesh`,{geometry:o,material:c[r],position:[0,1.38,0]}),(0,z.jsx)(`mesh`,{geometry:s,material:l[r],position:[0,.02,0]}),(0,z.jsx)(`group`,{position:[0,1.75,0],children:(0,z.jsx)(i,{ref:e=>void(n.current[r]=e),className:`math-label math-label--small`,color:K[e]})})]},e))})}var Ue=`
  uniform vec3 uBlue;
  uniform vec3 uRed;
  vec3 stretchColor(float m, float cosTheta) {
    float t = clamp((1.0 - m * cosTheta - 1.0) / 0.45, -1.0, 1.0);
    vec3 white = vec3(0.92, 0.94, 1.0);
    return t < 0.0 ? mix(white, uBlue, -t) : mix(white, uRed, t);
  }
`,q=()=>({uBlue:{value:new u(P.blue).multiplyScalar(1.3)},uRed:{value:new u(P.red).multiplyScalar(1.2)}});function We(){return new b({transparent:!0,depthWrite:!1,side:0,blending:2,uniforms:{...q(),uOpacity:{value:0}},vertexShader:`
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
      ${Ue}
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vView)));
        float a = (0.03 + 0.97 * pow(rim, 4.0)) * vInfo.x * uOpacity;
        gl_FragColor = vec4(stretchColor(vInfo.y, normalize(vLocal).x) * a * 0.2, 1.0);
      }
    `})}function Ge(){return new b({transparent:!0,depthWrite:!1,blending:2,uniforms:{...q(),uShells:{value:Array.from({length:40},()=>new s)},uCount:{value:0},uSource:{value:new S},uOpacity:{value:0}},vertexShader:`
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
      ${Ue}
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
    `})}function Ke(){let e=N(),t=(0,R.useRef)(null),n=(0,R.useMemo)(()=>We(),[]),r=(0,R.useMemo)(()=>Ge(),[]),i=(0,R.useMemo)(()=>new c(new Float32Array(80),2),[]),a=(0,R.useMemo)(()=>{let e=new se(1,40,24);return e.setAttribute(`aInfo`,i),e},[i]),s=(0,R.useMemo)(()=>{let e=new ne(240,90,1,1);return e.rotateX(-Math.PI/2),e.translate(0,I+.035,0),e},[]),l=(0,R.useMemo)(()=>new o,[]);return m(()=>{let a=C(e.spheres),o=C(e.rings),s=t.current;if(!s)return;if(a+o<.001){s.count=0,r.uniforms.uCount.value=0;return}let c=O(e),u=me(c.path,c.c,c.now,T,e.from,L).slice(0,40),d=r.uniforms.uShells.value;u.forEach((e,t)=>{let n=c.now-e.sent,r=C(e.r/.6)*C((L-n)/1.2),a=c.machAt(e.sent);l.makeScale(Math.max(e.r,.001),Math.max(e.r,.001),Math.max(e.r,.001)).setPosition(e.x,c.at[1],c.at[2]),s.setMatrixAt(t,l),i.setXY(t,r,a),d[t].set(e.x,e.r,r,a)}),s.count=u.length,s.instanceMatrix.needsUpdate=!0,i.needsUpdate=!0,n.uniforms.uOpacity.value=a,r.uniforms.uCount.value=u.length,r.uniforms.uSource.value.set(c.at[1]-I,c.at[2]),r.uniforms.uOpacity.value=o}),(0,z.jsxs)(`group`,{children:[(0,z.jsx)(`instancedMesh`,{ref:t,args:[a,n,40],frustumCulled:!1,renderOrder:11}),(0,z.jsx)(`mesh`,{geometry:s,material:r,frustumCulled:!1,renderOrder:10})]})}var J=k[1]-k[0],Y=(k[0]+k[1])/2,X=[k[0]-130,k[1]+5],qe=(X[0]+X[1])/2,Je=32,Z=7.2,Q=1.9;function Ye(e){let t=e;return()=>(t=t*16807%2147483647,(t-1)/2147483646)}function Xe(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i*(3-2*i)),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t}function Ze(){let e=Ye(9),t=[];for(let n of[-1,1]){let r=k[0];for(;r<k[1];){let i=9+e()*14,a=e()<.25?3+e()*4:.4,o=r+i/2,s=n>0;if(!s||Math.abs(o)>40){let r=10+e()*8,a=s?9:j+1;t.push({x:o,z:n*(a+r/2),w:i,d:r,h:8+e()*(s?14:24)})}r+=i+a}}return t}function Qe(){let e=new x({color:`#16171d`,roughness:.92,metalness:0}),t={uLit:{value:0}};return e.userData.uniforms=t,e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
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
        }`)},e}function $e(){let e=N(),t=(0,R.useMemo)(()=>Xe(),[]),n=(0,R.useMemo)(()=>{let e=[];for(let t=k[0]+22;t<k[1]-4;t+=Je)e.push({x:t,side:1}),e.push({x:t+Je/2,side:-1});return e},[]),r=(0,R.useMemo)(()=>{let e=[];for(let t=k[0];t<k[1];t+=9)e.push(t+1.5);return e},[]),i=(0,R.useMemo)(()=>Ze(),[]),a=(0,R.useMemo)(()=>Qe(),[]),s=(0,R.useRef)(null),c=(0,R.useRef)(null),l=(0,R.useRef)(null),u=(0,R.useRef)(null),d=(0,R.useRef)(null),f=(0,R.useRef)(null),g=(0,R.useRef)(null),_=(0,R.useRef)(null),v=(0,R.useRef)(null),y=(0,R.useRef)(null);return(0,R.useLayoutEffect)(()=>{let e=new o,t=new oe,a=new oe().setFromEuler(new p(-Math.PI/2,0,0)),m=new h,g=new h;n.forEach(({x:n,side:r},i)=>{let o=r*(M+1.2);s.current?.setMatrixAt(i,e.compose(g.set(n,Z/2,o),t.identity(),m.set(1,1,1))),c.current?.setMatrixAt(i,e.compose(g.set(n,7.15,o-r*Q/2),t.identity(),m.set(1,1,Q))),l.current?.setMatrixAt(i,e.compose(g.set(n,7,o-r*Q),t.identity(),m.set(1,1,1))),u.current?.setMatrixAt(i,e.compose(g.set(n,I+.02,o-r*Q),a,m.set(13,13,1)))});for(let e of[s,c,l,u])e.current&&(e.current.instanceMatrix.needsUpdate=!0);r.forEach((t,n)=>d.current?.setMatrixAt(n,e.compose(g.set(t,.035,0),a,m.set(3,.14,1)))),d.current&&(d.current.instanceMatrix.needsUpdate=!0),i.forEach((n,r)=>f.current?.setMatrixAt(r,e.compose(g.set(n.x,n.h/2,n.z),t.identity(),m.set(n.w,n.h,n.d)))),f.current&&(f.current.instanceMatrix.needsUpdate=!0)},[n,r,i]),m(()=>{let t=C(e.street);y.current&&(y.current.visible=t>.001),g.current&&g.current.color.set(P.sodium).multiplyScalar(.25+2.2*t),_.current&&(_.current.opacity=.42*t),v.current&&(v.current.emissiveIntensity=.08+.1*t),a.userData.uniforms.uLit.value=t}),(0,z.jsxs)(`group`,{ref:y,visible:!1,children:[(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[qe,0,0],receiveShadow:!0,children:[(0,z.jsx)(`planeGeometry`,{args:[X[1]-X[0],420]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#0d0e12`,roughness:1})]}),(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Y,.02,0],children:[(0,z.jsx)(`planeGeometry`,{args:[J,M*2]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#1b1c22`,roughness:.82})]}),[1,-1].map(e=>(0,z.jsxs)(`group`,{children:[(0,z.jsxs)(`mesh`,{position:[Y,I/2,e*((M+j)/2)],children:[(0,z.jsx)(`boxGeometry`,{args:[J,I,j-M]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#2a2b31`,roughness:.95})]}),(0,z.jsxs)(`mesh`,{position:[Y,I/2+.005,e*(M+.12)],children:[(0,z.jsx)(`boxGeometry`,{args:[J,I+.01,.24]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#4a4b52`,roughness:.9})]}),(0,z.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Y,.035,e*(M-.35)],children:[(0,z.jsx)(`planeGeometry`,{args:[J,.12]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#cfc8b4`,roughness:.7,emissive:`#cfc8b4`,emissiveIntensity:.1})]})]},e)),(0,z.jsxs)(`instancedMesh`,{ref:d,args:[void 0,void 0,r.length],frustumCulled:!1,children:[(0,z.jsx)(`planeGeometry`,{}),(0,z.jsx)(`meshStandardMaterial`,{ref:v,color:`#d8d1bd`,roughness:.7,emissive:`#d8d1bd`,emissiveIntensity:.1})]}),(0,z.jsxs)(`instancedMesh`,{ref:s,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,z.jsx)(`cylinderGeometry`,{args:[.09,.13,Z,8]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,z.jsxs)(`instancedMesh`,{ref:c,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,z.jsx)(`boxGeometry`,{args:[.1,.1,1]}),(0,z.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,z.jsxs)(`instancedMesh`,{ref:l,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,z.jsx)(`boxGeometry`,{args:[.7,.16,.36]}),(0,z.jsx)(`meshBasicMaterial`,{ref:g,color:P.sodium,toneMapped:!1})]}),(0,z.jsxs)(`instancedMesh`,{ref:u,args:[void 0,void 0,n.length],frustumCulled:!1,renderOrder:2,children:[(0,z.jsx)(`planeGeometry`,{}),(0,z.jsx)(`meshBasicMaterial`,{ref:_,color:P.sodium,alphaMap:t,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,z.jsx)(`instancedMesh`,{ref:f,args:[void 0,a,i.length],frustumCulled:!1,castShadow:!1,children:(0,z.jsx)(`boxGeometry`,{})})]})}var $=n(`doppler`),et=[[-12,7,-M+.7],[4,7,M-.7],[20,7,-M+.7]];function tt(){let e=N(),t=(0,R.useRef)([]),n=(0,R.useRef)(!0);return m((r,i)=>{let a=C(e.street);for(let e of t.current)e&&(e.intensity=60*a);if(e.mode>1.5&&(e.interactive>.5||e.lab>.5)){let t=Math.min(i,.1);e.sandT+=t,e.lm!==0&&(e.lx=((e.lx+e.lm*3*t+26)%52+52)%52-26);let r=be(e)!==null;r&&!n.current&&e.kind>.5&&e.you>.5&&_.cue(`boom`,{gain:.8}),n.current=r}}),(0,z.jsxs)(`group`,{position:[$.x,$.y,$.z],children:[(0,z.jsx)($e,{}),et.map((e,n)=>(0,z.jsx)(`pointLight`,{ref:e=>void(t.current[n]=e),position:e,color:P.sodium,intensity:0,distance:34,decay:2},n)),(0,z.jsx)(we,{}),(0,z.jsx)(Be,{}),(0,z.jsx)(Ke,{}),(0,z.jsx)(He,{}),(0,z.jsx)(Ne,{}),(0,z.jsx)(Fe,{})]})}export{tt as default};