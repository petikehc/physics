import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{n as t,r as n}from"./vanilla-B9DCs4MG.js";import{B as r,C as i,D as a,F as o,I as s,K as c,M as l,N as u,R as d,S as f,T as p,Z as m,at as ee,b as te,et as h,ft as g,it as _,j as v,nt as y,q as b,rt as x,tt as S,w as C,x as w,z as T}from"./index-Dl8moIvf.js";var E=e(n()),ne=e(g()),D=new x,O=new x,k=new x,A=new y;function re(e,t,n){let r=D.setFromMatrixPosition(e.matrixWorld);r.project(t);let i=n.width/2,a=n.height/2;return[r.x*i+i,-(r.y*a)+a]}function ie(e,t){let n=D.setFromMatrixPosition(e.matrixWorld),r=O.setFromMatrixPosition(t.matrixWorld),i=n.sub(r),a=t.getWorldDirection(k);return i.angleTo(a)>Math.PI/2}function ae(e,t,n,r){let i=D.setFromMatrixPosition(e.matrixWorld),a=i.clone();a.project(t),A.set(a.x,a.y),n.setFromCamera(A,t);let o=n.intersectObjects(r,!0);if(o.length){let e=o[0].distance;return i.distanceTo(n.ray.origin)<e}return!0}function oe(e,t){if(t instanceof c)return t.zoom;if(t instanceof b){let n=D.setFromMatrixPosition(e.matrixWorld),r=O.setFromMatrixPosition(t.matrixWorld),i=t.fov*Math.PI/180,a=n.distanceTo(r);return 1/(2*Math.tan(i/2)*a)}return 1}function se(e,t,n){if(t instanceof b||t instanceof c){let r=D.setFromMatrixPosition(e.matrixWorld),i=O.setFromMatrixPosition(t.matrixWorld),a=r.distanceTo(i),o=(n[1]-n[0])/(t.far-t.near),s=n[1]-o*t.far;return Math.round(o*a+s)}}var j=e=>Math.abs(e)<1e-10?0:e;function M(e,t,n=``){let r=`matrix3d(`;for(let n=0;n!==16;n++)r+=j(t[n]*e.elements[n])+(n===15?`)`:`,`);return n+r}var ce=(e=>t=>M(t,e))([1,-1,1,1,1,-1,1,1,1,-1,1,1,1,-1,1,1]),le=(e=>(t,n)=>M(t,e(n),`translate(-50%,-50%)`))(e=>[1/e,1/e,1/e,1,-1/e,-1/e,-1/e,-1,1/e,1/e,1/e,1,1,1,1,1]);function ue(e){return e&&typeof e==`object`&&`current`in e}var N=E.forwardRef(({children:e,eps:t=.001,style:n,className:r,prepend:i,center:a,fullscreen:o,portal:s,distanceFactor:c,sprite:l=!1,transform:u=!1,occlude:d,onOcclude:p,castShadow:m,receiveShadow:ee,material:h,geometry:g,zIndexRange:_=[16777271,0],calculatePosition:v=re,as:y=`div`,wrapperClass:b,pointerEvents:S=`auto`,...C},T)=>{let{gl:D,camera:O,scene:k,size:A,raycaster:M,events:N,viewport:P}=f(),[F]=E.useState(()=>document.createElement(y)),I=E.useRef(null),L=E.useRef(null),R=E.useRef(0),z=E.useRef([0,0]),B=E.useRef(null),V=E.useRef(null),H=s?.current||N.connected||D.domElement.parentNode,U=E.useRef(null),W=E.useRef(!1),G=E.useMemo(()=>d&&d!==`blending`||Array.isArray(d)&&d.length&&ue(d[0]),[d]);E.useLayoutEffect(()=>{let e=D.domElement;d&&d===`blending`?(e.style.zIndex=`${Math.floor(_[0]/2)}`,e.style.position=`absolute`,e.style.pointerEvents=`none`):(e.style.zIndex=null,e.style.position=null,e.style.pointerEvents=null)},[d]),E.useLayoutEffect(()=>{if(L.current){let e=I.current=ne.createRoot(F);if(k.updateMatrixWorld(),u)F.style.cssText=`position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;else{let e=v(L.current,O,A);F.style.cssText=`position:absolute;top:0;left:0;transform:translate3d(${e[0]}px,${e[1]}px,0);transform-origin:0 0;`}return H&&(i?H.prepend(F):H.appendChild(F)),()=>{H&&H.removeChild(F),e.unmount()}}},[H,u]),E.useLayoutEffect(()=>{b&&(F.className=b)},[b]);let K=E.useMemo(()=>u?{position:`absolute`,top:0,left:0,width:A.width,height:A.height,transformStyle:`preserve-3d`,pointerEvents:`none`}:{position:`absolute`,transform:a?`translate3d(-50%,-50%,0)`:`none`,...o&&{top:-A.height/2,left:-A.width/2,width:A.width,height:A.height},...n},[n,a,o,A,u]),q=E.useMemo(()=>({position:`absolute`,pointerEvents:S}),[S]);E.useLayoutEffect(()=>{if(W.current=!1,u){var t;(t=I.current)==null||t.render(E.createElement(`div`,{ref:B,style:K},E.createElement(`div`,{ref:V,style:q},E.createElement(`div`,{ref:T,className:r,style:n,children:e}))))}else{var i;(i=I.current)==null||i.render(E.createElement(`div`,{ref:T,style:K,className:r,children:e}))}});let J=E.useRef(!0);w(e=>{if(L.current){O.updateMatrixWorld(),L.current.updateWorldMatrix(!0,!1);let e=u?z.current:v(L.current,O,A);if(u||Math.abs(R.current-O.zoom)>t||Math.abs(z.current[0]-e[0])>t||Math.abs(z.current[1]-e[1])>t){let t=ie(L.current,O),n=!1;G&&(Array.isArray(d)?n=d.map(e=>e.current):d!==`blending`&&(n=[k]));let r=J.current;if(n){let e=ae(L.current,O,M,n);J.current=e&&!t}else J.current=!t;r!==J.current&&(p?p(!J.current):F.style.display=J.current?`block`:`none`);let i=Math.floor(_[0]/2),a=d?G?[_[0],i]:[i-1,0]:_;if(F.style.zIndex=`${se(L.current,O,a)}`,u){let[e,t]=[A.width/2,A.height/2],n=O.projectionMatrix.elements[5]*t,{isOrthographicCamera:r,top:i,left:a,bottom:o,right:s}=O,u=ce(O.matrixWorldInverse),d=r?`scale(${n})translate(${j(-(s+a)/2)}px,${j((i+o)/2)}px)`:`translateZ(${n}px)`,f=L.current.matrixWorld;l&&(f=O.matrixWorldInverse.clone().transpose().copyPosition(f).scale(L.current.scale),f.elements[3]=f.elements[7]=f.elements[11]=0,f.elements[15]=1),F.style.width=A.width+`px`,F.style.height=A.height+`px`,F.style.perspective=r?``:`${n}px`,B.current&&V.current&&(B.current.style.transform=`${d}${u}translate(${e}px,${t}px)`,V.current.style.transform=le(f,1/((c||10)/400)))}else{let t=c===void 0?1:oe(L.current,O)*c;F.style.transform=`translate3d(${e[0]}px,${e[1]}px,0) scale(${t})`}z.current=e,R.current=O.zoom}}if(!G&&U.current&&!W.current){if(u){if(B.current){let e=B.current.children[0];if(e!=null&&e.clientWidth&&e!=null&&e.clientHeight){let{isOrthographicCamera:t}=O;if(t||g)C.scale&&(Array.isArray(C.scale)?C.scale instanceof x?U.current.scale.copy(C.scale.clone().divideScalar(1)):U.current.scale.set(1/C.scale[0],1/C.scale[1],1/C.scale[2]):U.current.scale.setScalar(1/C.scale));else{let t=(c||10)/400,n=e.clientWidth*t,r=e.clientHeight*t;U.current.scale.set(n,r,1)}W.current=!0}}}else{let t=F.children[0];if(t!=null&&t.clientWidth&&t!=null&&t.clientHeight){let e=1/P.factor,n=t.clientWidth*e,r=t.clientHeight*e;U.current.scale.set(n,r,1),W.current=!0}U.current.lookAt(e.camera.position)}}});let Y=E.useMemo(()=>({vertexShader:u?void 0:`
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `,fragmentShader:`
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `}),[u]);return E.createElement(`group`,te({},C,{ref:L}),d&&!G&&E.createElement(`mesh`,{castShadow:m,receiveShadow:ee,ref:U},g||E.createElement(`planeGeometry`,null),h||E.createElement(`shaderMaterial`,{side:2,vertexShader:Y.vertexShader,fragmentShader:Y.fragmentShader})))}),P=new p,F=new x,I=class extends l{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new v([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new v([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new u(t,6,1);return this.setAttribute(`instanceStart`,new o(n,3,0)),this.setAttribute(`instanceEnd`,new o(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new u(t,6,1);return this.setAttribute(`instanceColorStart`,new o(n,3,0)),this.setAttribute(`instanceColorEnd`,new o(n,3,3)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new ee(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new p);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),P.setFromBufferAttribute(t),this.boundingBox.union(P))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new h),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)F.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(F)),F.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(F));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}};C.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new y},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}},i.line={uniforms:S.merge([C.common,C.fog,C.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		float trimSegmentAlpha( const in vec4 start, const in vec4 end ) {

			// compute the interpolation factor needed to trim the segment so it terminates
			// between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column

			// we need different nearEstimate formula for reversed and default depth buffer
			// a is positive with a reversed depth buffer so it can be used for controlling the code flow
			float nearEstimate = ( a > 0.0 ) ? ( - b / ( a + 1.0 ) ) : ( - 0.5 * b / a );

			return ( nearEstimate - start.z ) / ( end.z - start.z );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef USE_DASH

				float lineDistanceStart = dashScale * instanceDistanceStart;
				float lineDistanceEnd = dashScale * instanceDistanceEnd;

			#endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( start, end );
					end.xyz = mix( start.xyz, end.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceEnd = mix( lineDistanceStart, lineDistanceEnd, alpha );

					#endif

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					float alpha = trimSegmentAlpha( end, start );
					start.xyz = mix( end.xyz, start.xyz, alpha );

					#ifdef USE_DASH

						lineDistanceStart = mix( lineDistanceEnd, lineDistanceStart, alpha );

					#endif

				}

			}

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? lineDistanceStart : lineDistanceEnd;
				vUv = uv;

			#endif

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			float alpha = opacity;
			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var L=class extends m{constructor(e){super({type:`LineMaterial`,uniforms:S.clone(i.line.uniforms),vertexShader:i.line.vertexShader,fragmentShader:i.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(e)}get color(){return this.uniforms.diffuse.value}set color(e){this.uniforms.diffuse.value=e}get worldUnits(){return`WORLD_UNITS`in this.defines}set worldUnits(e){e===!0!==this.worldUnits&&(this.needsUpdate=!0),e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(e){this.uniforms.linewidth&&(this.uniforms.linewidth.value=e)}get dashed(){return`USE_DASH`in this.defines}set dashed(e){e===!0!==this.dashed&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(e){this.uniforms.dashScale.value=e}get dashSize(){return this.uniforms.dashSize.value}set dashSize(e){this.uniforms.dashSize.value=e}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(e){this.uniforms.dashOffset.value=e}get gapSize(){return this.uniforms.gapSize.value}set gapSize(e){this.uniforms.gapSize.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}get resolution(){return this.uniforms.resolution.value}set resolution(e){this.uniforms.resolution.value.copy(e)}get alphaToCoverage(){return`USE_ALPHA_TO_COVERAGE`in this.defines}set alphaToCoverage(e){this.defines&&(e===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),e===!0?this.defines.USE_ALPHA_TO_COVERAGE=``:delete this.defines.USE_ALPHA_TO_COVERAGE)}},R=new _,z=new x,B=new x,V=new _,H=new _,U=new _,W=new x,G=new T,K=new s,q=new x,J=new p,Y=new h,X=new _,Z,Q;function de(e,t,n){return X.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),X.multiplyScalar(1/X.w),X.x=Q/n.width,X.y=Q/n.height,X.applyMatrix4(e.projectionMatrixInverse),X.multiplyScalar(1/X.w),Math.abs(Math.max(X.x,X.y))}function fe(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,a=r.attributes.instanceEnd,o=Math.min(r.instanceCount,i.count);for(let r=0,s=o;r<s;r++){K.start.fromBufferAttribute(i,r),K.end.fromBufferAttribute(a,r),K.applyMatrix4(n);let o=new x,s=new x;Z.distanceSqToSegment(K.start,K.end,s,o),s.distanceTo(o)<Q*.5&&t.push({point:s,pointOnLine:o,distance:Z.origin.distanceTo(s),object:e,face:null,faceIndex:r,uv:null,uv1:null})}}function pe(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,a=e.matrixWorld,o=e.geometry,s=o.attributes.instanceStart,c=o.attributes.instanceEnd,l=Math.min(o.instanceCount,s.count),u=-t.near;Z.at(1,U),U.w=1,U.applyMatrix4(t.matrixWorldInverse),U.applyMatrix4(r),U.multiplyScalar(1/U.w),U.x*=i.x/2,U.y*=i.y/2,U.z=0,W.copy(U),G.multiplyMatrices(t.matrixWorldInverse,a);for(let t=0,o=l;t<o;t++){if(V.fromBufferAttribute(s,t),H.fromBufferAttribute(c,t),V.w=1,H.w=1,V.applyMatrix4(G),H.applyMatrix4(G),V.z>u&&H.z>u)continue;if(V.z>u){let e=V.z-H.z,t=(V.z-u)/e;V.lerp(H,t)}else if(H.z>u){let e=H.z-V.z,t=(H.z-u)/e;H.lerp(V,t)}V.applyMatrix4(r),H.applyMatrix4(r),V.multiplyScalar(1/V.w),H.multiplyScalar(1/H.w),V.x*=i.x/2,V.y*=i.y/2,H.x*=i.x/2,H.y*=i.y/2,K.start.copy(V),K.start.z=0,K.end.copy(H),K.end.z=0;let o=K.closestPointToPointParameter(W,!0);K.at(o,q);let l=d.lerp(V.z,H.z,o),f=l>=-1&&l<=1,p=W.distanceTo(q)<Q*.5;if(f&&p){K.start.fromBufferAttribute(s,t),K.end.fromBufferAttribute(c,t),K.start.applyMatrix4(a),K.end.applyMatrix4(a);let r=new x,i=new x;Z.distanceSqToSegment(K.start,K.end,i,r),n.push({point:i,pointOnLine:r,distance:Z.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,uv1:null})}}}var me=class extends r{constructor(e=new I,t=new L({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)z.fromBufferAttribute(t,e),B.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+z.distanceTo(B);let i=new u(r,2,1);return e.setAttribute(`instanceDistanceStart`,new o(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new o(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;if(r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`),n===!1&&(this.material.resolution.x===0||this.material.resolution.y===0))return;let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;Z=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;Q=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),Y.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?Q*.5:de(r,Math.max(r.near,Y.distanceToPoint(Z.origin)),s.resolution),Y.radius+=c,Z.intersectsSphere(Y)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),J.copy(o.boundingBox).applyMatrix4(a);let l;l=n?Q*.5:de(r,Math.max(r.near,J.distanceToPoint(Z.origin)),s.resolution),J.expandByScalar(l),Z.intersectsBox(J)!==!1&&(n?fe(this,t):pe(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(R),this.material.uniforms.resolution.value.set(R.z,R.w))}},he=class extends I{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setColors(n),this}setFromPoints(e){let t=e.length-1,n=new Float32Array(6*t);for(let r=0;r<t;r++)n[6*r]=e[r].x,n[6*r+1]=e[r].y,n[6*r+2]=e[r].z||0,n[6*r+3]=e[r+1].x,n[6*r+4]=e[r+1].y,n[6*r+5]=e[r+1].z||0;return super.setPositions(n),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},ge=class extends me{constructor(e=new he,t=new L({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}},$=t();function _e(e,t){if(e.length<2)return e.slice();let n=Math.min(Math.max(t,0),1),r=[],i=0;for(let t=1;t<e.length;t++){let n=e[t-1],a=e[t],o=Math.hypot(a[0]-n[0],a[1]-n[1],a[2]-n[2]);r.push(o),i+=o}let a=n*i,o=[e[0]];for(let t=1;t<e.length;t++){let n=r[t-1],i=e[t-1],s=e[t];if(a>=n)o.push(s),a-=n;else{let e=n===0?0:a/n;o.push([i[0]+(s[0]-i[0])*e,i[1]+(s[1]-i[1])*e,i[2]+(s[2]-i[2])*e]);break}}return o}function ve({color:e=`#f4efe6`,width:t=2.2,handle:n,depthTest:r=!0,renderOrder:i=5}){let o=f(e=>e.size),s=(0,E.useMemo)(()=>{let n=new he;n.setPositions([0,0,0,0,0,0]);let o=new ge(n,new L({color:new a(e).getHex(),linewidth:t,transparent:!0,depthTest:r,depthWrite:!1,worldUnits:!1}));return o.frustumCulled=!1,o.renderOrder=i,o.visible=!1,o},[e,t,r,i]),c=(0,E.useRef)(``);return(0,E.useEffect)(()=>(n.current={set:(e,t=1,n=1)=>{let r=t>=1?e:_e(e,t),i=n>.002&&r.length>=2&&t>0;if(s.visible=i,s.material.opacity=n,!i)return;let a=r.flat(),o=a.map(e=>e.toFixed(4)).join(`,`);o!==c.current&&(c.current=o,s.geometry.setPositions(a),s.computeLineDistances())}},()=>{n.current=null}),[s,n]),(0,E.useEffect)(()=>()=>{s.geometry.dispose(),s.material.dispose()},[s]),w(()=>{s.material.resolution.set(o.width,o.height)}),(0,$.jsx)(`primitive`,{object:s})}var ye=(0,E.forwardRef)(function({className:e=`math-label`,color:t,children:n},r){return(0,$.jsx)(N,{center:!0,zIndexRange:[5,0],style:{pointerEvents:`none`},children:(0,$.jsx)(`div`,{ref:r,className:e,style:{color:t,opacity:0},children:n})})});export{ve as n,ye as t};