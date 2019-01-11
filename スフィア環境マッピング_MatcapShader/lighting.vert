
attribute vec3 position;
attribute vec3 normal;

uniform mat4 mvpMatrix;
uniform mat4 mvInvTMatrix;

varying vec3 vNormal;

void main() {
  vNormal = normalize((mvInvTMatrix * vec4(normal, 0.0)).xyz);

  gl_Position = mvpMatrix * vec4(position, 1.0);
}