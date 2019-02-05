#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

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

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(const in vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

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

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;

  p.x *= resolution.x / resolution.y;
  p += time * 0.1;
  vec3 color = vec3(fbm(p));

  outColor = vec4(color, 1.0);
}