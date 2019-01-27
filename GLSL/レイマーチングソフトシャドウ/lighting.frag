#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const vec3 lightDir = vec3(0.0, 1.0, 0.0);
const float PI = 3.14159265;
const float angle = 60.0;
const float fov = angle * 0.5 * PI / 180.0;

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

vec3 twistY(vec3 p, float power) {
  float s = sin(power * p.y);
  float c = cos(power * p.y);
  mat3 m = mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  return m * p;
}

vec3 twistX(vec3 p, float power) {
  float s = sin(power * p.x);
  float c = cos(power * p.x);
  mat3 m = mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
  return m * p;
}

vec3 twistZ(vec3 p, float power) {
  float s = sin(power * p.z);
  float c = cos(power * p.z);
  mat3 m = mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
  return m * p;
}

vec3 trans(vec3 p) { return mod(p, 5.0) - 2.5; }

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

float smoothMin(float d1, float d2, float k) {
  float h = exp(-k * d1) + exp(-k * d2);
  return -log(h) / k;
}

float distanceFunc(vec3 p) {
  float d1 = distFuncTorus(p, vec2(1.5, 0.5));
  float d2 = distFuncFloor(p);
  return min(d1, d2);
}

vec3 getNormal(vec3 p) {
  float d = 0.0001;
  float x = distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0));
  float y = distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0));
  float z = distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d));

  return normalize(vec3(x, y, z));
}

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

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 4.0, 5.0);
  vec3 cDir = normalize(vec3(0.0, -0.7, -1.0));
  vec3 cUp = normalize(vec3(0.0, 1.0, 0.0));
  vec3 cSide = normalize(cross(cDir, cUp));
  cUp = normalize(cross(-cDir, cSide));
  mat3 camRot = mat3(cSide, cUp, -cDir);

  vec3 ray = camRot * getRay(p);

  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;
  for (int i = 0; i < 512; i++) {
    distance = distanceFunc(rPos);
    if (distance < 0.001) {
      break;
    }
    rLen += distance;
    rPos = cPos + ray * rLen;
  }

  vec3 light = normalize(lightDir + vec3(sin(time), 0.0, 0.0));

  if (abs(distance) < 0.001) {
    vec3 normal = getNormal(rPos);
    vec3 halfLE = normalize(light + (-ray));
    float diff = clamp(dot(light, normal), 0.1, 1.0);
    float spec = pow(clamp(dot(halfLE, normal), 0.0, 1.0), 50.0);

    float shadow = genShadow(rPos + normal * 0.001, light);
    float u = 1.0 - floor(mod(rPos.x, 2.0));
    float v = 1.0 - floor(mod(rPos.z, 2.0));
    if ((u == 1.0 && v < 1.0) || (u < 1.0 && v == 1.0)) {
      diff *= 0.7;
    }

    vec3 color = vec3(1.0, 1.0, 1.0) * diff + vec3(spec);
    outColor = vec4(color * max(0.5, shadow), 1.0);
    // outColor = vec4(normal, 1.0);
  } else {
    outColor = vec4(vec3(0.0), 1.0);
  }
}