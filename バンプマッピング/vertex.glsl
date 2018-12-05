
attribute vec3 position;
attribute vec4 color;
attribute vec2 textureCoord;
attribute vec3 normal;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;
uniform vec3 lightPosition;
uniform vec3 eyePosition;

varying vec4 vColor;
varying vec2 vTextureCoord;
varying vec3 vEyeDirection;
varying vec3 vLightDirection;

void main(void) {
    vec3 pos = (mMatrix * vec4(position, 1.0)).xyz;
    vec3 wNormal = (invTMatrix * vec4(normal, 0.0)).xyz;

    vec3 lightDirection = normalize(lightPosition - pos);
    vec3 eyeDirection = normalize(eyePosition - pos);

    vec3 n = normalize(wNormal);
    vec3 t = normalize(cross(wNormal, vec3(0.0, 1.0, 0.0)));
    vec3 b = cross(n, t);

    vEyeDirection.x = dot(t, eyeDirection);
    vEyeDirection.y = dot(b, eyeDirection);
    vEyeDirection.z = dot(n, eyeDirection);
    normalize(vEyeDirection);

    vLightDirection.x = dot(t, lightDirection);
    vLightDirection.y = dot(b, lightDirection);
    vLightDirection.z = dot(n, lightDirection);
    normalize(vLightDirection);

    vColor = color;
    vTextureCoord = textureCoord;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}