
precision mediump float;

uniform samplerCube cubeTexture;
uniform vec3 eyePosition;
uniform bool reflection;

varying vec4 vColor;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec3 ref;

    if (reflection) {
        ref = reflect(normalize(vPosition - eyePosition), normalize(vNormal));
    } else {
        ref = normalize(vNormal);
    }

    vec4 envColor = textureCube(cubeTexture, ref);
    vec4 destColor = vColor * envColor;

    gl_FragColor = destColor;
}