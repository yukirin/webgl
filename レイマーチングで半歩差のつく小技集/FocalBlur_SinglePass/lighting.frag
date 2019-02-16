#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float EPS = 1.0e-6;
const vec3 lightDir = normalize(vec3(-0.48666426339228763, 0.8111071056538127, -0.3244428422615251));
const vec3 pointLightPos = vec3(0, 6, -20);
const vec3 pointLightColor = vec3(1, .1, .1);
const float PI = 3.14159265;
const float OFFSET = 1.0e-2;
const float INF = 1.0e+10;

struct Intersection {
  bool hit;
  vec3 position;
  float distance;
  vec3 normal;
  vec2 uv;
  int count;

  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float reflectance;

  vec3 color;
};

struct Ray {
  vec3 origin;
  vec3 direction;
};

struct Camera {
  vec3 pos;
  float range;
  float fovy;
  vec3 target;
  mat3 rot;
};

vec2 normalizeSCreenCoord();
vec2 normalizeMousePosition(vec2 mousePos);
vec3 rgb2hsv(const in vec3 c);
vec3 hsv2rgb(const in vec3 c);
vec4 minVec4(const in vec4 a, const in vec4 b);
float checkeredPattern(const in vec3 p);
void initCam(inout Camera cam, in vec2 m);
vec3 getRay(const in Camera cam, const in vec2 p);
vec3 rotate(vec3 p, float angle, vec3 axis);
vec3 onRep(const in vec3 p, const in float interval);
vec2 onRep(const in vec2 p, const in float interval);
vec3 getNormal(vec3 p);
float genShadow(vec3 p, vec3 light);
float smoothMin(float d1, float d2, float k);
float distanceFunc(in vec3 p);
vec4 sceneColor(in vec3 p);
void intersectObjects(const in Ray ray, inout Intersection intersection, const in int bounce);
float calcAO(const in vec3 p, const in vec3 n);
void calcRadiance(inout Intersection intersection, const in Ray ray, const in int bounce);
float distFuncSphere(vec3 p, const in float radius);
float distFuncBox(vec3 p, const in vec3 size);
float distFuncTorus(vec3 p, vec2 t);
float distFuncCylinder(vec3 p, vec2 r);
float distFuncFloor(vec3 p);
float distBar(const in vec2 p, const in float width, const in float interval);
float distTube(const in vec2 p, const in float width, const in float interval);
float opDisplace(const in float dist, const in vec3 p);
float opOnion(const in float dist, const in float thickness);
vec3 foldX(in vec3 p);
float distTree(in vec3 p);
vec3 foldRotate(in vec3 p, const in float s);
float dSnowCrystal(in vec3 p);
vec3 foldN(const in vec3 p, const in vec3 normal);
float mandelbox(in vec3 p);
vec3 boxFold(in vec3 p, const in vec3 reflectSize);
vec3 sphereFold(in vec3 p, const in float minradius, const in float fixedRadius, inout float dr);
vec3 emit(Intersection intersection, Ray ray);
vec3 blurScene(in Ray ray, inout Intersection intersection, const in int bounce);

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  Camera cam;
  Ray ray;
  Intersection intersection;

  cam.range = 4.0;
  cam.fovy = 60.;
  cam.target = vec3(0., 0., 0.);
  initCam(cam, m);
  ray.origin = cam.pos;
  ray.direction = getRay(cam, p);

  vec3 color = vec3(0.0);
  vec3 rPos;
  float reflection = 1.0;
  for (int i = 0; i < 4; i++) {
    color += reflection * blurScene(ray, intersection, i);
    reflection *= intersection.reflectance;
    ray.direction = normalize(reflect(ray.direction, intersection.normal));
    ray.origin = intersection.position + intersection.normal * OFFSET;

    if (!intersection.hit) {
      break;
    }
  }

  outColor = vec4(color, 1.0);
}

float distanceFunc(in vec3 p) {
  float df = distFuncFloor(p);

  p.xz = onRep(p.xz, 3.);
  float ds = distFuncSphere(p, 1.);
  return min(ds, df);
}

vec3 foldN(const in vec3 p, const in vec3 normal) { return p - 2. * min(0., dot(p, normal)) * normal; }

float mandelbox(in vec3 z) {
  vec3 offset = z;
  float scale = 2.;
  float dr = 1.;
  int iterations = 20;
  vec3 reflectSize = vec3(1., 1., 1.);
  float minRadius = .5;
  float fixedRadius = 1.;

  for (int n = 0; n < iterations; n++) {
    z = boxFold(z, reflectSize);
    z = sphereFold(z, minRadius, fixedRadius, dr);

    z = scale * z + offset;
    dr = dr * abs(scale) + 1.;
  }

  float r = length(z);
  return r / abs(dr);
}

vec3 boxFold(in vec3 p, const in vec3 reflectSize) {
  p = clamp(p, -reflectSize, reflectSize) * 2. - p;
  return p;
}

vec3 sphereFold(in vec3 p, const in float minRadius, const in float fixedRadius, inout float dr) {
  float r = length(p);
  float r2 = r * r;
  float mR2 = minRadius * minRadius;
  float fR2 = fixedRadius * fixedRadius;

  if (r < minRadius) {
    p *= fR2 / mR2;
    dr *= fR2 / mR2;
  } else if (r < fixedRadius) {
    p *= fR2 / r2;
    dr *= fR2 / r2;
  }
  return p;
}

vec3 foldRotate(in vec3 p, const in float s) {
  float a = PI / s - atan(p.x, p.y);
  float n = (PI * 2.) / s;
  a = floor(a / n) * n;
  p = rotate(p, a, vec3(0, 0, -1));
  return p;
}

float distTree(in vec3 p) {
  float scale = .6 * clamp(1.5 * sin(.5 * time), 0., 1.);
  scale = .6;
  float width = mix(.3 * scale, 0., clamp(p.y, 0., 1.));
  vec3 size = vec3(width, 1., width);

  float d = distFuncBox(p, size);

  for (int i = 0; i < 10; i++) {
    vec3 q = foldX(p);
    q.y -= .5 * size.y;
    q = rotate(q, -1.2, vec3(0, 0, -1));
    size *= scale;
    d = min(d, distFuncBox(q, size));
    p = q;
  }

  return d;
}

float dSnowCrystal(in vec3 p) {
  p = foldRotate(p, 6.);
  return distTree(p);
}

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

vec3 getRay(const in Camera cam, const in vec2 p) {
  float fov = cam.fovy * 0.5 * PI / 180.0;
  float coef = sin(fov);
  float x = coef * p.x;
  float y = coef * p.y;
  float z = -cos(fov);

  return cam.rot * normalize(vec3(x, y, z));
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
  float bright = 1.0;
  float shadowIntensity = 0.6;
  float shadowSharpness = 10.0;
  for (float t = 0.0; t < 30.0; t++) {
    dist = distanceFunc(p + light * rLen);
    if (abs(dist) < 0.001) {
      return shadowIntensity;
    }
    bright = min(bright, dist * shadowSharpness / rLen);
    rLen += dist;
  }

  return shadowIntensity + (1.0 - shadowIntensity) * bright;
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

float calcAO(const in vec3 p, const in vec3 n) {
  float k = 1.0, occ = 0.0;
  for (int i = 0; i < 5; i++) {
    float len = 0.15 + float(i) * 0.15;
    float dist = distanceFunc(p + n * len);
    occ += (len - dist) * k;
    k *= 0.5;
  }

  return clamp(1.0 - occ, 0.0, 1.0);
}

void initCam(inout Camera cam, in vec2 m) {
  m.x *= PI;
  m.y = (1. - (m.y * .5 + .5)) * PI;
  // spherical coordinate system
  vec3 eye = vec3(sin(m.y) * sin(m.x), cos(m.y), sin(m.y) * cos(m.x)) * cam.range;
  cam.pos = eye + cam.target;

  vec3 cDir = normalize(cam.target - cam.pos);
  vec3 cUp = normalize(vec3(0., 1., 0.));
  vec3 cSide = normalize(cross(cUp, -cDir));
  cUp = normalize(cross(-cDir, cSide));
  cam.rot = mat3(cSide, cUp, -cDir);
}

float distFuncSphere(vec3 p, const in float radius) { return length(p) - radius; }

float distFuncBox(vec3 p, const in vec3 size) {
  vec3 q = abs(p);
  return length(max(q - size, 0.0)) - 0.0;
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

float dSphere(const in vec3 p, const in float radius) { return distFuncSphere(p - vec3(1.2, 0., 0.), radius); }

float dSphereLeft(const in vec3 p, const in float radius) { return distFuncSphere(p + vec3(1.2, 0., 0.), radius); }

float opDisplace(const in float dist, const in vec3 p) {
  const float scale = 0.1;
  vec3 pattern = sin(p * 20.0);
  float displacement = pattern.x * pattern.y * pattern.z * 0.5 + 0.5;
  return dist + displacement * scale;
}

float opOnion(const in float dist, const in float thickness) { return abs(dist) - thickness; }

vec3 foldX(in vec3 p) {
  p.x = abs(p.x);
  return p;
}

void intersectObjects(const in Ray ray, inout Intersection intersection, const in int bounce) {
  const float intersectDist = 0.001;
  float dist = 0.0;
  float rLen = 0.0;
  vec3 p = ray.origin;
  intersection.hit = false;
  for (int i = 0; i < 256; i++) {
    dist = distanceFunc(p);
    intersection.count = i;
    if (abs(dist) < intersectDist) {
      intersection.hit = true;
      break;
    }
    rLen += dist;
    p = ray.origin + ray.direction * rLen;
  }

  intersection.distance = rLen;
  intersection.position = p;
  if (!intersection.hit) {
    calcRadiance(intersection, ray, bounce);
    return;
  }

  intersection.normal = getNormal(intersection.position);
  intersection.ambient = vec3(0.1);
  intersection.diffuse = vec3(.8, .8, .8);
  intersection.specular = vec3(0.6);
  intersection.reflectance = 0.5;

  calcRadiance(intersection, ray, bounce);
  return;
}

void calcRadiance(inout Intersection intersection, const in Ray ray, const in int bounce) {
  vec3 light = normalize(lightDir + vec3(sin(time * 0.4), 0.0, 0.0));
  if (!intersection.hit) {
    intersection.color = vec3(0.0);
    intersection.color += emit(intersection, ray);
    return;
  }

  float diff = clamp(dot(light, intersection.normal), 0.1, 1.0) * (1. / PI);
  const float specFactor = 30.0;
  const float normFactor = (specFactor + 2.) / (2. * PI);
  float spec = normFactor * pow(clamp(dot(reflect(-light, intersection.normal), -ray.direction), 0.0, 1.0), specFactor);
  float shadow = genShadow(intersection.position + intersection.normal * OFFSET, light);
  float ao = calcAO(intersection.position, intersection.normal);

  // mix
  intersection.color =
      ((intersection.diffuse * diff + intersection.specular * spec) * shadow) + intersection.ambient * ao;

  // fog
  intersection.color = mix(intersection.color, vec3(0.8), 1.0 - exp(-0.0001 * pow(intersection.distance, 3.0)));
  intersection.color += emit(intersection, ray);
  return;
}

vec3 emit(Intersection intersection, Ray ray) {
  float hide = step(length(pointLightPos - ray.origin), intersection.distance);
  vec3 v = ray.origin - pointLightPos;
  float dist = length(v - dot(v, ray.direction) * ray.direction);
  float k = 2.;

  return pointLightColor * pow(dist, -k) * hide;
}

vec3 blurScene(in Ray ray, inout Intersection intersection, const in int bounce) {
  float angle = radians(sin(time) * .25);
  Ray ray1 = Ray(rotate(ray.origin, angle, vec3(1, 0, 0)), rotate(ray.direction, angle, vec3(1, 0, 0)));
  Ray ray2 = Ray(rotate(ray.origin, -angle, vec3(1, 0, 0)), rotate(ray.direction, -angle, vec3(1, 0, 0)));

  vec3 color = vec3(0);
  intersectObjects(ray1, intersection, bounce);
  color += intersection.color;
  intersectObjects(ray2, intersection, bounce);
  color += intersection.color;
  intersectObjects(ray, intersection, bounce);
  color += intersection.color;

  return color / 3.;
}