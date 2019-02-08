#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in vec4 color;

uniform float time;
uniform vec2 mouse;
uniform float move;

out vec3 vPosition;
out vec3 vVelocity;
out vec4 vColor;

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

vec3 snoiseVec3(const in vec3 p) {
  float x = perlinNoise(p);
  float y = perlinNoise(p.yzx + vec3(31.416, -47.853, 12.793));
  float z = perlinNoise(p.zxy + vec3(-233.145, -113.408, -185.31));

  return vec3(x, y, z) * 2. - 1.;
}

vec3 curlNoise(in vec3 p) {
  const float scale = 1.;
  const float e = 0.0009765625;
  const float e2 = 2. * e;
  const float invE2 = 1. / e2;

  const vec3 dx = vec3(e, 0., 0.);
  const vec3 dy = vec3(0., e, 0.);
  const vec3 dz = vec3(0., 0., e);

  p = p / scale;
  vec3 px0 = snoiseVec3(p - dx);
  vec3 px1 = snoiseVec3(p + dx);
  vec3 py0 = snoiseVec3(p - dy);
  vec3 py1 = snoiseVec3(p + dy);
  vec3 pz0 = snoiseVec3(p - dz);
  vec3 pz1 = snoiseVec3(p + dz);

  float x = (py1.z - py0.z) - (pz1.y - pz0.y);
  float y = (pz1.x - pz0.x) - (px1.z - px0.z);
  float z = (px1.y - px0.y) - (py1.x - py0.x);

  return vec3(x, y, z) * invE2;
}

void main(void) {
  vec3 curlVelocity = curlNoise(position) * 0.2;
  vec3 newPosition = position + curlVelocity * 0.1 * move;
  // vPosition = (1. - step(3.0, abs(newPosition))) * newPosition;
  vPosition = newPosition;
  // vec3 p = vec3(mouse, sin(time) * 0.25) - position;
  vVelocity = normalize(velocity + curlVelocity * 0.1 * move);
  vColor = color;
}