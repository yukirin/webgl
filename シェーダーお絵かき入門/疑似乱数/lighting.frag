#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float EPS = 1.0e-6;
const vec3 lightDir = normalize(vec3(-0.48666426339228763, 0.8111071056538127, -0.3244428422615251));
const float PI = 3.14159265;
const float OFFSET = 1.0e-2;
const float INF = 1.0e+10;

vec2 normalizeSCreenCoord();
vec2 normalizeMousePosition(const in vec2 mousePos);
vec3 rgb2hsv(const in vec3 c);
vec3 hsv2rgb(const in vec3 c);

float frag1(vec2 p, float size) {
  size = .5 + size * .5;
  p = step(p, vec2(size)) * step(1. - p, vec2(size));

  return p.x * p.y;
}

float rand(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }

float wave(vec2 st, float n) {
  st = (floor(st * n) + .5) / n;
  float offset = rand(st) * 5.;
  float d = distance(vec2(.5), st);
  return (1. + sin(d * 3. - time * 3. + offset)) * .5;
}

float boxWave(vec2 st, float n) {
  float size = wave(st, n);
  st = fract(st * n);
  return frag1(st, size);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord() * .5 + .5;
  vec3 color = vec3(0.);

  color.rgb = vec3(boxWave(p, 10.));
  outColor = vec4(color, 1.);
}

vec3 rgb2hsv(const in vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(const in vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(const in vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }