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

mat3 getCamRot(const in vec3 cPos);
vec3 getRay(vec2 p);
vec3 getNormal(vec3 p);
float genShadow(vec3 p, vec3 light);
float smoothMin(float d1, float d2, float k);
float distanceFunc(in vec3 p);
vec3 getRayColor(const in vec3 origin, const in vec3 ray, out vec3 p, out vec3 normal, out bool hit);
float distFuncFloor(const in vec3 p, const in vec4 n);
float random(const vec2 st);
float fade(const in float t);
float grad(const in vec2 pi, const in float xf, const in float yf);
float perlinNoise(in vec2 p);
float fbm(in vec2 st);

float random(const in vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

float fade(const in float t) { return t * t * t * (t * (t * 6. - 15.) + 10.); }

float grad(const in vec2 pi, const in float xf, const in float yf) {
  float r = random(pi);
  if (r < .25) {
    return -xf;
  } else if (r < .50) {
    return yf;
  } else if (r < .75) {
    return xf;
  } else {
    return -yf;
  }
}

float perlinNoise(in vec2 p) {
  vec2 pi = floor(p);
  float xf = fract(p.x);
  float yf = fract(p.y);
  float u = fade(xf);
  float v = fade(yf);

  float x0y0 = grad(pi, xf, yf);
  float x1y0 = grad(pi + vec2(1., 0.), xf - 1., yf);
  float x0y1 = grad(pi + vec2(0., 1.), xf, yf - 1.);
  float x1y1 = grad(pi + vec2(1., 1.), xf - 1., yf - 1.);

  float y1 = mix(x0y0, x1y0, u);
  float y2 = mix(x0y1, x1y1, u);

  return mix(y1, y2, v) * 0.5 + 0.5;
}

float fbm(in vec2 st) {
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

float distFuncFloor(const in vec3 p, const in vec4 n) { return dot(p, n.xyz) + n.w; }

float distanceFunc(in vec3 p) {
  float heightFactor = 2.0;
  vec4 plane = vec4(0., 1., 0., 1.);
  float df = distFuncFloor(p, plane);
  float height = fbm(p.xz * .2 + time * .1) * heightFactor;
  return df - height;
}

vec3 getRayColor(const in vec3 origin, const in vec3 ray, out vec3 rPos, out vec3 normal, out bool hit) {
  float dist = 0.0;
  float rLen = 0.0;
  rPos = origin;
  hit = false;
  for (int i = 0; i < 256; i++) {
    dist = distanceFunc(rPos);
    if (abs(dist) < 0.001 * rLen * .5) {
      hit = true;
      break;
    }
    rLen += dist;
    rPos = origin + ray * rLen * 0.6;
  }

  vec3 light = normalize(lightDir + vec3(sin(time * 0.1), 0.0, 0.0));
  if (!hit) {
    return vec3(0.0);
  }

  vec3 baseColor = vec3(1.0, 1.0, 1.0);
  normal = getNormal(rPos);
  vec3 halfLE = normalize(light + (-ray));
  float diff = clamp(dot(light, normal), 0.1, 1.0);
  float spec = pow(clamp(dot(halfLE, normal), 0.0, 1.0), 50.0);
  float shadow = genShadow(rPos + normal * OFFSET, light);

  vec3 color = (baseColor * diff + vec3(spec)) * max(0.5, shadow);
  return color - pow(clamp(0.005 * rLen, 0.0, 0.6), 2.0);
  // return normal;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 1.0, 4.0);
  vec3 ray = getCamRot(cPos) * getRay(p);
  vec3 color = vec3(0.0);
  vec3 rPos, normal;
  bool hit;
  float alpha = 1.0;

  for (int i = 0; i < 5; i++) {
    color += alpha * getRayColor(cPos, ray, rPos, normal, hit);
    alpha *= 0.3;
    ray = normalize(reflect(ray, normal));
    cPos = rPos + normal * OFFSET;

    if (!hit) {
      break;
    }
  }

  outColor = vec4(color, 1.0);
}