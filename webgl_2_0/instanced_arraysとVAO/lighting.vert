#version 300 es

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec4 color;
layout(location = 3) in vec3 offset;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform vec3 eyePosition;
uniform vec4 ambientColor;

out vec4 vColor;

void main(void) {
  vec3 insPos = position + offset;
  vec3 wPosition = (mMatrix * vec4(insPos, 1.0)).xyz;
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 wEyeDirection = normalize(eyePosition - wPosition);
  vec3 nLightDirection = normalize(lightDirection);

  vec3 halfLE = normalize(nLightDirection + wEyeDirection);

  float diffuse = clamp(dot(nLightDirection, wNormal), 0.0, 1.0);
  float specular = pow(clamp(dot(wNormal, halfLE), 0.0, 1.0), 50.0);

  vColor = color * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 0.0) + ambientColor;

  gl_Position = mvpMatrix * vec4(insPos, 1.0);
}