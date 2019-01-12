#version 300 es
precision highp float;

uniform vec3 lightPosition;
uniform vec3 eyePosition;
uniform sampler2D texture2dSampler;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 outColor;

void main(void) {
  vec3 nNormal = normalize(vNormal);
  vec3 light = normalize(lightPosition - vPosition);
  vec3 eye = normalize(eyePosition - vPosition);
  vec3 ref = normalize(reflect(-light, nNormal));

  float diffuse = max(dot(light, nNormal), 0.2);
  float specular = max(dot(eye, ref), 0.0);
  specular = pow(specular, 20.0);

  vec4 sampleColor = texture(texture2dSampler, vTexCoord * 2.0);

  outColor = vec4(sampleColor.rgb * diffuse + specular, sampleColor.a);
}