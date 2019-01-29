#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

float plot(vec2 st, float pct) {
  float a = smoothstep(pct - 0.02, pct, st.y);
  float b = smoothstep(pct, pct + 0.02, st.y);
  return a - b;
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;

  float y = p.x;
  // y = pow(p.x, 1.0);
  // y = pow(p.x, 5.0);
  // y = pow(p.x, 0.2);
  // y = exp(p.x) - 1.0;
  // y = log(p.x + 1.0);
  // y = sqrt(p.x);
  // y = step(0.5, p.x);
  // y = smoothstep(0.1, 0.9, p.x);
  // y = smoothstep(0.2, 0.5, p.x) - smoothstep(0.5, 0.8, p.x);
  // y = sin(p.x * 8.0 * PI + time) * 0.5 + 0.5;
  // y = sin(p.x * time) * 0.5 + 0.5;
  // y = sin(p.x * 2.0 * PI) * 2.0;
  // y = abs(sin(p.x * 2.0 * PI));
  // y = fract(sin(p.x * 4.0 * PI));
  // y = (ceil(sin(p.x * 4.0 * PI)) + floor(sin(p.x * 4.0 * PI))) * 0.5 + 0.5;
  // y = mod(p.x, 0.5);
  // y = fract(p.x * 4.0);
  // y = ceil(p.x * 4.0) * 0.25;
  // y = floor(p.x * 4.0) * 0.25;
  // y = sign(p.x * 2.0 - 1.0) * 0.5 + 0.5;
  // y = abs(p.x * 2.0 - 1.0);
  // y = clamp(p.x * 3.0 - 1.0, 0.0, 1.0);
  // y = min(1.0, p.x * 3.0 - 1.0);
  y = max(0.5, p.x * 3.0 - 1.0);

  vec3 color = vec3(y);

  float pct = plot(p, y);
  color = (1.0 - pct) * color + pct * vec3(0.0, 1.0, 0.0);
  outColor = vec4(color, 1.0);
}