#version 300 es
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

out vec4 outColor;

const float epsilon = 1.0e-6;
const float PI = 3.14159265;
const float TWO_PI = PI * 2.0;

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeSCreenCoord() { return (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y); }

// -1 <= x <= 1, -1 <= y <- 1
vec2 normalizeMousePosition(const in vec2 mousePos) { return vec2(mousePos.x * 2.0 - 1.0, -(mousePos.y * 2.0 - 1.0)); }

float plot(const in vec2 st, const in float pct) {
  float a = smoothstep(pct - 0.02, pct, st.y);
  float b = smoothstep(pct, pct + 0.02, st.y);
  return a - b;
}

vec3 rgb2hsb(const in vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb(const in vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  rgb = rgb * rgb * (3.0 - 2.0 * rgb);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

float circle(in vec2 _st, in float _radius) {
  vec2 dist = _st - vec2(0.5);
  float m1 = _radius - (_radius * 0.01);
  float m2 = _radius + (_radius * 0.01);

  return 1.0 - smoothstep(m1, m2, dot(dist, dist) * 4.0);
}

void main(void) {
  vec2 m = normalizeMousePosition(mouse);
  vec2 p = gl_FragCoord.xy / resolution;
  vec3 color = vec3(0.0);

  float pct = 1.0;
  // vec2 bl = step(vec2(0.1), p);                     // bottom-left
  // vec2 tr = step(vec2(0.1), 1.0 - p);               // top-right
  // vec2 tb = step(vec2(0.3), vec2(1.0 - p.y, p.y));  // top-bottom
  // vec2 bl = smoothstep(vec2(0.15), vec2(0.2), p);         // bottom-left
  // vec2 tr = smoothstep(vec2(0.15), vec2(0.2), 1.0 - p);   // top-right
  // vec2 mbl = smoothstep(vec2(0.2), vec2(0.25), p);        // bottom-left
  // vec2 mtr = smoothstep(vec2(0.2), vec2(0.25), 1.0 - p);  // top-right
  // pct = (1.0 - mbl.x * mbl.y * mtr.x * mtr.y) * bl.x * bl.y * tr.x * tr.y;

  // float pct = 1.0 - step(0.5, distance(p, vec2(0.5)));
  // vec2 center = vec2(cos(time) * 0.5 + 0.5, sin(time) * 0.5 + 0.5);
  // float d = distance(p, center);
  // float d2 = distance(p, vec2(0.5));
  // float radius = (sin(time) * 0.5 + 0.5) * 0.4;
  // pct = 1.0 - smoothstep(radius, radius + 0.05, d);
  // float pct2 = 1.0 - smoothstep(0.1, 0.15, d2);
  // color = vec3(pct + pct2) * vec3(1.0, 0.0, 0.0);

  // pct = distance(p, vec2(0.4)) + distance(p, vec2(0.6));
  // pct = distance(p, vec2(0.4)) * distance(p, vec2(0.6));
  // pct = min(distance(p, vec2(0.4)), distance(p, vec2(0.6)));
  // pct = max(distance(p, vec2(0.4)), distance(p, vec2(0.6)));
  // pct = pow(distance(p, vec2(0.4)), distance(p, vec2(0.6)));
  // color = vec3(pct);
  color = vec3(circle(p, 0.9));
  outColor = vec4(color, 1.0) * 2.0;
}