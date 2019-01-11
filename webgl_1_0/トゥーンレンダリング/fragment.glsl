
precision mediump float;

uniform mat4 invTMatrix;
uniform vec3 lightDirection;
uniform sampler2D texture;
uniform vec4 edgeColor;

varying vec4 vColor;
varying vec3 vNormal;

void main(void) {
    vec3 normal = normalize(vNormal);
    vec3 nLightDirection = normalize(lightDirection);

    if (edgeColor.a > 0.0) {
        gl_FragColor = edgeColor;
    } else {
        vec3 wNormal = normalize(invTMatrix * vec4(normal, 0.0)).xyz;
        float diffuse = clamp(dot(wNormal, nLightDirection), 0.0, 1.0);
        vec4 smpColor = texture2D(texture, vec2(diffuse, 0.0));

        gl_FragColor = vColor * smpColor;
    }
}