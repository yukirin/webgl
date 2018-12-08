
precision mediump float;

uniform vec3 eyePosition;
uniform samplerCube cubeTexture;
uniform bool reflection;

varying vec4 vColor;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec3 ref;
    if (reflection) {
        ref = reflect(vPosition - eyePosition, vNormal);
    } else {
        ref = vNormal;
    }

    vec4 envColor = textureCube(cubeTexture, ref);
    vec4 destColor = vColor * envColor;

    gl_FragColor = destColor;
}