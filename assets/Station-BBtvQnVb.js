import{n as e,o as t,r as n}from"./vanilla-DVR5IbfM.js";import{t as r}from"./MathLabel-J6kNIlVm.js";import{$ as i,A as a,C as o,Ct as s,H as c,I as l,M as u,N as d,P as f,R as p,S as m,Tt as h,c as g,ct as _,f as v,gt as y,ht as b,it as x,k as S,lt as ee,pt as te,q as ne,tt as re,ut as ie,wt as C,x as ae,yt as oe,z as se}from"./index-CJxrKEVF.js";import{t as ce}from"./ChalkLine-B6Ch3BwX.js";import{n as w}from"./ease-7End8lFK.js";import{t as T}from"./beside-C5LnErlj.js";import{A as le,C as E,D,E as ue,F as O,I as de,M as k,O as A,P as j,R as fe,S as M,V as pe,_ as N,a as me,c as he,d as ge,f as _e,g as P,i as ve,j as F,k as I,t as L,v as R,x as z,y as ye,z as be}from"./sound-CHz5NCG1.js";function xe(e,t=Math.PI/3){let n=Math.cos(t),r=(1+1e-10)*100,i=[new C,new C,new C],a=new C,o=new C,s=new C,c=new C;function l(e){return`${~~(e.x*r)},${~~(e.y*r)},${~~(e.z*r)}`}let u=e.index?e.toNonIndexed():e,d=u.attributes.position,f={};for(let e=0,t=d.count/3;e<t;e++){let t=3*e,n=i[0].fromBufferAttribute(d,t+0),r=i[1].fromBufferAttribute(d,t+1),s=i[2].fromBufferAttribute(d,t+2);a.subVectors(s,r),o.subVectors(n,r);let c=new C().crossVectors(a,o).normalize();for(let e=0;e<3;e++){let t=i[e],n=l(t);n in f||(f[n]=[]),f[n].push(c)}}let p=new Float32Array(d.count*3),m=new S(p,3,!1);for(let e=0,t=d.count/3;e<t;e++){let t=3*e,r=i[0].fromBufferAttribute(d,t+0),u=i[1].fromBufferAttribute(d,t+1),p=i[2].fromBufferAttribute(d,t+2);a.subVectors(p,u),o.subVectors(r,u),s.crossVectors(a,o).normalize();for(let e=0;e<3;e++){let r=i[e],a=f[l(r)];c.set(0,0,0);for(let e=0,t=a.length;e<t;e++){let t=a[e];s.dot(t)>n&&c.add(t)}c.normalize(),m.setXYZ(t+e,c.x,c.y,c.z)}}return u.setAttribute(`normal`,m),u}var B=t(n()),V=1e-5;function Se(e,t,n){let r=new y,i=n-V;return r.absarc(V,V,V,-Math.PI/2,-Math.PI,!0),r.absarc(V,t-i*2,V,Math.PI,Math.PI/2,!0),r.absarc(e-i*2,t-i*2,V,Math.PI/2,0,!0),r.absarc(e-i*2,V,V,0,-Math.PI/2,!0),r}var Ce=B.forwardRef(function({args:[e=1,t=1,n=1]=[],radius:r=.05,steps:i=1,smoothness:a=4,bevelSegments:o=4,creaseAngle:s=.4,children:c,...l},u){return B.createElement(`mesh`,m({ref:u},l),B.createElement(we,{args:[e,t,n],radius:r,steps:i,smoothness:a,bevelSegments:o,creaseAngle:s}),c)}),we=B.forwardRef(function({args:[e=1,t=1,n=1]=[],radius:r=.05,steps:i=1,smoothness:a=4,bevelSegments:o=4,creaseAngle:s=.4,...c},l){let u=B.useMemo(()=>Se(e,t,r),[e,t,r]),d=B.useMemo(()=>({depth:n-r*2,bevelEnabled:!0,bevelSegments:o*2,steps:i,bevelSize:r-V,bevelThickness:r,curveSegments:a}),[n,r,a,o,i]),f=B.useRef(null);return B.useLayoutEffect(()=>{f.current&&(f.current.center(),xe(f.current,s))},[u,d,s]),B.useImperativeHandle(l,()=>f.current),B.createElement(`extrudeGeometry`,m({ref:f,args:[u,d]},c))}),H=e(),Te=2.6;function Ee(){let e=F(),t=(0,B.useRef)(null),n=(0,B.useRef)(null),r=(0,B.useRef)(null),i=(0,B.useRef)(null),a=(0,B.useMemo)(()=>{let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t},[]),s=(0,B.useMemo)(()=>[0,1].map(()=>new re({color:I.blue,toneMapped:!1})),[]),c=(0,B.useMemo)(()=>new x({color:`#e7e8ec`,roughness:.45}),[]),u=(0,B.useMemo)(()=>new x({color:`#0b0f18`,roughness:.15,metalness:.6}),[]),d=(0,B.useMemo)(()=>new x({color:`#111216`,roughness:.9}),[]);return o(()=>{let a=w(e.ambulance),o=t.current;if(!o)return;if(o.visible=a>.01&&e.kind<.5,!o.visible){n.current&&(n.current.intensity=0);return}let c=k(e);o.position.set(c.at[0],0,ye);let l=c.now*Te%1,u=l<.5&&l%.25<.14?1:.15,d=l>=.5&&l%.25<.14?1:.15;s[0].color.set(I.blue).multiplyScalar(.4+3.2*u),s[1].color.set(I.blue).multiplyScalar(.4+3.2*d);let f=Math.max(u,d);n.current&&(n.current.intensity=26*f*a),r.current&&(r.current.opacity=.32*f*a),i.current&&(i.current.opacity=.5*a)}),(0,H.jsxs)(`group`,{ref:t,visible:!1,children:[(0,H.jsx)(Ce,{args:[3.7,2.35,2.2],radius:.12,position:[-.85,1.73,0],material:c}),(0,H.jsx)(Ce,{args:[1.9,1.65,2.1],radius:.14,position:[1.95,1.38,0],material:c}),(0,H.jsxs)(`mesh`,{position:[.1,1.25,0],children:[(0,H.jsx)(`boxGeometry`,{args:[5.62,.26,2.24]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#d23a31`,roughness:.5})]}),(0,H.jsxs)(`mesh`,{position:[.1,1.54,0],children:[(0,H.jsx)(`boxGeometry`,{args:[5.62,.08,2.24]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#2c5bd8`,roughness:.5})]}),(0,H.jsx)(`mesh`,{position:[2.91,1.72,0],material:u,children:(0,H.jsx)(`boxGeometry`,{args:[.04,.62,1.86]})}),[1,-1].map(e=>(0,H.jsx)(`mesh`,{position:[2.05,1.76,e*1.06],material:u,children:(0,H.jsx)(`boxGeometry`,{args:[1.1,.5,.02]})},e)),[1,-1].map((e,t)=>(0,H.jsx)(`mesh`,{position:[1.9,2.29,e*.45],material:s[t],children:(0,H.jsx)(`boxGeometry`,{args:[.42,.16,.78]})},e)),[1,-1].map((e,t)=>(0,H.jsx)(`mesh`,{position:[-2.55,2.96,e*.92],material:s[t],children:(0,H.jsx)(`boxGeometry`,{args:[.18,.12,.18]})},e)),[1,-1].map(e=>(0,H.jsxs)(`mesh`,{position:[2.92,.92,e*.76],children:[(0,H.jsx)(`boxGeometry`,{args:[.04,.2,.34]}),(0,H.jsx)(`meshBasicMaterial`,{color:`#fff6e0`,toneMapped:!1})]},e)),[1,-1].map(e=>(0,H.jsxs)(`mesh`,{position:[-2.72,1,e*.9],children:[(0,H.jsx)(`boxGeometry`,{args:[.04,.3,.2]}),(0,H.jsx)(`meshBasicMaterial`,{color:`#ff3020`,toneMapped:!1})]},e)),[[1.95,1],[1.95,-1],[-1.75,1],[-1.75,-1]].map(([e,t])=>(0,H.jsx)(`mesh`,{position:[e,.42,t*.98],"rotation-x":Math.PI/2,material:d,children:(0,H.jsx)(`cylinderGeometry`,{args:[.42,.42,.3,18]})},`${e}${t}`)),(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[8.5,.03,0],scale:[12,3.4,1],renderOrder:3,children:[(0,H.jsx)(`planeGeometry`,{}),(0,H.jsx)(`meshBasicMaterial`,{ref:i,color:`#fff1d0`,alphaMap:a,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[0,.2,0],scale:[16,16,1],renderOrder:3,children:[(0,H.jsx)(`planeGeometry`,{}),(0,H.jsx)(`meshBasicMaterial`,{ref:r,color:I.blue,alphaMap:a,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,H.jsx)(`pointLight`,{ref:n,position:[1.9,3.1,0],color:I.blue,intensity:0,distance:22,decay:2})]})}var U=6e3,De=19,W={w:18,h:1.4,gap:2},Oe=600,ke=40,Ae=new C(...P).sub(new C(...ue)).normalize(),je=`
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
`;function Me(){return new b({transparent:!0,depthWrite:!1,uniforms:{uLines:{value:j.map(e=>e.nm)},uShift:{value:1},uOpacity:{value:0},uRange:{value:new s(...O)}},vertexShader:`
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
      ${je}
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
    `})}function Ne(){let e=4242,t=()=>(e=e*16807%2147483647,(e-1)/2147483646),n=new Float32Array(U*3),r=new Float32Array(U*3),i=new d(`#ffe6b8`),o=new d(`#a9c4ff`),s=new d(`#ff9fc8`),c=new d;for(let e=0;e<U;e++){let a=t()**1.6*De,l=2*Math.PI*(e%2)+a*.36+(t()-.5)*(.5+2.4/(a+1))+e%2*Math.PI,u=(t()-.5)*(.7+a*.16);n[e*3]=Math.cos(l)*a+u,n[e*3+1]=(t()-.5)*(1.4*Math.exp(-a/3)+.3),n[e*3+2]=Math.sin(l)*a+u,c.copy(i).lerp(o,w(a/(De*.55))),t()<.04&&a>4&&c.copy(s),r.set([c.r,c.g,c.b],e*3)}let l=new a;return l.setAttribute(`position`,new S(n,3)),l.setAttribute(`color`,new S(r,3)),l}function Pe(){return new b({transparent:!0,depthWrite:!1,blending:2,vertexColors:!0,uniforms:{uOpacity:{value:0},uRed:{value:0}},vertexShader:`
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
    `})}function Fe(){let e=F(),t=(0,B.useRef)(null),n=(0,B.useRef)(null),i=(0,B.useMemo)(()=>Ne(),[]),a=(0,B.useMemo)(()=>Pe(),[]),s=(0,B.useMemo)(()=>Me(),[]),c=(0,B.useMemo)(()=>Me(),[]),l=(0,B.useMemo)(()=>j.map(()=>({current:null})),[]),u=(0,B.useRef)([]),d=(0,B.useRef)([]),f=(0,B.useRef)(``);return o((r,i)=>{let o=w(e.galaxy),p=w(e.spectra);if(t.current&&(t.current.visible=o+p>.001),o+p<=.001){for(let e of d.current)e&&e.style.opacity!==`0`&&(e.style.opacity=`0`);return}let m=e.z,h=r.size.width<Oe;n.current&&(n.current.rotation.y+=Math.min(i,.1)*.05,n.current.position.set(...P).addScaledVector(Ae,ke*m/.1)),a.uniforms.uOpacity.value=o,a.uniforms.uRed.value=w(m*4),s.uniforms.uOpacity.value=p,c.uniforms.uOpacity.value=p,c.uniforms.uShift.value=1+m;let g=e=>D[0]+((e-O[0])/(O[1]-O[0])-.5)*W.w,_=D[1]+W.gap/2,v=D[1]-W.gap/2;j.forEach((e,t)=>{l[t].current?.set([[g(e.nm),_-W.h/2,D[2]+.01],[Math.min(g(e.nm*(1+m)),g(O[1])),v+W.h/2,D[2]+.01]],1,.6*p),u.current[t]?.position.set(g(e.nm),_+W.h/2,D[2]);let n=d.current[t];n&&(n.style.opacity=String(h&&t>=2?0:p),T(n,0,1,8))});let y=[[4,[g(O[0])+.2,_,D[2]+.02]],[5,[g(O[0])+.2,v,D[2]+.02]],[6,[h?D[0]:g(O[1]),v-W.h/2,D[2]]]];for(let[e,t]of y){u.current[e]?.position.set(...t);let n=d.current[e];n&&(n.style.opacity=String(p),T(n,e===6?h?0:-1:1,e===6?-1:0,e===6?6:2))}let b=be(m)*100,x=`z = ${m.toFixed(2)} · receding at ${b.toFixed(1)}% of light speed`;f.current!==x&&d.current[6]&&(f.current=x,d.current[6].textContent=x)}),(0,H.jsxs)(`group`,{ref:t,visible:!1,children:[(0,H.jsx)(`points`,{ref:n,geometry:i,material:a,"rotation-x":.5,frustumCulled:!1}),(0,H.jsx)(`mesh`,{position:[D[0],D[1]+W.gap/2,D[2]],material:s,children:(0,H.jsx)(`planeGeometry`,{args:[W.w,W.h]})}),(0,H.jsx)(`mesh`,{position:[D[0],D[1]-W.gap/2,D[2]],material:c,children:(0,H.jsx)(`planeGeometry`,{args:[W.w,W.h]})}),l.map((e,t)=>(0,H.jsx)(ce,{handle:e,color:I.chalk,width:1.2,renderOrder:6},t)),[...j.map(e=>e.name),`here`,`the galaxy`,``].map((e,t)=>(0,H.jsx)(`group`,{ref:e=>void(u.current[t]=e),children:(0,H.jsx)(r,{ref:e=>void(d.current[t]=e),className:`math-label math-label--small`,color:t===5?I.red:I.chalk,children:e})},t))]})}var G=v(`doppler`),Ie=new _(new C(0,1,0),-(G.y+R)),K=new C;function Le(){let e=F(),t=ae(e=>e.set),n=(0,B.useRef)(null),[r,i]=(0,B.useState)(!1),a=(0,B.useRef)(!1);return o(t=>{let i=n.current;if(!i)return;i.visible=e.interactive>.5&&e.you>.5,i.position.set(e.lx,R+.04,e.lz);let o=1+Math.sin(t.clock.elapsedTime*3)*.06;i.scale.setScalar((r||a.current?1.25:1)*o)}),(0,H.jsxs)(`group`,{ref:n,visible:!1,onPointerOver:t=>{e.interactive<.5||(t.stopPropagation(),i(!0),document.body.style.cursor=`grab`)},onPointerOut:()=>{i(!1),a.current||(document.body.style.cursor=``)},onPointerDown:n=>{e.interactive<.5||(n.stopPropagation(),n.target.setPointerCapture?.(n.pointerId),a.current=!0,document.body.style.cursor=`grabbing`,t({dragging:!0}))},onPointerMove:e=>{a.current&&(e.stopPropagation(),e.ray.intersectPlane(Ie,K)&&he(K.x-G.x,K.z-G.z))},onPointerUp:e=>{e.target.releasePointerCapture?.(e.pointerId),a.current=!1,document.body.style.cursor=r?`grab`:``,t({dragging:!1})},children:[(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,renderOrder:20,children:[(0,H.jsx)(`ringGeometry`,{args:[.62,.74,40]}),(0,H.jsx)(`meshBasicMaterial`,{color:I.ear,transparent:!0,opacity:.9,toneMapped:!1,depthTest:!1})]}),(0,H.jsxs)(`mesh`,{position:[0,.9,0],children:[(0,H.jsx)(`cylinderGeometry`,{args:[1.1,1.1,1.9,16]}),(0,H.jsx)(`meshBasicMaterial`,{transparent:!0,opacity:0,depthWrite:!1})]})]})}var q=1.5;function Re(){let e=[[0,0],[.14,-.35],[.3,-.9],[.42,-1.7],[.46,-3],[.46,-5.6],[.38,-6.7],[.3,-7]].map(([e,t])=>new s(e,t)),t=new ne(e,24);return t.rotateZ(-Math.PI/2),t}function ze(e,t){let n=new y(e.map(([e,t])=>new s(e,t))),r=new se(n,{depth:t,bevelEnabled:!1});return r.translate(0,0,-t/2),r}function Be(){let e=new f(1,1,48,1,!0);return e.translate(0,-.5,0),e.rotateZ(-Math.PI/2),e}function Ve(e,t){return new b({transparent:!0,depthWrite:!1,side:2,blending:2,uniforms:{uColor:{value:new d(e)},uOpacity:{value:0},uTime:{value:0}},vertexShader:`
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
    `})}function He(){let e=F(),t=(0,B.useRef)(null),n=(0,B.useRef)(null),r=(0,B.useRef)(null),i=(0,B.useRef)(null),a=(0,B.useRef)(null),s=(0,B.useMemo)(()=>({body:Re(),wings:ze([[-2.3,0],[-5.4,3.3],[-6.1,3.3],[-5.9,0],[-6.1,-3.3],[-5.4,-3.3]],.08),fin:ze([[-4.9,.3],[-6.55,2.15],[-6.95,2.15],[-6.9,.3]],.07),cone:Be()}),[]),c=(0,B.useMemo)(()=>Ve(`#cfe0ff`,!1),[]),l=(0,B.useMemo)(()=>Ve(`#ffffff`,!0),[]),u=(0,B.useMemo)(()=>new x({color:`#8a93a3`,roughness:.38,metalness:.55}),[]);return o(o=>{let s=w(e.jet),u=t.current;if(!u||(u.visible=s>.01&&e.kind>.5,!u.visible))return;let d=k(e);u.position.set(...d.at),c.uniforms.uTime.value=o.clock.elapsedTime,l.uniforms.uTime.value=o.clock.elapsedTime;let f=fe(d.m);if(n.current&&(n.current.visible=f!==null&&e.cone>.01,f!==null)){let t=Math.max(d.now-z,e.from),r=Math.ceil(t/E)*E,i=d.at[0]-d.path(Math.min(r,d.now)),a=Math.max(i*Math.cos(f)**2,.01);n.current.scale.set(a,a*Math.tan(f),a*Math.tan(f)),c.uniforms.uOpacity.value=.2*w(e.cone)*w((d.m-1)*8)}let p=Math.exp(-(((d.m-1.02)/.09)**2));if(r.current&&(r.current.visible=p>.02,l.uniforms.uOpacity.value=.5*p*s),i.current&&i.current.color.set(`#ffb070`).multiplyScalar(1.2+2.4*w(d.m)),a.current){let e=d.now*1.1%1<.06?4:.2;a.current.color.set(`#ffffff`).multiplyScalar(e)}}),(0,H.jsxs)(`group`,{ref:t,visible:!1,children:[(0,H.jsxs)(`group`,{scale:q,children:[(0,H.jsx)(`mesh`,{geometry:s.body,material:u}),(0,H.jsx)(`mesh`,{geometry:s.wings,material:u,"rotation-x":Math.PI/2}),(0,H.jsx)(`mesh`,{geometry:s.fin,material:u}),(0,H.jsxs)(`mesh`,{position:[-1.7,.3,0],scale:[.95,.3,.3],children:[(0,H.jsx)(`sphereGeometry`,{args:[1,18,12]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#0c1424`,roughness:.1,metalness:.7})]}),(0,H.jsxs)(`mesh`,{position:[-7.02,0,0],"rotation-z":Math.PI/2,children:[(0,H.jsx)(`circleGeometry`,{args:[.28,18]}),(0,H.jsx)(`meshBasicMaterial`,{ref:i,color:`#ffb070`,toneMapped:!1,side:2})]}),(0,H.jsxs)(`mesh`,{position:[-5.75,0,-3.3],children:[(0,H.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,H.jsx)(`meshBasicMaterial`,{color:`#ff4030`,toneMapped:!1})]}),(0,H.jsxs)(`mesh`,{position:[-5.75,0,3.3],children:[(0,H.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,H.jsx)(`meshBasicMaterial`,{color:`#40ff70`,toneMapped:!1})]}),(0,H.jsxs)(`mesh`,{position:[-6.8,2.15,0],children:[(0,H.jsx)(`sphereGeometry`,{args:[.07,8,6]}),(0,H.jsx)(`meshBasicMaterial`,{ref:a,color:`#ffffff`,toneMapped:!1})]})]}),(0,H.jsx)(`mesh`,{ref:n,geometry:s.cone,material:c,visible:!1,renderOrder:12}),(0,H.jsx)(`mesh`,{ref:r,geometry:s.cone,material:l,position:[-1.6*q,0,0],scale:[3.2*q,2.5*q,2.5*q],visible:!1,renderOrder:13}),(0,H.jsx)(`pointLight`,{position:[-7.6,0,0],color:I.sodium,intensity:6,distance:10,decay:2})]})}function Ue(e,t){let n=k(e);return n.now<=e.from?1/0:de(n.path,n.at[1],n.at[2],n.c,[t[0],t[1]+L,t[2]],e.from,n.now).at}var J=[`ahead`,`behind`,`under`,`you`],Y={ahead:I.blue,behind:I.red,under:I.chalk,you:I.ear};function We(){let e=F(),t=(0,B.useRef)([]),n=(0,B.useRef)([]),i=(0,B.useRef)([]),a=(0,B.useMemo)(()=>new u(.2,.8,4,12),[]),s=(0,B.useMemo)(()=>new oe(.15,14,10),[]),c=(0,B.useMemo)(()=>{let e=new te(.42,.5,40);return e.rotateX(-Math.PI/2),e},[]),l=(0,B.useMemo)(()=>J.map(e=>new x({color:`#2a2e38`,roughness:.7,emissive:Y[e],emissiveIntensity:.18})),[]),d=(0,B.useMemo)(()=>J.map(e=>new re({color:Y[e],transparent:!0,toneMapped:!1})),[]);return o(()=>{let r=w(e.listeners),a=e.kind<.5,o={ahead:ge,behind:_e,under:le,you:[e.lx,R,e.lz]},s={ahead:a?r:0,behind:a?r:0,under:a?0:r,you:w(e.you)};J.forEach((r,a)=>{let c=t.current[a],l=n.current[a];if(!c||(c.visible=s[r]>.01,c.position.set(...o[r]),d[a].opacity=.8*s[r],!l))return;let u=``;if(c.visible){let t=o[r],n=me(e,[t[0],t[1]+L,t[2]],r===`you`?e.lm:0),i=r===`you`?`you hear`:`hears`;u=n===null?`${i} nothing yet`:`${i} ${n.ratio.toFixed(2)} f`,r===`under`&&n!==null&&k(e).now-Ue(e,t)<1.6&&(u=`boom!`)}i.current[a]!==u&&(i.current[a]=u,l.textContent=u),l.style.opacity=String(r===`you`?s[r]:s[r]*w(e.hears)),r===`under`?T(l,-1,1,2):T(l,0,1,4)})}),(0,H.jsx)(`group`,{children:J.map((e,i)=>(0,H.jsxs)(`group`,{ref:e=>void(t.current[i]=e),visible:!1,children:[(0,H.jsx)(`mesh`,{geometry:a,material:l[i],position:[0,.62,0]}),(0,H.jsx)(`mesh`,{geometry:s,material:l[i],position:[0,1.38,0]}),(0,H.jsx)(`mesh`,{geometry:c,material:d[i],position:[0,.02,0]}),(0,H.jsx)(`group`,{position:[0,1.75,0],children:(0,H.jsx)(r,{ref:e=>void(n.current[i]=e),className:`math-label math-label--small`,color:Y[e]})})]},e))})}var Ge=`
  uniform vec3 uBlue;
  uniform vec3 uRed;
  vec3 stretchColor(float m, float cosTheta) {
    float t = clamp((1.0 - m * cosTheta - 1.0) / 0.45, -1.0, 1.0);
    vec3 white = vec3(0.92, 0.94, 1.0);
    return t < 0.0 ? mix(white, uBlue, -t) : mix(white, uRed, t);
  }
`,Ke=()=>({uBlue:{value:new d(I.blue).multiplyScalar(1.3)},uRed:{value:new d(I.red).multiplyScalar(1.2)}});function qe(){return new b({transparent:!0,depthWrite:!1,side:0,blending:2,uniforms:{...Ke(),uOpacity:{value:0}},vertexShader:`
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
      ${Ge}
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vView)));
        float a = (0.03 + 0.97 * pow(rim, 4.0)) * vInfo.x * uOpacity;
        gl_FragColor = vec4(stretchColor(vInfo.y, normalize(vLocal).x) * a * 0.2, 1.0);
      }
    `})}function Je(){return new b({transparent:!0,depthWrite:!1,blending:2,uniforms:{...Ke(),uShells:{value:Array.from({length:40},()=>new h)},uCount:{value:0},uSource:{value:new s},uOpacity:{value:0}},vertexShader:`
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
      ${Ge}
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
    `})}function Ye(){let e=F(),t=(0,B.useRef)(null),n=(0,B.useMemo)(()=>qe(),[]),r=(0,B.useMemo)(()=>Je(),[]),a=(0,B.useMemo)(()=>new c(new Float32Array(80),2),[]),s=(0,B.useMemo)(()=>{let e=new oe(1,40,24);return e.setAttribute(`aInfo`,a),e},[a]),l=(0,B.useMemo)(()=>{let e=new ee(240,90,1,1);return e.rotateX(-Math.PI/2),e.translate(0,R+.035,0),e},[]),u=(0,B.useMemo)(()=>new i,[]);return o(()=>{let i=w(e.spheres),o=w(e.rings),s=t.current;if(!s)return;if(i+o<.001){s.count=0,r.uniforms.uCount.value=0;return}let c=k(e),l=pe(c.path,c.c,c.now,E,e.from,z).slice(0,40),d=r.uniforms.uShells.value;l.forEach((e,t)=>{let n=c.now-e.sent,r=w(e.r/.6)*w((z-n)/1.2),i=c.machAt(e.sent);u.makeScale(Math.max(e.r,.001),Math.max(e.r,.001),Math.max(e.r,.001)).setPosition(e.x,c.at[1],c.at[2]),s.setMatrixAt(t,u),a.setXY(t,r,i),d[t].set(e.x,e.r,r,i)}),s.count=l.length,s.instanceMatrix.needsUpdate=!0,a.needsUpdate=!0,n.uniforms.uOpacity.value=i,r.uniforms.uCount.value=l.length,r.uniforms.uSource.value.set(c.at[1]-R,c.at[2]),r.uniforms.uOpacity.value=o}),(0,H.jsxs)(`group`,{children:[(0,H.jsx)(`instancedMesh`,{ref:t,args:[s,n,40],frustumCulled:!1,renderOrder:11}),(0,H.jsx)(`mesh`,{geometry:l,material:r,frustumCulled:!1,renderOrder:10})]})}var X=A[1]-A[0],Z=(A[0]+A[1])/2,Xe=32,Ze=7.2,Q=1.9;function Qe(e){let t=e;return()=>(t=t*16807%2147483647,(t-1)/2147483646)}function $e(){let e=new Uint8Array(16384);for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n-32+.5,t-32+.5)/32,i=Math.max(0,1-r),a=(t*64+n)*4;e[a]=e[a+1]=e[a+2]=Math.round(255*i*i*(3-2*i)),e[a+3]=255}let t=new l(e,64,64);return t.needsUpdate=!0,t}function et(){let e=Qe(9),t=[];for(let n of[-1,1]){let r=A[0];for(;r<A[1];){let i=9+e()*14,a=e()<.25?3+e()*4:.4,o=r+i/2,s=n>0;if(!s||Math.abs(o)>40){let r=10+e()*8,a=s?9:M+1;t.push({x:o,z:n*(a+r/2),w:i,d:r,h:8+e()*(s?14:24)})}r+=i+a}}return t}function tt(){let e=new x({color:`#16171d`,roughness:.92,metalness:0}),t={uLit:{value:0}};return e.userData.uniforms=t,e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
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
        }`)},e}function nt(){let e=F(),t=(0,B.useMemo)(()=>$e(),[]),n=(0,B.useMemo)(()=>{let e=[];for(let t=A[0]+22;t<A[1]-4;t+=Xe)e.push({x:t,side:1}),e.push({x:t+Xe/2,side:-1});return e},[]),r=(0,B.useMemo)(()=>{let e=[];for(let t=A[0];t<A[1];t+=9)e.push(t+1.5);return e},[]),a=(0,B.useMemo)(()=>et(),[]),s=(0,B.useMemo)(()=>tt(),[]),c=(0,B.useRef)(null),l=(0,B.useRef)(null),u=(0,B.useRef)(null),d=(0,B.useRef)(null),f=(0,B.useRef)(null),m=(0,B.useRef)(null),h=(0,B.useRef)(null),g=(0,B.useRef)(null),_=(0,B.useRef)(null),v=(0,B.useRef)(null);return(0,B.useLayoutEffect)(()=>{let e=new i,t=new ie,o=new ie().setFromEuler(new p(-Math.PI/2,0,0)),s=new C,h=new C;n.forEach(({x:n,side:r},i)=>{let a=r*(N+1.2);c.current?.setMatrixAt(i,e.compose(h.set(n,Ze/2,a),t.identity(),s.set(1,1,1))),l.current?.setMatrixAt(i,e.compose(h.set(n,7.15,a-r*Q/2),t.identity(),s.set(1,1,Q))),u.current?.setMatrixAt(i,e.compose(h.set(n,7,a-r*Q),t.identity(),s.set(1,1,1))),d.current?.setMatrixAt(i,e.compose(h.set(n,R+.02,a-r*Q),o,s.set(13,13,1)))});for(let e of[c,l,u,d])e.current&&(e.current.instanceMatrix.needsUpdate=!0);r.forEach((t,n)=>f.current?.setMatrixAt(n,e.compose(h.set(t,.035,0),o,s.set(3,.14,1)))),f.current&&(f.current.instanceMatrix.needsUpdate=!0),a.forEach((n,r)=>m.current?.setMatrixAt(r,e.compose(h.set(n.x,n.h/2,n.z),t.identity(),s.set(n.w,n.h,n.d)))),m.current&&(m.current.instanceMatrix.needsUpdate=!0)},[n,r,a]),o(()=>{let t=w(e.street);v.current&&(v.current.visible=t>.001),h.current&&h.current.color.set(I.sodium).multiplyScalar(.25+2.2*t),g.current&&(g.current.opacity=.42*t),_.current&&(_.current.emissiveIntensity=.08+.1*t),s.userData.uniforms.uLit.value=t}),(0,H.jsxs)(`group`,{ref:v,visible:!1,children:[(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Z,0,0],receiveShadow:!0,children:[(0,H.jsx)(`planeGeometry`,{args:[X+260,420]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#0d0e12`,roughness:1})]}),(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Z,.02,0],children:[(0,H.jsx)(`planeGeometry`,{args:[X,N*2]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#1b1c22`,roughness:.82})]}),[1,-1].map(e=>(0,H.jsxs)(`group`,{children:[(0,H.jsxs)(`mesh`,{position:[Z,R/2,e*((N+M)/2)],children:[(0,H.jsx)(`boxGeometry`,{args:[X,R,M-N]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#2a2b31`,roughness:.95})]}),(0,H.jsxs)(`mesh`,{position:[Z,R/2+.005,e*(N+.12)],children:[(0,H.jsx)(`boxGeometry`,{args:[X,R+.01,.24]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#4a4b52`,roughness:.9})]}),(0,H.jsxs)(`mesh`,{"rotation-x":-Math.PI/2,position:[Z,.035,e*(N-.35)],children:[(0,H.jsx)(`planeGeometry`,{args:[X,.12]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#cfc8b4`,roughness:.7,emissive:`#cfc8b4`,emissiveIntensity:.1})]})]},e)),(0,H.jsxs)(`instancedMesh`,{ref:f,args:[void 0,void 0,r.length],frustumCulled:!1,children:[(0,H.jsx)(`planeGeometry`,{}),(0,H.jsx)(`meshStandardMaterial`,{ref:_,color:`#d8d1bd`,roughness:.7,emissive:`#d8d1bd`,emissiveIntensity:.1})]}),(0,H.jsxs)(`instancedMesh`,{ref:c,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,H.jsx)(`cylinderGeometry`,{args:[.09,.13,Ze,8]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,H.jsxs)(`instancedMesh`,{ref:l,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,H.jsx)(`boxGeometry`,{args:[.1,.1,1]}),(0,H.jsx)(`meshStandardMaterial`,{color:`#3a3c44`,roughness:.6,metalness:.4})]}),(0,H.jsxs)(`instancedMesh`,{ref:u,args:[void 0,void 0,n.length],frustumCulled:!1,children:[(0,H.jsx)(`boxGeometry`,{args:[.7,.16,.36]}),(0,H.jsx)(`meshBasicMaterial`,{ref:h,color:I.sodium,toneMapped:!1})]}),(0,H.jsxs)(`instancedMesh`,{ref:d,args:[void 0,void 0,n.length],frustumCulled:!1,renderOrder:2,children:[(0,H.jsx)(`planeGeometry`,{}),(0,H.jsx)(`meshBasicMaterial`,{ref:g,color:I.sodium,alphaMap:t,transparent:!0,opacity:0,depthWrite:!1,blending:2})]}),(0,H.jsx)(`instancedMesh`,{ref:m,args:[void 0,s,a.length],frustumCulled:!1,castShadow:!1,children:(0,H.jsx)(`boxGeometry`,{})})]})}var $=v(`doppler`),rt=[[-12,7,-N+.7],[4,7,N-.7],[20,7,-N+.7]];function it(){let e=F(),t=(0,B.useRef)([]),n=(0,B.useRef)(!0);return o((r,i)=>{let a=w(e.street);for(let e of t.current)e&&(e.intensity=60*a);if(e.mode>1.5&&(e.interactive>.5||e.lab>.5)){let t=Math.min(i,.1);e.sandT+=t,e.lm!==0&&(e.lx=((e.lx+e.lm*3*t+26)%52+52)%52-26);let r=ve(e)!==null;r&&!n.current&&e.kind>.5&&e.you>.5&&g.cue(`boom`,{gain:.8}),n.current=r}}),(0,H.jsxs)(`group`,{position:[$.x,$.y,$.z],children:[(0,H.jsx)(nt,{}),rt.map((e,n)=>(0,H.jsx)(`pointLight`,{ref:e=>void(t.current[n]=e),position:e,color:I.sodium,intensity:0,distance:34,decay:2},n)),(0,H.jsx)(Ee,{}),(0,H.jsx)(He,{}),(0,H.jsx)(Ye,{}),(0,H.jsx)(We,{}),(0,H.jsx)(Fe,{}),(0,H.jsx)(Le,{})]})}export{it as default};