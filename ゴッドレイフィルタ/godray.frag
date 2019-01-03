
#extension GL_EXT_frag_depth : enable

precision mediump float;

uniform sampler2D texture;
uniform float strength;
uniform vec2 center;

varying vec2 vTexCoord;

const float tFrag = 1.0 / 2048.0;
const float nFrag = 1.0 / 30.0;

float rnd(vec3 scale, float seed) { return fract(sin(dot(gl_FragCoord.stp + seed, scale)) * 43758.5433 + seed); }

void main(void) {
  vec3 destColor = vec3(0.0);
  float random = rnd(vec3(12.9898, 78.233, 151.7182), 0.0);

  vec2 fc = vec2(gl_FragCoord.s, 2048.0 - gl_FragCoord.t);
  vec2 fcc = fc - center;
  float totalWeight = 0.0;

  for (float i = 0.0; i < 30.0; i++) {
    float percent = (i + random) * nFrag;
    float weight = percent - percent * percent;

    vec2 t = fc - fcc * percent * strength * nFrag;

    destColor += texture2D(texture, t * tFrag).rgb * weight;
    totalWeight += weight;
  }

  gl_FragColor = vec4(destColor / totalWeight, 1.0);
}