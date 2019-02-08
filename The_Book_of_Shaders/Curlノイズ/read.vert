#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in vec4 color;

uniform mat4 mvpMatrix;
uniform float move;

out vec4 vColor;

void main(void) {
  vColor = color + vec4(velocity, 0.0);
  gl_Position = mvpMatrix * vec4(position, 1.0);
  gl_PointSize = 1.0;
}