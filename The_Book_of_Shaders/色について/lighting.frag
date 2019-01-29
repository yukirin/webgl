#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(const in vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

float plot(const in vec2 st, const in float pct) {
  float a = smoothstep(pct - 0.02, pct, st.y);
  float b = smoothstep(pct, pct + 0.02, st.y);
  return a - b;
}

vec3 rgb2hsb(const in vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(const in vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;

  vec3 color = vec3(0.0);
  vec3 colorA = vec3(0.149, 0.141, 0.912);
  vec3 colorB = vec3(1.0, 0.833, 0.224);

  // float pct = abs(fract(cos(p.y * p.x * 4.0 + time)));
  vec3 pct = vec3(p.x);

  // pct.r = smoothstep(0.0, 1.0, p.x * time * 0.3);
  // pct.g = max(0.0, sin(p.x * 2.0 * PI - time) * 0.5);
  // pct.b = sin(p.x * PI * 1.5) * (1.0 / (time * 0.5 + 1.0)) + 0.3;
  // color = mix(colorA, colorB, pct);

  // pct.r = 1.0 - step(0.25, p.x);
  // pct.g = step(0.5, p.x);
  // pct.b = step(0.75, p.x);
  // color = mix(colorA, colorB, pct);

  // color = mix(color, vec3(1.0, 0.0, 0.0), plot(p, pct.r));
  // color = mix(color, vec3(0.0, 1.0, 0.0), plot(p, pct.g));
  // color = mix(color, vec3(0.0, 0.0, 1.0), plot(p, pct.b));

  // color = hsb2rgb(vec3(p.x, 1.0, p.y));

  vec2 toCenter = p - vec2(0.5);
  float angle = atan(toCenter.y, toCenter.x);
  float nAngle = angle / TWO_PI + 0.5;
  float radius = length(toCenter) * 2.0;

  // nAngle = pow(nAngle, 3.0);
  color = hsb2rgb(vec3(nAngle, radius, 1.0));

  outColor = vec4(color, 1.0);
}