#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreen() {
  vec2 p = gl_FragCoord.xy * 2.0 - resolution;
  return p / min(resolution.x, resolution.y);
}

void main(void) {
  vec2 p = normalizeSCreen();
  vec2 color = (p.xy + vec2(1.0)) * 0.5;
  outColor = vec4(color, 0.0, 1.0);
}