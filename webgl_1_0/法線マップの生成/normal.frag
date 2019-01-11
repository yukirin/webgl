precision mediump float;

uniform sampler2D texture;
uniform float scale;

varying vec2 vTexCoord;

const float textureResolution = 256.0;
const vec3 luminanceCoef = vec3(0.298912, 0.586611, 0.114478);

float getLuminance(vec4 color) { return dot(color.rgb, luminanceCoef); }

void main(void) {
  vec2 shiftU = vec2(1.0 / textureResolution, 0.0);
  vec2 shiftV = vec2(0.0, 1.0 / textureResolution);

  float nextU = getLuminance(texture2D(texture, vTexCoord + shiftU)) * 2.0 - 1.0;
  float prevU = getLuminance(texture2D(texture, vTexCoord - shiftU)) * 2.0 - 1.0;
  float nextV = getLuminance(texture2D(texture, vTexCoord + shiftV)) * 2.0 - 1.0;
  float prevV = getLuminance(texture2D(texture, vTexCoord - shiftV)) * 2.0 - 1.0;

  float du = (nextU - prevU) * 0.5;
  float dv = (nextV - prevV) * 0.5;

  vec3 uVector = vec3(1.0, 0.0, du * scale);
  vec3 vVector = vec3(0.0, 1.0, -dv * scale);

  vec3 normalV = normalize(cross(uVector, vVector)) * 0.5 + 0.5;

  gl_FragColor = vec4(normalV, 1.0);
}