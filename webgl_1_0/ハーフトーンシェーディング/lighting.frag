precision mediump float;

uniform float dotScale;

varying vec4 vColor;
varying float vDiffuse;

void main(void) {
  vec2 v = gl_FragCoord.xy * dotScale;
  float f = (sin(v.x) * 0.5 + 0.5) + (sin(v.y) * 0.5 + 0.5);

  float s;
  if (vDiffuse > 0.6) {
    s = 1.0;
  } else if (vDiffuse > 0.2) {
    s = 0.6;
  } else {
    s = 0.4;
  }

  gl_FragColor = vec4(vColor.rgb * (vDiffuse + vec3(f)) * s, 1.0);
}