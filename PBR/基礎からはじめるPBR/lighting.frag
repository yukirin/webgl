#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform float directionalLightIntensity;
uniform float pointLightIntensity;
uniform samplerCube cubeTexture;

out vec4 outColor;

const float EPS = 1.0e-6;
const float PI = 3.14159265;
const float INVPI = 0.31830988618;
const float OFFSET = 1.0e-2;
const float INF = 1.0e+10;
const float GAMMAFACTOR = 2.2;

struct Intersection {
  bool hit;
  vec3 position;
  float distance;
  vec3 normal;
  vec2 uv;
  int count;

  vec3 ambient;
  vec3 diffuseColor;
  vec3 specularColor;
  float roughness;
  vec3 reflectance;

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

struct DirectionalLight {
  vec3 direction;
  vec3 color;
  float intensity;
};

struct PointLight {
  vec3 position;
  vec3 color;
  float maxRadius;
  float intensity;
};

struct IncidentLight {
  vec3 direction;
  vec3 color;
};

struct ReflectedLight {
  vec3 directDiffuse;
  vec3 directSpecular;
  vec3 ambient;
};

DirectionalLight dLight = DirectionalLight(normalize(vec3(1., 1., 1.)), vec3(1), 0.);
PointLight pLight = PointLight(vec3(-2., 10., -20.), vec3(1, 1, 1), 40., 0.);

vec2 normalizeSCreenCoord();
vec2 normalizeMousePosition(vec2 mousePos);
void initCam(inout Camera cam, in vec2 m);
vec3 getRay(const in Camera cam, const in vec2 p);
vec3 getNormal(vec3 p);
float genShadow(vec3 p, vec3 light);
float distanceFunc(in vec3 p);
void intersectObjects(const in Ray ray, inout Intersection intersection, const in int bounce);
float calcAO(const in vec3 p, const in vec3 n);
void calcRadiance(inout Intersection intersection, const in Ray ray, const in int bounce);
float distFuncSphere(vec3 p, const in float radius);
float distFuncBox(vec3 p, const in vec3 size);
float distFuncFloor(vec3 p);
vec3 emit(Intersection intersection, Ray ray);
vec3 schlickFresnel(const in vec3 f0, const in vec3 view, const in vec3 normal);
vec3 fresnelSchlick(const in vec3 specular, const in vec3 h, const in vec3 v);
vec3 fresnelSchlickRoughness(const in vec3 f0, const in float roughness, const in vec3 n, const in vec3 v);
float dGGX(const in float a, const in float dotNH);
float smithSchlickGGX(const in float roughness, const in float dotNV, const in float dotNL);
vec3 cookTorrance(const in vec3 light, const in vec3 normal, const in vec3 view, const in vec3 specular,
                  const in float roughness);
vec3 normalizedLambert(const in vec3 diffuse);
void directionalLight2Irradiance(const in DirectionalLight dLight, out IncidentLight inLight);
void pointLight2Irradiance(const in PointLight pLight, out IncidentLight inLight, const in vec3 pos);
float getSquareFalloffAttenuation(const in float lightDistance, const in float lightRadius);
float dSphereLeft(vec3 p);
float dSphereRight(vec3 p);
float dGround(vec3 p);
vec4 LinearToGamma(in vec4 value, in float gammaFactor);
vec4 GammaToLinear(in vec4 value, in float gammaFactor);
float checkeredPattern(const in vec3 p);
float random3(const in vec3 co);

float random3(const in vec3 co) { return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 144.7272))) * 43758.5453); }

vec3 normalizedLambert(const in vec3 diffuse) { return diffuse * INVPI; }

float checkeredPattern(const in vec3 p) {
  float u = step(1.0, mod(p.x, 2.0));
  float v = step(1.0, mod(p.z, 2.0));
  return float(u == v);
}

vec3 fresnelSchlick(const in vec3 specular, const in vec3 h, const in vec3 v) {
  return (specular + (1. - specular) * pow(1. - clamp(dot(v, h), 0., 1.), 5.));
}

float dGGX(const in float a, const in float dotNH) {
  float a2 = a * a;
  float nh2 = dotNH * dotNH;

  float d = nh2 * (a2 - 1.) + 1.;
  return a2 / (PI * d * d);
}

float smithSchlickGGX(const in float roughness, const in float dotNV, const in float dotNL) {
  float r = (roughness + 1.);
  float k = (r * r) / 8.;

  float gv = dotNV / (dotNV * (1. - k) + k);
  float gl = dotNL / (dotNL * (1. - k) + k);
  return gl * gv;
}

vec3 cookTorrance(const in vec3 light, const in vec3 normal, const in vec3 view, const in vec3 specular,
                  const in float roughness) {
  float dotNL = clamp(dot(normal, light), 0., 1.);
  float dotNV = clamp(dot(normal, view), 0., 1.);
  vec3 h = normalize(light + view);
  float dotNH = clamp(dot(normal, h), 0., 1.);
  float dotVH = clamp(dot(view, h), 0., 1.);
  float dotLV = clamp(dot(light, view), 0., 1.);
  float a = roughness * roughness;

  float D = dGGX(a, dotNH);
  float G = smithSchlickGGX(roughness, dotNV, dotNL);
  vec3 F = fresnelSchlick(specular, view, h);
  return (F * (G * D)) / (4. * dotNL * dotNV + EPS);
}

// RenderEquations(RE)
void directRE(inout Intersection ins, const Ray ray, const in IncidentLight inLight, inout ReflectedLight refLight) {
  float dotNL = clamp(dot(inLight.direction, ins.normal), 0., 1.);
  vec3 irradiance = dotNL * inLight.color;

  refLight.directDiffuse += irradiance * normalizedLambert(ins.diffuseColor);
  refLight.directSpecular +=
      irradiance * cookTorrance(inLight.direction, ins.normal, -ray.direction, ins.specularColor, ins.roughness);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  dLight.intensity = directionalLightIntensity;
  pLight.intensity = pointLightIntensity;

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
  vec3 reflection = vec3(1);
  for (int i = 0; i < 4; i++) {
    intersectObjects(ray, intersection, i);
    color += reflection * intersection.color;
    reflection *= intersection.reflectance;

    ray.direction = normalize(reflect(ray.direction, intersection.normal));
    ray.origin = intersection.position + intersection.normal * OFFSET;

    // float x = random3(ray.origin);
    // float y = random3(ray.origin.yzx + vec3(31.416, -47.853, 12.793));
    // float z = random3(ray.origin.zxy + vec3(-233.145, -113.408, -185.31));
    // ray.direction = normalize(ray.direction + (vec3(x, y, z) * 2. - 1.) * .4 * intersection.roughness);

    if (!intersection.hit) {
      break;
    }
  }

  outColor = vec4(color, 1.);
}

float distanceFunc(in vec3 p) {
  float ds = dSphereLeft(p);
  float ds2 = dSphereRight(p);
  float db = dGround(p);
  return min(db, min(ds, ds2));
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

float distFuncFloor(vec3 p) { return dot(p, vec3(0.0, 1.0, 0.0)) + 1.2; }

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

  vec3 albedo, f0;
  float metalic;
  if (abs(dSphereLeft(p)) < intersectDist) {
    albedo = vec3(1, .71, .29);
    metalic = 1.;
    intersection.roughness = .1;
    f0 = vec3(1, .71, .29);
  } else if (abs(dSphereRight(p)) < intersectDist) {
    albedo = vec3(.15, .28, .96);
    metalic = 0.0;
    intersection.roughness = 0.35;
    f0 = vec3(.05, .05, .05);
  } else if (abs(dGround(p)) < intersectDist) {
    float pattern = clamp(checkeredPattern(intersection.position) + .2, 0., 1.);
    albedo = vec3(.9, .1, .2) * pattern;
    metalic = 0.;
    intersection.roughness = .7 * pattern;
    f0 = vec3(.03, .03, .03);
  }

  f0 = mix(f0, albedo, metalic);
  intersection.normal = getNormal(intersection.position);
  intersection.diffuseColor = mix(albedo, vec3(0), metalic);
  intersection.specularColor = mix(f0, albedo, metalic);
  intersection.reflectance = fresnelSchlickRoughness(f0, intersection.roughness, -ray.direction, intersection.normal);
  intersection.ambient = vec3(.05);
  calcRadiance(intersection, ray, bounce);
  return;
}

void calcRadiance(inout Intersection intersection, const in Ray ray, const in int bounce) {
  if (!intersection.hit) {
    intersection.color = texture(cubeTexture, ray.direction).rgb;
    // intersection.color += emit(intersection, ray);
    return;
  }

  IncidentLight inLight;
  ReflectedLight refLight = ReflectedLight(vec3(0), vec3(0), vec3(0));
  vec3 emissive = vec3(0);
  float shadow = genShadow(intersection.position + intersection.normal * OFFSET, dLight.direction);

  directionalLight2Irradiance(dLight, inLight);
  inLight.color *= shadow;
  directRE(intersection, ray, inLight, refLight);

  pointLight2Irradiance(pLight, inLight, intersection.position);
  inLight.color *= shadow;
  directRE(intersection, ray, inLight, refLight);

  refLight.ambient =
      intersection.diffuseColor * intersection.ambient * calcAO(intersection.position, intersection.normal);
  intersection.color = emissive + refLight.directDiffuse + refLight.directSpecular + refLight.ambient;

  // fog
  intersection.color = mix(intersection.color, vec3(0.7), 1.0 - exp(-0.0001 * pow(intersection.distance, 3.0)));
  // intersection.color += emit(intersection, ray);
  return;
}

vec3 emit(Intersection intersection, Ray ray) {
  float hide = step(length(pLight.position - ray.origin), intersection.distance);
  vec3 v = ray.origin - pLight.position;
  float dist = length(v - dot(v, ray.direction) * ray.direction);
  float k = 2.;

  return pLight.color * pow(dist, -k) * hide;
}

vec3 schlickFresnel(const in vec3 f0, const in vec3 view, const in vec3 normal) {
  float coef = max(0., dot(view, normal));
  return f0 + (1. - f0) * pow(1. - coef, 5.);
}

float dSphereLeft(vec3 p) { return distFuncSphere(p - vec3(1.5, 0, 0), 1.); }

float dSphereRight(vec3 p) { return distFuncSphere(p + vec3(1.5, 0, 0), 1.); }

float dGround(vec3 p) { return distFuncBox(p + vec3(0, 1.1, 0), vec3(7, .01, 7)); }

float getSquareFalloffAttenuation(const in float lightDistance, const in float lightRadius) {
  float sqDistance = lightDistance * lightDistance;
  float invRadius = 1. / lightRadius;
  float factor = sqDistance * invRadius * invRadius;
  float smoothFactor = max(1. - factor * factor, 0.);
  return (smoothFactor * smoothFactor) / (sqDistance + 1.);
}

void directionalLight2Irradiance(const in DirectionalLight dLight, out IncidentLight inLight) {
  inLight.direction = dLight.direction;
  inLight.color = dLight.color * dLight.intensity;
}

void pointLight2Irradiance(const in PointLight pLight, out IncidentLight inLight, const in vec3 pos) {
  vec3 light = pLight.position - pos;
  inLight.direction = normalize(light);

  inLight.color = pLight.color;
  float attenuation = getSquareFalloffAttenuation(length(light), pLight.maxRadius);
  inLight.color *= pLight.intensity * attenuation;
}

vec4 LinearToGamma(in vec4 value, in float gammaFactor) {
  return vec4(pow(value.xyz, vec3(1. / gammaFactor)), value.w);
}
vec4 GammaToLinear(in vec4 value, in float gammaFactor) { return vec4(pow(value.xyz, vec3(gammaFactor)), value.w); }

vec3 fresnelSchlickRoughness(const in vec3 f0, const in float roughness, const in vec3 n, const in vec3 v) {
  float coef = max(0., dot(v, n));
  return f0 + (max(vec3(1. - roughness), f0) - f0) * pow(1. - coef, 5.);
}