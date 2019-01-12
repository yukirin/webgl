#version 300 es
precision highp float;

uniform sampler2D texture2dSampler;

in vec2 vTexCoord;

out vec4 outColor;

void main(void) {
  vec4 sampleColor = texture(texture2dSampler, vTexCoord);

  outColor = sampleColor;
}