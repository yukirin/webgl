
#extension GL_EXT_frag_depth : enable

precision mediump float;

uniform sampler2D texture;
uniform float strength;

varying vec2 vTexCoord;

const float tFrag = 1.0 / 1024.0;
const float nFrag = 1.0 / 30.0;
const vec2 centerOffset = vec2(512.0, 512.0);

float rnd(vec3 scale, float seed) { return fract(sin(dot(gl_FragCoord.stp + seed, scale)) * 43758.5433 + seed); }

void main(void) {
  vec3 destColor = vec3(0.0);
  float random = rnd(vec3(12.9898, 78.233, 151.7182), 0.0);

  vec2 fc = gl_FragCoord.st;
  vec2 fcc = fc - centerOffset;
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