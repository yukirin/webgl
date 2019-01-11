
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform vec4 ambient;

varying vec4 vDest;
varying vec4 vColor;
varying vec3 vNormal;
varying float vDepth;

void main() {
  gl_Position = mvpMatrix * vec4(position, 1.0);

  vec3 wPosition = (mMatrix * vec4(position, 1.0)).xyz;
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 nLightDirection = normalize(lightDirection);

  float diffuse = clamp(dot(nLightDirection, wNormal), 0.1, 1.0);

  vDest = vec4(color.rgb * ambient.rgb * diffuse, 1.0);
  vColor = color * ambient;
  vNormal = wNormal;
  vDepth = gl_Position.z / gl_Position.w;
}