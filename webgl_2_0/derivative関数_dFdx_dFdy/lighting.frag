#version 300 es
precision highp float;

uniform vec3 lightPosition;
uniform vec3 eyePosition;
uniform sampler2D texture2dSampler;

in vec3 vPosition;
flat in vec3 vNormal;
in vec2 vTexCoord;

layout(location = 0) out vec4 outdNormal;
layout(location = 1) out vec4 outFlatNormal;

void main(void) {
  vec3 nNormal = normalize(vNormal);
  vec3 light = normalize(lightPosition - vPosition);
  vec3 eye = normalize(eyePosition - vPosition);
  vec3 ref = normalize(reflect(-light, nNormal));

  float diffuse = max(dot(light, nNormal), 0.2);
  float specular = max(dot(eye, ref), 0.0);
  specular = pow(specular, 20.0);

  vec4 sampleColor = texture(texture2dSampler, vTexCoord);
  sampleColor = vec4(1.0, 1.0, 1.0, 1.0);

  vec3 dx = dFdx(vPosition);
  vec3 dy = dFdy(vPosition);
  vec3 n = normalize(cross(normalize(dx), normalize(dy)));
  outdNormal = vec4(n, 1.0);
  outFlatNormal = vec4(nNormal, 1.0);
}