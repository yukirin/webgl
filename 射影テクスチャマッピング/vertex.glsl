
attribute vec3 position;
attribute vec4 color;
attribute vec3 normal;

uniform mat4 mMatrix;
uniform mat4 tMatrix;
uniform mat4 mvpMatrix;

varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec4 vTexCoord;

void main(void) {
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;

    vNormal = normal;
    vColor = color;
    vTexCoord = tMatrix * vec4(vPosition, 1.0);

    gl_Position = mvpMatrix * vec4(position, 1.0);
}