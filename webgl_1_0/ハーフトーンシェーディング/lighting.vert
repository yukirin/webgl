
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;

varying vec4 vColor;
varying float vDiffuse;

void main(void) {
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 nLightDirection = normalize(lightDirection);

  vDiffuse = clamp(dot(nLightDirection, wNormal), 0.0, 1.0);
  vColor = color;

  gl_Position = mvpMatrix * vec4(position, 1.0);
}