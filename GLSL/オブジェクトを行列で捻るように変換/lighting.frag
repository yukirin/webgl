#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const vec3 lightDir = vec3(0.577, 0.577, 0.577);
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
  vec2 r = vec2(length(p.xy) - t.x, p.z);
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
  vec3 q = twistY(p, radians(180.0 * sin(time * 0.5)));
  float d1 = distFuncTorus(q, vec2(1.5, 0.25));
  float d2 = distFuncBox(q);
  float d3 = distFuncCylinder(q, vec2(0.75, 0.25));
  return smoothMin(smoothMin(d1, d2, 16.0), d3, 16.0);
}

vec3 getNormal(vec3 p) {
  float d = 0.001;
  float x = distanceFunc(p + vec3(d, 0.0, 0.0)) - distanceFunc(p + vec3(-d, 0.0, 0.0));
  float y = distanceFunc(p + vec3(0.0, d, 0.0)) - distanceFunc(p + vec3(0.0, -d, 0.0));
  float z = distanceFunc(p + vec3(0.0, 0.0, d)) - distanceFunc(p + vec3(0.0, 0.0, -d));

  return normalize(vec3(x, y, z));
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 0.0, 5.0);
  vec3 cDir = normalize(vec3(0.0, 0.0, -1.0));
  vec3 cUp = normalize(vec3(0.0, 1.0, 0.0));
  vec3 cSide = normalize(cross(cDir, cUp));
  cUp = normalize(cross(-cDir, cSide));
  mat3 camRot = mat3(cSide, cUp, -cDir);

  vec3 ray = camRot * getRay(p);

  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;
  for (int i = 0; i < 1024; i++) {
    distance = distanceFunc(rPos);
    rLen += distance;
    rPos = cPos + ray * rLen * 0.4;
  }

  if (abs(distance) < 0.001) {
    vec3 normal = getNormal(rPos);
    float diff = clamp(dot(lightDir, normal), 0.1, 1.0);

    outColor = vec4(vec3(diff), 1.0);
    // outColor = vec4(normal, 1.0);
  } else {
    outColor = vec4(vec3(0.0), 1.0);
  }
}