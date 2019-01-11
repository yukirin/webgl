
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform vec3 eyePosition;
uniform vec4 rimColor;
uniform float rimCoef;
uniform float rimPower;

varying vec4 vColor;

void main(void) {
  vec3 wPosition = (mMatrix * vec4(position, 1.0)).xyz;
  vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
  vec3 wEyeDirection = normalize(eyePosition - wPosition);
  vec3 nLightDirection = normalize(lightDirection);

  vec3 halfLE = normalize(nLightDirection + wEyeDirection);
  float diffuse = clamp(dot(nLightDirection, wNormal), 0.1, 1.0);
  float specular = pow(clamp(dot(wNormal, halfLE), 0.0, 1.0), 50.0);

  float rim = pow(1.0 - clamp(dot(wNormal, wEyeDirection), 0.0, 1.0), rimPower);
  float dotLE = pow(max(dot(wEyeDirection, -nLightDirection), 0.0), 20.0);

  vec4 rimLight = rimColor * rimCoef * rim * dotLE;
  vColor = color * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0) + vec4(rimLight.rgb, 1.0);

  gl_Position = mvpMatrix * vec4(position, 1.0);
}