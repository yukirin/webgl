#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

mat3 yuv2rgb = mat3(1.0, 0.0, 1.13983, 1.0, -0.39465, -0.58060, 1.0, 2.03211, 0.0);
mat3 rgb2yuv = mat3(0.2126, 0.7152, 0.0722, -0.09991, -0.33609, 0.43600, 0.615, -0.5586, -0.05639);

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

vec2 rotate2d(in vec2 _st, const in float _angle) {
  _st -= 0.5;
  _st = mat2(cos(_angle), sin(_angle), -sin(_angle), cos(_angle)) * _st;
  _st += 0.5;
  return _st;
}

vec2 tile(vec2 _st, float _zoom) {
  _st *= _zoom;
  return fract(_st);
}

float random(const in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

vec2 truchetPattern(in vec2 _st, in float _index) {
  _index = fract((_index - 0.5) * 2.0);
  if (_index > 0.75) {
    _st = vec2(1.0) - _st;
  } else if (_index > 0.5) {
    _st = vec2(1.0 - _st.x, _st.y);
  } else if (_index > 0.25) {
    _st = 1.0 - vec2(1.0 - _st.x, _st.y);
  }
  return _st;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;
  p *= 10.0;

  // p = (p - vec2(0.5)) * (abs(sin(time * 0.2)) * 5.0);
  // p.x += time * 3.0;

  vec2 ipos = floor(p);
  vec2 fpos = fract(p);
  float rnd = random(ipos);

  vec2 tile = truchetPattern(fpos, rnd);
  float color = 0.0;

  // Maze
  color = smoothstep(tile.x - 0.3, tile.x, tile.y) - smoothstep(tile.x, tile.x + 0.3, tile.y);

  // Circles
  color = (step(length(tile), 0.6) - step(length(tile), 0.4)) +
          (step(length(tile - vec2(1.)), 0.6) - step(length(tile - vec2(1.)), 0.4));

  // Truchet (2 triangles)
  // color = step(tile.x, tile.y);
  // color = vec3(fpos, 0.0);
  outColor = vec4(vec3(color), 1.0);
}