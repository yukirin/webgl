#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

// YUV to RGB matrix
mat3 yuv2rgb = mat3(1.0, 0.0, 1.13983, 1.0, -0.39465, -0.58060, 1.0, 2.03211, 0.0);

// RGB to YUV matrix
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

float circle(in vec2 p, const in float radius, const in float smoothenss) {
  float d = distance(p, vec2(0.5));
  return 1.0 - smoothstep(radius - smoothenss, radius, d);
}

float box(vec2 _st, vec2 _size, float _smoothEdges) {
  _size = vec2(0.5) - _size * 0.5;
  vec2 aa = vec2(_smoothEdges * 0.5);
  vec2 uv = smoothstep(_size, _size + aa, _st);
  uv *= smoothstep(_size, _size + aa, vec2(1.0) - _st);
  return uv.x * uv.y;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;
  vec2 p2 = p;
  vec3 color = vec3(0.0);

  p = tile(p, abs(sin(time)) * 4.0);
  p2 = tile(p, abs(sin(time)) * 8.0);
  p = rotate2d(p, PI * time * 0.5);

  color += vec3(box(p, vec2(0.7), 0.01));
  color *= 1.0 - vec3(circle(p2, 0.3, 0.01));
  outColor = vec4(color, 1.0);
}