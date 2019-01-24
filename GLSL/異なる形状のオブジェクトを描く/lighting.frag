#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const vec3 lightDir = vec3(-0.57, 0.57, 0.57);
const float sphereSize = 1.0;
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

vec3 trans(vec3 p) { return mod(p, 5.0) - 2.5; }

float distFuncTorus(vec3 p) {
  vec2 t = vec2(0.75, 0.25);
  vec2 r = vec2(length(p.xy) - t.x, p.z);
  return length(r) - t.y;
}

float distFuncFloor(vec3 p) { return dot(p, vec3(0.0, 1.0, 0.0)) + 1.0; }

float distanceFunc(vec3 p) {
  float d1 = distFuncTorus(p);
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

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  vec3 cPos = vec3(0.0, 0.0, 3.0);
  vec3 cDir = vec3(0.0, 0.0, -1.0);
  vec3 cUp = vec3(0.0, 1.0, 0.0);
  vec3 cSide = cross(cDir, cUp);
  float targetDepth = 1.0;

  vec3 ray = getRay(p);

  float distance = 0.0;
  float rLen = 0.0;
  vec3 rPos = cPos;
  for (int i = 0; i < 256; i++) {
    distance = distanceFunc(rPos);
    rLen += distance;
    rPos = cPos + ray * rLen;
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