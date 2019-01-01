
attribute vec3 position;

uniform mat4 mvpMatrix;
uniform mat4 tMatrix;

varying vec4 projTexCoord;

void main(void) {
  vec4 pos = mvpMatrix * vec4(position, 1.0);

  projTexCoord = tMatrix * pos;
  gl_Position = pos;
}