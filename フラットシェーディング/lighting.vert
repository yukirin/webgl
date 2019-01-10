
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;

varying vec4 vColor;
varying vec4 vPosition;

void main() {
  vColor = color;
  vPosition = mMatrix * vec4(position, 1.0);

  gl_Position = mvpMatrix * vec4(position, 1.0);
}