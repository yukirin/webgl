#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float EPS = 1.0e-6;
const vec3 lightDir = normalize(vec3(-0.48666426339228763, 0.8111071056538127, -0.3244428422615251));
const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;
const float OFFSET = 1.0e-2;

vec2 normalizeSCreenCoord();
vec2 normalizeMousePosition(vec2 mousePos);
float fbm(in vec3 st);
float perlinNoise(in vec3 p);
float grad(const in vec3 pi, const in float x, const in float y, const float z);
float fade(const in float t);
float random3(const in vec3 co);

mat3 getCamRot(const in vec3 cPos);
vec3 getRay(vec2 p);
vec3 rotate(vec3 p, float angle, vec3 axis);
vec3 onRep(const in vec3 p, const in float interval);
vec2 onRep(const in vec2 p, const in float interval);
vec3 getNormal(vec3 p);
float genShadow(vec3 p, vec3 light);
float smoothMin(float d1, float d2, float k);
float distanceFunc(in vec3 p);
vec4 sceneColor(in vec3 p);
vec3 getRayColor(const in vec3 origin, const in vec3 ray, out vec3 p, out vec3 normal, out bool hit);

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

float fbm(in vec3 st) {
  const int octaves = 5;
  float lacunarity = 2.0;
  float gain = 0.5;

  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
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

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

vec3 getRay(vec2 p) {
  float coef = sin(fov);
  float x = coef * p.x;
  float y = coef * p.y;
  float z = -cos(fov);

  return normalize(vec3(x, y, z));
}

vec3 rotate(vec3 p, float angle, vec3 axis) {
  // 任意軸回転行列
  vec3 a = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float r = 1.0 - c;

  mat3 m = mat3(a.x * a.x * r + c, a.y * a.x * r + a.z * s, a.z * a.x * r - a.y * s, a.x * a.y * r - a.z * s,
                a.y * a.y * r + c, a.z * a.y * r + a.x * s, a.x * a.z * r + a.y * s, a.y * a.z * r - a.x * s,
                a.z * a.z * r + c);

  return m * p;
}

vec3 onRep(const in vec3 p, const in float interval) { return mod(p, interval) - interval * 0.5; }
vec2 onRep(const in vec2 p, const in float interval) { return mod(p, interval) - interval * 0.5; }

float genShadow(vec3 p, vec3 light) {
  float dist = 0.0;
  float rLen = 0.001;
  float r = 1.0;
  float shadowCoef = 0.5;
  for (float t = 0.0; t < 50.0; t++) {
    dist = distanceFunc(p + light * rLen);
    if (abs(dist) < 0.001) {
      return shadowCoef;
    }
    r = min(r, dist * 16.0 / rLen);
    rLen += dist;
  }
  return 1.0 - shadowCoef + r * shadowCoef;
}

float smoothMin(float d1, float d2, float k) {
  float h = exp(-k * d1) + exp(-k * d2);
  return -log(h) / k;
}

vec3 getNormal(vec3 p) {
  const float d = 0.001;
  float x = distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0));
  float y = distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0));
  float z = distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d));

  return normalize(vec3(x, y, z));
}

mat3 getCamRot(const in vec3 cPos) {
  vec3 cDir = normalize(-cPos);
  vec3 cUp = normalize(vec3(0.0, 1.0, 0.0));
  vec3 cSide = normalize(cross(cDir, cUp));
  cUp = normalize(cross(-cDir, cSide));
  return mat3(cSide, cUp, -cDir);
}

float distanceFunc(in vec3 p) { return 0.0; }

float cloud(const in vec3 p) {
  const float scale = 0.03;
  return fbm(p * scale);
}

vec3 getRayColor(const in vec3 origin, const in vec3 ray, out vec3 rPos, out vec3 normal, out bool hit) {
  float alpha = 0.0;
  float rLen = 0.0;
  float depthInterval = 1.5;

  vec4 volumeColor = vec4(0.0);
  vec3 cloudColor = vec3(0.0);
  vec3 baseColor1 = vec3(1.1, 1.05, 1.0);
  vec3 baseColor2 = vec3(0.3, 0.3, 0.2);
  vec3 skyColor = vec3(0.05, 0.2, 0.5);

  rPos = origin;
  hit = false;
  for (float i = 0.0; i < 50.0; i += 1.0) {
    alpha = cloud(rPos + vec3(0.0, 0.0, -time * 50.0));
    alpha = smoothstep(0.5, 1.0, alpha);
    cloudColor = mix(baseColor1, baseColor2, alpha);

    alpha = (1.0 - volumeColor.a) * alpha;
    volumeColor += vec4(cloudColor * alpha, alpha);
    rPos = origin + ray * depthInterval * i;
  }

  return volumeColor.rgb;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 2.0, 4.0);
  vec3 ray = getCamRot(cPos) * getRay(p);
  vec3 color = vec3(0.0);
  vec3 rPos, normal;
  bool hit;

  color += getRayColor(cPos, ray, rPos, normal, hit);
  outColor = vec4(color, 1.0);
}