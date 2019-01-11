
attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 mvpMatrix;
uniform bool edge;

varying vec4 vColor;
varying vec3 vNormal;

void main(void) {
    vec3 pos = position;

    if (edge) {
        pos += normal * 0.05;
    }

    vNormal = normal;
    vColor = color;

    gl_Position = mvpMatrix * vec4(pos, 1.0);
}