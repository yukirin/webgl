#extension GL_EXT_draw_buffers : enable

precision mediump float;

uniform vec2 resolution;
uniform vec2 offsetCoord[9];
uniform float weight[9];
uniform sampler2D textureColor;
uniform sampler2D textureDepth;
uniform sampler2D textureNormal;

varying vec2 vTexCoord;

void main(void) {
  vec2 offsetScale = 1.0 / resolution;
  vec4 destColor = texture2D(textureColor, vTexCoord);
  vec3 normalColor = vec3(0.0);
  vec3 tmpColor = vec3(1.0);

  float depthEdge = 0.0;
  float normalEdge = 0.0;

  for (int i = 0; i < 9; i++) {
    vec2 offset = vTexCoord + offsetCoord[i] * offsetScale;
    depthEdge += texture2D(textureDepth, offset).r * weight[i];
    normalColor += texture2D(textureNormal, offset).rgb * weight[i];
  }

  normalEdge = dot(abs(normalColor), tmpColor) / 3.0;

  if (abs(depthEdge) > 0.02) {
    depthEdge = 1.0;
  } else {
    depthEdge = 0.0;
  }

  if (normalEdge > 0.02) {
    normalEdge = 1.0;
  } else {
    normalEdge = 0.0;
  }

  float edge = (1.0 - depthEdge) * (1.0 - normalEdge);

  gl_FragColor = vec4(destColor.rgb * edge, destColor.a);
}