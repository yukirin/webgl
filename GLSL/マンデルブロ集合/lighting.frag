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

  for (int i = 0; i < 360; i++) {
    j++;
    if (length(z) > 2.0) {
      break;
    }

    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c * y;
  }

  float h = mod(time * 20.0, 360.0) / 360.0;
  vec3 rgb = hsv(h, 1.0, 1.0);

  float t = float(j) / 360.0;

  outColor = vec4(rgb * t, 1.0);
}