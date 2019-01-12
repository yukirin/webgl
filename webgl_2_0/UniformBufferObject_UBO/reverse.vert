#version 300 es

layout(location = 0) in vec3 position;

layout(std140) uniform matrix {
  mat4 m;
  mat4 mvp;
  mat4 invT;
}
mat;

void main(void) { gl_Position = mat.mvp * vec4(position, 1.0); }