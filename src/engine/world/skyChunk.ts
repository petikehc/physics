/**
 * The dusk sky gradient as a GLSL function, shared by the sky dome and by the sand's distance haze so the
 * beach melts into the horizon without a seam. Requires the uniforms declared in SKY_UNIFORMS_GLSL.
 */
export const SKY_UNIFORMS_GLSL = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uSunDir;
`;

export const SKY_FN_GLSL = /* glsl */ `
  vec3 skyColor(vec3 d) {
    float h = d.y;
    float sunAmt = max(dot(d, uSunDir), 0.0);
    vec3 col = mix(uMid, uZenith, smoothstep(0.05, 0.75, h));
    float band = exp(-max(h, 0.0) * 9.0);
    vec3 horizon = mix(uHorizon * 0.5, uHorizon, pow(sunAmt, 2.0));
    col = mix(col, horizon, band * (0.45 + 0.55 * pow(sunAmt, 1.5)));
    col += uGlow * pow(sunAmt, 6.0) * 0.12 * band;
    return col;
  }
`;
