#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

vec3 hsv(float h, float s, float v) {
  vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  int j = 0;
  vec2 c = p + vec2(-0.5, 0.0);
  float y = 1.5 - mouse.x * 0.5;
  vec2 z = vec2(0.0, 0.0);
  vec2 point1 = vec2(1., .1);
  vec2 point2 = vec2(.5, -2.);
  float d1 = 1000000.;
  float d2 = 1000000.;

  for (int i = 0; i < 360; i++) {
    j++;
    if (length(z) > 2.0) {
      break;
    }

    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c * y;
    d1 = min(d1, distance(z, point1));
    d2 = min(d2, distance(z, point2));
  }

  d1 = 1. - clamp(d1, 0., 1.);
  d2 = 1. - clamp(d2, 0., 1.);
  float d3 = float(j) / 360.;

  outColor = vec4(vec3(d1, d2, d3), 1.0);
}