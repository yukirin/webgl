
attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 mMatrix;
uniform mat4 invTMatrix;
uniform mat4 mvpMatrix;
uniform vec3 lightDirection;
uniform vec3 eyePosition;
uniform vec4 ambientColor;

varying vec4 vColor;

void main(void) {
    vec3 nLightDirection = normalize(lightDirection);

    vec3 wNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
    vec3 wEye = normalize(eyePosition - (mMatrix * vec4(position, 1.0)).xyz);
    vec3 halfLE = normalize(nLightDirection + wEye);

    float diffuse = clamp(dot(wNormal, nLightDirection), 0.0, 1.0);
    float specular = pow(clamp(dot(wNormal, halfLE), 0.0, 1.0), 50.0);
    
    vec4 amb = color * ambientColor;

    vColor = amb * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0);

    gl_Position = mvpMatrix * vec4(position, 1.0);
}