#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in vec4 color;

uniform float time;
uniform vec2 mouse;
uniform float move;

out vec3 vPosition;
out vec3 vVelocity;
out vec4 vColor;

void main(void) {
  vPosition = position + velocity * 0.1 * move;
  vec3 p = vec3(mouse, sin(time) * 0.25) - position;
  vVelocity = normalize(velocity + p * 0.2 * move);
  vColor = color;
}