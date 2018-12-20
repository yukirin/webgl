
attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 mMatrix;
uniform mat4 invTMatrix;
uniform mat4 mvpMatrix;

varying vec4 vColor;
varying vec3 vNormal;
varying vec3 vPosition;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;
    vNormal = (invTMatrix * vec4(normal, 0.0)).xyz;
    vColor = color;

    gl_Position = mvpMatrix * vec4(position, 1.0);
}