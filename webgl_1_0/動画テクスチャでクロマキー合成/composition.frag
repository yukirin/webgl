precision mediump float;

uniform sampler2D texture;
uniform float difference;

varying vec2 vTexCoord;

const vec3 chromakeyColor = vec3(0.0, 1.0, 0.0);

void main(void) {
  vec4 smpColor = texture2D(texture, vTexCoord);
  float diff = length(chromakeyColor - smpColor.rgb);

  if (diff < difference) {
    discard;
  } else {
    gl_FragColor = smpColor;
  }
}