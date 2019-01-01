
#extension GL_EXT_frag_depth : enable

precision mediump float;

uniform sampler2D texture;
uniform bool diff;

varying vec4 projTexCoord;

const float zNear = 0.1;
const float zFar = 5.0;

float linearDepth(float depth) {
  float a = 2.0 * zNear;
  float b = zFar + zNear - depth * (zFar - zNear);

  return a / b;
}

void main(void) {
  float depth = linearDepth(gl_FragCoord.z);

  if (!diff) {
    gl_FragDepthEXT = gl_FragCoord.z;
    gl_FragColor = vec4(vec3(depth), 1.0);
    return;
  }

  float farDepth = linearDepth(texture2DProj(texture, projTexCoord).r);
  float diffDepth = farDepth - depth;

  gl_FragDepthEXT = diffDepth;
  gl_FragColor = vec4(vec3(diffDepth), 1.0);
}