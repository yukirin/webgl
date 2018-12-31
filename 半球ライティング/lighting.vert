
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform vec3 skyDirection;
uniform vec3 eyePosition;
uniform vec4 skyColor;
uniform vec4 groundColor;

varying vec4 vColor;

void main(void) {
  vec3 wPosition = (mMatrix * vec4(position, 1.0)).xyz;
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 wEyeDirection = normalize(eyePosition - wPosition);
  vec3 nLightDirection = normalize(lightDirection);
  vec3 nSkyDirection = normalize(skyDirection);

  vec3 halfLE = normalize(nLightDirection + wEyeDirection);
  float diffuse = clamp(dot(nLightDirection, wNormal), 0.0, 1.0);
  float specular = pow(clamp(dot(wNormal, halfLE), 0.0, 1.0), 50.0);
  float hemisphere = (dot(wNormal, nSkyDirection) + 1.0) * 0.5;

  vec4 ambient = mix(groundColor, skyColor, hemisphere);
  vColor = color * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0) + ambient;

  gl_Position = mvpMatrix * vec4(position, 1.0);
}