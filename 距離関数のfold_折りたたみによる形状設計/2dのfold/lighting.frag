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
vec3 rgb2hsv(const in vec3 c);
vec3 hsv2rgb(const in vec3 c);
vec4 minVec4(const in vec4 a, const in vec4 b);
float checkeredPattern(const in vec3 p);

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

float distFuncSphere(vec3 p, const in float radius);
float distFuncBox(vec3 p);
float distFuncTorus(vec3 p, vec2 t);
float distFuncCylinder(vec3 p, vec2 r);
float distFuncFloor(vec3 p);
float distBar(const in vec2 p, const in float width, const in float interval);
float distTube(const in vec2 p, const in float width, const in float interval);
float opDisplace(const in float dist, const in vec3 p);
float opOnion(const in float dist, const in float thickness);
float dist2DBox(const in vec2 p, const in vec2 b);
float dCharG(in vec2 p);
vec2 foldX(in vec2 p);

vec4 minVec4(const in vec4 a, const in vec4 b) { return (a.a < b.a) ? a : b; }

float checkeredPattern(const in vec3 p) {
  float u = step(1.0, mod(p.x, 2.0));
  float v = step(1.0, mod(p.z, 2.0));
  return float(u == v);
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

float distFuncSphere(vec3 p, const in float radius) { return length(p) - radius; }

float distFuncBox(vec3 p) {
  vec3 q = abs(p);
  return length(max(q - vec3(2.0, 0.1, 0.5), 0.0)) - 0.1;
}

float distFuncTorus(vec3 p, vec2 t) {
  p.xz -= mouse * 2.0 - 1.0;
  vec2 r = vec2(length(p.xz) - t.x, p.y);
  return length(r) - t.y;
}

float distFuncCylinder(vec3 p, vec2 r) {
  vec2 d = abs(vec2(length(p.xy), p.z)) - r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.1;
}

float distFuncFloor(vec3 p) { return dot(p, vec3(0.0, 1.0, 0.0)) + 1.0; }

float distBar(const in vec2 p, const in float width, const in float interval) {
  return length(max(abs(onRep(p, interval)) - width, 0.0));
}

float distTube(const in vec2 p, const in float width, const in float interval) {
  return length(onRep(p, interval)) - width;
}

float distanceFunc(in vec3 p) {
  float dsp = distFuncSphere(p.yzx, 1.0);
  float df = distFuncFloor(p);
  return min(df, dsp);
}

float opDisplace(const in float dist, const in vec3 p) {
  const float scale = 0.1;
  vec3 pattern = sin(p * 20.0);
  float displacement = pattern.x * pattern.y * pattern.z * 0.5 + 0.5;
  return dist + displacement * scale;
}

float opOnion(const in float dist, const in float thickness) { return abs(dist) - thickness; }

vec3 getRayColor(const in vec3 origin, const in vec3 ray, out vec3 rPos, out vec3 normal, out bool hit) {
  float dist = 0.0;
  float rLen = 0.0;
  rPos = origin;
  for (int i = 0; i < 256; i++) {
    dist = distanceFunc(rPos);
    if (abs(dist) < 0.001) {
      break;
    }
    rLen += dist;
    rPos = origin + ray * rLen;
  }

  vec3 light = normalize(lightDir + vec3(sin(time), 0.0, 0.0));
  if (abs(dist) >= 0.001) {
    hit = false;
    return vec3(0.0);
  }

  vec3 baseColor = vec3(1.0, 1.0, 1.0);
  normal = getNormal(rPos);
  vec3 halfLE = normalize(light + (-ray));
  float diff = clamp(dot(light, normal), 0.1, 1.0);
  float spec = pow(clamp(dot(halfLE, normal), 0.0, 1.0), 50.0);
  float shadow = genShadow(rPos + normal * OFFSET, light);

  hit = true;
  vec3 color = (baseColor * diff + vec3(spec)) * max(0.5, shadow);
  return color - pow(clamp(0.005 * rLen, 0.0, 0.6), 2.0);
  // return normal;
}

float dist2DBox(const in vec2 p, const in vec2 b) { return max(abs(p.x) - b.x, abs(p.y) - b.y); }

float dCharG(in vec2 p) {
  p *= 2.0;
  float d = dist2DBox(p, vec2(0.25, 1.0));
  d = min(d, dist2DBox(p - vec2(0.75, 0.75), vec2(1.0, 0.25)));
  d = min(d, dist2DBox(p - vec2(0.75, -0.75), vec2(1.0, 0.25)));
  d = min(d, dist2DBox(p - vec2(1.5, -0.5), vec2(0.25, 0.5)));
  d = min(d, dist2DBox(p - vec2(1.25, 0.0), vec2(0.5, 0.125)));
  return d;
}

vec2 foldX(in vec2 p) {
  p.x = abs(p.x);
  return p;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  p = foldX(p);
  p -= vec2(0.2, 0.0);
  float color = sign(dCharG(p));
  outColor = vec4(vec3(color), 1.0);
}