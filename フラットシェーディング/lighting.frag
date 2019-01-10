#extension GL_EXT_draw_buffers : enable
#extension GL_OES_standard_derivatives : enable

precision mediump float;

uniform vec3 lightDirection;

varying vec4 vColor;
varying vec4 vPosition;

void main(void) {
  vec3 dx = dFdx(vPosition.xyz);
  vec3 dy = dFdy(vPosition.xyz);
  vec3 n = normalize(cross(normalize(dx), normalize(dy)));

  vec3 light = normalize(lightDirection);
  float diff = clamp(dot(n, light), 0.1, 1.0);

  gl_FragColor = vec4(vColor.rgb * diff, 1.0);
}