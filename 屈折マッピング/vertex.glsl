
attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 invTMatrix;

varying vec4 vColor;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize((invTMatrix * vec4(normal, 0.0)).xyz);
    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}