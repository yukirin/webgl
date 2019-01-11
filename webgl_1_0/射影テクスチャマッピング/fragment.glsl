
precision mediump float;

uniform mat4 invTMatrix;
uniform vec3 lightPosition;
uniform sampler2D texture;

varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;
varying vec4 vTexCoord;

void main(void) {
    vec3 wNormal = normalize((invTMatrix * vec4(vNormal, 0.0)).xyz);
    vec3 nLightDirection = normalize(lightPosition - vPosition);

    float diffuse = clamp(dot(wNormal, nLightDirection), 0.1, 1.0);
    vec4 smpColor = texture2DProj(texture, vTexCoord);

    gl_FragColor = vColor * vec4(vec3(diffuse), 1.0) * smpColor;
}