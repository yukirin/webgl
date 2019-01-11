
precision mediump float;

uniform sampler2D texture;

varying vec3 vNormal;

void main(void) {
  vec3 nNormal = normalize(vNormal);
  vec2 texCoord = (nNormal.xy + 1.0) / 2.0;
  vec4 smpColor = texture2D(texture, vec2(texCoord.s, 1.0 - texCoord.t));

  gl_FragColor = smpColor;
}