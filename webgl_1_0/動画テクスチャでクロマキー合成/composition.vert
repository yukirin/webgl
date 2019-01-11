
attribute vec3 position;
attribute vec2 texCoord;
attribute vec4 color;

uniform mat4 mvpMatrix;

varying vec4 vColor;
varying vec2 vTexCoord;

void main(void) {
  vColor = color;
  vTexCoord = texCoord;

  gl_Position = mvpMatrix * vec4(position, 1.0);
}