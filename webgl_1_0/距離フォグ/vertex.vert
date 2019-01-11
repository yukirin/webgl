
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform vec3 eyePosition;
uniform vec4 ambientColor;
uniform float fogStart;
uniform float fogEnd;

varying vec4 vColor;
varying float fogFactor;

const float near = 0.1;
const float far = 30.0;
const float linearDepth = 1.0 / (far - near);

void main(void) {
  vec3 wPosition = (mMatrix * vec4(position, 1.0)).xyz;
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 wEyeDirection = normalize(eyePosition - wPosition);
  vec3 nLightDirection = normalize(lightDirection);
  vec3 halfLE = normalize(nLightDirection + wEyeDirection);

  float diffuse = clamp(dot(nLightDirection, wNormal), 0.0, 1.0);
  float specular = pow(clamp(dot(wNormal, halfLE), 0.0, 1.0), 50.0);
  vec4 amb = color * ambientColor;

  vColor = amb * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0);

  vec3 pos = (mMatrix * vec4(position, 1.0)).xyz;
  float linearPos = clamp((length(eyePosition - pos) - near) * linearDepth, 0.0, 1.0);
  fogFactor = clamp((fogEnd - linearPos) / (fogEnd - fogStart), 0.0, 1.0);

  gl_Position = mvpMatrix * vec4(position, 1.0);
}