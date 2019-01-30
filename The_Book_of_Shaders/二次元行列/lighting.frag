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

mat2 rotate2d(const in float _angle) { return mat2(cos(_angle), sin(_angle), -sin(_angle), cos(_angle)); }

mat2 scale(const in vec2 _scale) { return mat2(_scale.x, 0.0, 0.0, _scale.y); }

float box(const in vec2 _st, in vec2 _size) {
  _size = vec2(0.5) - _size * 0.5;
  vec2 uv = smoothstep(_size, _size + vec2(0.001), _st);
  uv *= smoothstep(_size, _size + vec2(0.001), vec2(1.0) - _st);

  return uv.x * uv.y;
}

float crossbox(in vec2 _st, float _size) {
  return box(_st, vec2(_size, _size / 4.0)) + box(_st, vec2(_size / 4.0, _size));
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;
  vec3 color = vec3(0.0);

  vec2 translate = vec2(cos(time), sin(time)) * 0.35;
  // vec2 translate = vec2(cos(time), abs(sin(time * 2.0)));
  p += translate;
  p -= vec2(0.5);
  p = rotate2d(sin(time) * PI) * scale(vec2(sin(time)) + 1.) * p;
  p += vec2(0.5);

  vec2 pos = p * 2.0 - 1.0;
  color = yuv2rgb * vec3(0.5, pos.x, pos.y);
  // color = vec3(p.x, p.y, 0.0);
  color += vec3(crossbox(p, 0.25));
  outColor = vec4(color, 1.0);
}