
attribute float index;

uniform mat4 mvpMatrix;
uniform sampler2D texture;

const float frag = 1.0 / 16.0;
const float texShift = 0.5 * frag;

void main(void) {
  float pu = fract(index * frag + texShift);
  float pv = floor(index * frag) * frag + texShift;

  vec3 tPosition = texture2D(texture, vec2(pu, pv)).rgb * 2.0 - 1.0;

  gl_Position = mvpMatrix * vec4(tPosition, 1.0);
  gl_PointSize = 16.0;
}