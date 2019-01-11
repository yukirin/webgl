
precision mediump float;

uniform sampler2D depthT;
uniform sampler2D sceneT;
uniform sampler2D sBlurT;
uniform sampler2D bBlurT;
uniform float zNear;
uniform float zFar;
uniform float focusDepth;
uniform int result;

varying vec2 vTexCoord;

float linearDepth(float depth) {
  float a = 2.0 * zNear;
  float b = zFar + zNear - depth * (zFar - zNear);

  return a / b;
}

float adjustFocus(float depth) {
  float d = 1.0 - clamp(abs(depth - focusDepth), 0.0, 1.0);
  d = clamp(pow(d * 1.08, 4.0), 0.0, 1.0);
  return d;
}

void main(void) {
  vec2 coord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);
  float depth = linearDepth(texture2D(depthT, coord).r);
  float d = adjustFocus(depth);

  float coef = 1.0 - d;
  float sBlurCoef = coef * d;
  float bBluerCoef = coef * coef;

  vec4 sceneColor = texture2D(sceneT, coord);
  vec4 sBlurColor = texture2D(sBlurT, vTexCoord);
  vec4 bBlurColor = texture2D(bBlurT, vTexCoord);

  vec4 destColor = sceneColor * d + sBlurColor * sBlurCoef + bBlurColor * bBluerCoef;

  if (result == 0) {
    gl_FragColor = destColor;
  } else if (result == 1) {
    gl_FragColor = vec4(vec3(d), 1.0);
  } else if (result == 2) {
    gl_FragColor = sceneColor;
  } else if (result == 3) {
    gl_FragColor = sBlurColor;
  } else {
    gl_FragColor = bBlurColor;
  }
}