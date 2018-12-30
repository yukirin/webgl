
precision mediump float;

uniform vec2 offset;
uniform float distLength;
uniform sampler2D depthT;
uniform sampler2D noiseT;
uniform bool softParticle;

varying vec4 vPosition;
varying vec4 vColor;
varying vec2 vTexCoord;
varying vec4 vTexProjCoord;

const float zNear = 0.1;
const float zFar = 10.0;

float linearDepth(float depth) {
  float a = 2.0 * zNear;
  float b = zFar + zNear - depth * (zFar - zNear);

  return a / b;
}

void main(void) {
  float depth = linearDepth(texture2DProj(depthT, vTexProjCoord).r);
  float fogDepth = linearDepth(gl_FragCoord.z);
  vec4 noiseColor = texture2D(noiseT, vTexCoord + offset);

  float alpha = 1.0 - clamp(length(vec2(0.5, 1.0) - vTexCoord) * 2.0, 0.0, 1.0);

  if (softParticle) {
    float distance = abs(depth - fogDepth);
    float d = clamp(distance / distLength, 0.0, 1.0);
    alpha *= d;
  }
  gl_FragColor = vec4(vColor.rgb, noiseColor.r * alpha);
}