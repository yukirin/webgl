#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

float random(const in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

float random3(const in vec3 co) { return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 144.7272))) * 43758.5453); }

float fade(const in float t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }

// https://postd.cc/understanding-perlin-noise/
float grad(const in vec3 pi, const in float x, const in float y, const float z) {
  float r = random3(pi);

  int hash = int(floor(256.0 * r));
  switch (hash & 0xF) {
    case 0x0:
      return x + y;
    case 0x1:
      return -x + y;
    case 0x2:
      return x - y;
    case 0x3:
      return -x - y;
    case 0x4:
      return x + z;
    case 0x5:
      return -x + z;
    case 0x6:
      return x - z;
    case 0x7:
      return -x - z;
    case 0x8:
      return y + z;
    case 0x9:
      return -y + z;
    case 0xA:
      return y - z;
    case 0xB:
      return -y - z;
    case 0xC:
      return y + x;
    case 0xD:
      return -y + z;
    case 0xE:
      return y - x;
    case 0xF:
      return -y - z;
    default:
      return 0.;  // never happens
  }
}

float perlinNoise(in vec3 p) {
  vec3 pi = floor(p);
  float xf = fract(p.x);
  float yf = fract(p.y);
  float zf = fract(p.z);
  float u = fade(xf);
  float v = fade(yf);
  float w = fade(zf);

  float x0y0z0 = grad(pi, xf, yf, zf);
  float x1y0z0 = grad(pi + vec3(1., 0., 0.), xf - 1., yf, zf);
  float x0y1z0 = grad(pi + vec3(0., 1., 0.), xf, yf - 1., zf);
  float x1y1z0 = grad(pi + vec3(1., 1., 0.), xf - 1., yf - 1., zf);
  float x0y0z1 = grad(pi + vec3(0., 0., 1.), xf, yf, zf - 1.);
  float x1y0z1 = grad(pi + vec3(1., 0., 1.), xf - 1., yf, zf - 1.);
  float x0y1z1 = grad(pi + vec3(0., 1., 1.), xf, yf - 1., zf - 1.);
  float x1y1z1 = grad(pi + vec3(1., 1., 1.), xf - 1., yf - 1., zf - 1.);

  float y0z0 = mix(x0y0z0, x1y0z0, u);
  float y1z0 = mix(x0y1z0, x1y1z0, u);
  float y0z1 = mix(x0y0z1, x1y0z1, u);
  float y1z1 = mix(x0y1z1, x1y1z1, u);

  float z0 = mix(y0z0, y1z0, v);
  float z1 = mix(y0z1, y1z1, v);

  return mix(z0, z1, w) * 0.5 + 0.5;
}

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(const in vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

float fbm(in vec3 st) {
  const int octaves = 5;
  float lacunarity = 2.0;
  float gain = 0.5;

  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 5.0;
  float totalWeight = 0.0;

  st *= frequency;
  for (int i = 0; i < octaves; i++) {
    value += amplitude * perlinNoise(st);
    totalWeight += amplitude;
    st *= lacunarity;
    amplitude *= gain;
  }

  return value / totalWeight;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;

  p.x *= resolution.x / resolution.y;
  p += time * 0.1;
  vec3 color = vec3(fbm(vec3(p, time * .1)));

  outColor = vec4(color, 1.0);
}