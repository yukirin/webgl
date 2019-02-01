#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

vec2 normalizeSCreenCoord();
vec2 normalizeMousePosition(vec2 mousePos);

mat3 getCamRot(const in vec3 cPos);
vec3 getRay(vec2 p);
vec3 rotate(vec3 p, float angle, vec3 axis);
vec3 onRep(const in vec3 p, const in float interval);
vec2 onRep(const in vec2 p, const in float interval);
vec3 getNormal(vec3 p);
float genShadow(vec3 p, vec3 light);
float smoothMin(float d1, float d2, float k);
float distanceFunc(vec3 p);

float distFuncSphere(vec3 p);
float distFuncBox(vec3 p);
float distFuncTorus(vec3 p, vec2 t);
float distFuncCylinder(vec3 p, vec2 r);
float distFuncFloor(vec3 p);
float distBar(const in vec2 p, const in float width, const in float interval);
float distTube(const in vec2 p, const in float width, const in float interval);

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
    if (dist < 0.001) {
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
  float d = 0.001;
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

float distFuncSphere(vec3 p) {
  const float sphereSize = 1.0;
  return length(p) - sphereSize;
}

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

float distanceFunc(vec3 p) {
  const float barInterval = 1.0;
  float bx = distBar(p.yz, 0.1, barInterval);
  float by = distBar(p.xz, 0.1, barInterval);
  float bz = distBar(p.xy, 0.1, barInterval);

  const float tubeInterval = 0.1;
  float tx = distTube(p.yz, 0.025, tubeInterval);
  float ty = distTube(p.xz, 0.025, tubeInterval);
  float tz = distTube(p.xy, 0.025, tubeInterval);

  float tDist = min(min(tx, ty), tz);
  float bDist = min(min(bx, by), bz);
  return max(bDist, -tDist);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 0.0, 5.0);
  vec3 ray = getCamRot(cPos) * getRay(p);

  float dist = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;
  for (int i = 0; i < 256; i++) {
    dist = distanceFunc(rPos);
    if (abs(dist) < 0.001) {
      break;
    }
    rLen += dist;
    rPos = cPos + ray * rLen;
  }

  vec3 light = normalize(lightDir + vec3(sin(time), 0.0, 0.0));
  if (abs(dist) >= 0.001) {
    outColor = vec4(vec3(1.0), 1.0);
    return;
  }

  const vec3 baseColor = vec3(1.0, 0.0, 0.0);
  vec3 farColor = 0.7 * vec3(smoothstep(0.0, 20.0, rLen));

  vec3 normal = getNormal(rPos);
  vec3 halfLE = normalize(light + (-ray));
  float diff = clamp(dot(light, normal), 0.1, 1.0);
  float spec = pow(clamp(dot(halfLE, normal), 0.0, 1.0), 50.0);

  vec3 color = baseColor * diff + vec3(spec) + farColor;
  outColor = vec4(color, 1.0);
  // outColor = vec4(normal, 1.0);
}