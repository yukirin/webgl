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

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = normalizeSCreenCoord();

  // ring
  //	float t = 0.02 / abs(0.5 - length(p));

  // time scale ring
  //	float t = 0.02 / abs(sin(time) - length(p));

  // gradiation
  //	vec2 v = vec2(0.0, 1.0);
  //	float t = dot(p, v);

  // cone
  //	vec2 v = vec2(0.0, 1.0);
  //	float t = dot(p, v) / (length(p) * length(v));

  // zoom line
  //	float t = atan(p.y, p.x) + time;
  //	t = sin(t * 10.0);

  // flower
  //	float u = sin((atan(p.y, p.x) + time * 0.5) * 6.0);
  //	float t = 0.01 / abs(u - length(p));

  // wave ring
  //	float u = sin((atan(p.y, p.x) + time * 0.5) * 20.0) * 0.01;
  //	float t = 0.01 / abs(0.5 + u - length(p));

  // flower
  //	float u = abs(sin((atan(p.y, p.x) + time * 0.5) * 20.0)) * 0.5;
  //	float t = 0.01 / abs(0.25 + u - length(p));

  // fan
  float u = abs(sin((atan(p.y, p.x) - length(p) + time) * 10.0) * 0.5) + 0.2;
  float t = 0.01 / abs(u - length(p));

  outColor = vec4(vec3(t), 1.0);
}