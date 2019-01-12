#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texCoord;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;

out vec3 vPosition;
flat out vec3 vNormal;
out vec2 vTexCoord;

void main(void) {
  vPosition = (mMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);

  vTexCoord = texCoord;

  gl_Position = mvpMatrix * vec4(position, 1.0);
}