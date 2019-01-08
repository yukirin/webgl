precision mediump float;

uniform vec2 resolution;

void main(void) {
  vec2 p = (gl_FragCoord.xy / resolution) * 2.0 - 1.0;

  gl_FragColor = vec4(p, 0.0, 0.0);
}