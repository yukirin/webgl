#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

vec3 hsv(float h, float s, float v) {
  vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

const int oct = 8;
const float per = 0.5;
const float PI = 3.1415926;
const float cCorners = 1.0 / 16.0;
const float cSides = 1.0 / 8.0;
const float cCenter = 1.0 / 4.0;

float interpolate(float a, float b, float x) {
  float f = (1.0 - cos(x * PI)) * 0.5;
  return a * (1.0 - f) + b * f;
}

float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float irnd(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec4 v =
      vec4(rnd(vec2(i.x, i.y)), rnd(vec2(i.x + 1.0, i.y)), rnd(vec2(i.x, i.y + 1.0)), rnd(vec2(i.x + 1.0, i.y + 1.0)));

  return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
}

// noise
float noise(vec2 p) {
  float t = 0.0;
  for (int i = 0; i < oct; i++) {
    float freq = pow(2.0, float(i));
    float amp = pow(per, float(oct - i));
    t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
  }
  return t;
}

// seamless noise
float snoise(vec2 p, vec2 q, vec2 r) {
  return noise(vec2(p.x, p.y)) * q.x * q.y + noise(vec2(p.x, p.y + r.y)) * q.x * (1.0 - q.y) +
         noise(vec2(p.x + r.x, p.y)) * (1.0 - q.x) * q.y +
         noise(vec2(p.x + r.x, p.y + r.y)) * (1.0 - q.x) * (1.0 - q.y);
}

void main(void) {
  // noise
  vec2 t = gl_FragCoord.xy + vec2(time * 10.0);
  float n = noise(t);

  // seamless noise
  const float map = 256.0;
  vec2 st = mod(gl_FragCoord.xy + vec2(time * 10.0), map);
  float sn = snoise(st, st / map, vec2(map));

  outColor = vec4(vec3(sn), 1.0);
}