
#extension GL_EXT_frag_depth : enable

precision mediump float;

uniform sampler2D texture;

varying vec2 vTexCoord;

const vec2 viweport = vec2(1280, 720);
const float nFrag = 1.0 / 64.0;
const vec2 tFrag = 1.0 / viweport;

void main(void) {
  vec4 destColor = vec4(0.0);
  vec2 fc = gl_FragCoord.st;

  float offsetX = mod(fc.s, 8.0);
  float offsetY = mod(fc.t, 8.0);

  for (float x = 0.0; x <= 7.0; x += 1.0) {
    for (float y = 0.0; y <= 7.0; y += 1.0) {
      destColor += texture2D(texture, (fc + vec2(x - offsetX, y - offsetY)) * tFrag);
    }
  }

  gl_FragColor = destColor * nFrag;
}