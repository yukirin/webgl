#version 300 es

layout(location = 0) in vec4 position;
layout(location = 1) in vec4 color;

uniform float time;
uniform vec2 mouse;

out vec4 vColor;

void main(void) {
  vec2 p = mouse - position.xy;
  float z = cos(length(p * 20.0) - time) * 0.1;
  gl_Position = position + vec4(0.0, 0.0, z, 0.0);
  vColor = color;
}