
precision mediump float;

uniform bool depthBuffer;

varying vec4 vPosition;

void main(void) {
  float depth = (vPosition.z / vPosition.w + 1.0) * 0.5;
  gl_FragColor = vec4(vec3(depth), 1.0);
}