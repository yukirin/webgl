#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 texCoord;
layout(location = 3) in vec3 offset;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main(void) {
  vec3 insPos = position + offset;
  if (mod(float(gl_VertexID), 4.0) == 0.0) {
    insPos += normal * 0.05;
  }

  vPosition = (mMatrix * vec4(insPos, 1.0)).xyz;
  vNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);

  vTexCoord = texCoord;
  if (mod(float(gl_InstanceID), 2.0) == 0.0) {
    vTexCoord = 1.0 - vTexCoord;
  }

  gl_Position = mvpMatrix * vec4(insPos, 1.0);
}