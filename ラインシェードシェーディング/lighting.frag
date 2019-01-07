precision mediump float;

uniform float lineScale;

varying vec4 vColor;
varying float vDiffuse;

void main(void) {
  vec2 v = gl_FragCoord.xy * lineScale * 0.5;
  float f = max(sin(v.x + v.y), 0.0);
  float g = max(sin(v.x - v.y), 0.0);

  float s;
  if (vDiffuse > 0.6) {
    s = 0.8;
  } else if (vDiffuse > 0.1) {
    s = 0.6 - pow(f, 5.0);
  } else {
    s = 0.4 - (pow(f, 5.0) + pow(g, 5.0));
  }

  gl_FragColor = vec4(vColor.rgb * s, 1.0);
}