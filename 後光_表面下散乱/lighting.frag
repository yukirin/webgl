precision mediump float;

uniform sampler2D blurTexture;

varying vec4 vColor;
varying vec4 vTexCoord;
varying float vDotLE;

const vec3 throughColor = vec3(1.0, 0.5, 0.2);

void main(void) {
  float bDepth = pow(1.0 - texture2DProj(blurTexture, vTexCoord).r, 20.0);
  vec3 through = throughColor * vDotLE * bDepth;

  gl_FragColor = vec4(vColor.rgb + through, vColor.a);
}