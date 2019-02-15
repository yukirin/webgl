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

float rand(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453); }

float circle(vec2 p, float r) { return abs(length(p) - r); }

float line(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float t = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  return length(pa - ba * t);
}

mat2 rotate(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, s, -s, c);
}

float ezing(in float t) {
  // return t;
  // return t * t * (3. - 2. * t);
  // return sin(t * radinas(90.));
  // return 1. - pow(cos(t * radinas(90.)), .5);
  return pow(sin(t * radians(90.)), .3);
}

float scene(in float t, in float w, in float s) { return clamp(t - w, 0., s) / s; }

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();
  p *= 1.5;
  float t = mod(time, 6.);
  float a, b;
  vec3 line_col = vec3(.2, .4, .1);
  vec3 col = vec3(.05, .07, .15) * p.y * p.y;

  p *= rotate(radians(45.) * ezing(scene(t, 3., 1.)));
  a = ezing(scene(t, 0., 1.));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, line(p, vec2(-a, 0), vec2(a, 0))));
  a = ezing(scene(t, 2.0, 1.0));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, line(p, vec2(0, -a), vec2(0, a))));
  a = ezing(scene(t, 1.0, 1.0));
  b = ezing(scene(t, 4.0, 2.0));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, circle(p - vec2(b, 0), 0.5 * a)));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, circle(p - vec2(-b, 0), 0.5 * a)));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, circle(p - vec2(0, b), 0.5 * a)));
  col = mix(col, line_col, 1.0 - smoothstep(0.05, 0.052, circle(p - vec2(0, -b), 0.5 * a)));
  outColor = vec4(col, 1.);
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