#version 300 es

layout(location = 0) in vec4 position;
layout(location = 1) in vec4 color;

uniform mat4 mvpMatrix;

out vec4 vColor;

void main(void) {
  vColor = color;
  gl_Position = mvpMatrix * position;
  gl_PointSize = 1.0;
}