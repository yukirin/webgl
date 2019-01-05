
attribute vec3 position;
attribute float index;

varying vec3 vColor;

const float frag = 1.0 / 16.0;
const float texShift = 0.5 * frag;

void main(void) {
  vColor = (normalize(position) + 1.0) * 0.5;
  float pu = fract(index * frag) * 2.0 - 1.0;
  float pv = floor(index * frag) * frag * 2.0 - 1.0;

  gl_Position = vec4(pu + texShift, pv + texShift, 0.0, 1.0);
  gl_PointSize = 1.0;
}