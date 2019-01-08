
attribute vec2 position;

uniform float pointSize;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = pointSize;
}