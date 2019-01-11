#extension GL_EXT_draw_buffers : enable

precision mediump float;

varying vec4 vDest;
varying vec4 vColor;
varying vec3 vNormal;
varying float vDepth;

const float zNear = 0.1;
const float zFar = 10.0;

float linearDepth(float depth) {
  float a = 2.0 * zNear;
  float b = zFar + zNear - depth * (zFar - zNear);

  return a / b;
}

void main(void) {
  gl_FragData[0] = vDest;
  gl_FragData[1] = vColor;
  gl_FragData[2] = vec4((vNormal + 1.0) / 2.0, 1.0);

  float linearD = linearDepth(vDepth * 0.5 + 0.5);
  gl_FragData[3] = vec4(vec3(linearD), 1.0);
}