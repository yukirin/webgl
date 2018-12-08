
precision mediump float;

uniform vec3 eyePosition;
uniform samplerCube cubeTexture;
uniform bool refraction;
uniform float eta;

varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vNormal;

void main(void) {
    vec3 ref;
    vec3 normal = normalize(vNormal);

    if (refraction) {
        ref = refract(normalize(vPosition - eyePosition), normal, eta);
    } else {
        ref = normal;
    }

    vec4 envColor = textureCube(cubeTexture, ref);
    vec4 destColor = vColor * envColor;

    gl_FragColor = destColor;
}