#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texCoord;

uniform mat4 mvpMatrix;

out vec2 vTexCoord;

void main(void) {
  vTexCoord = texCoord;

  gl_Position = mvpMatrix * vec4(position, 1.0);
}