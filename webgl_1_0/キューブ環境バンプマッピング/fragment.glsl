
precision mediump float;

uniform vec3 eyePosition;
uniform sampler2D normalMap;
uniform samplerCube cubeTexture;
uniform bool reflection;

varying vec3 vPosition;
varying vec4 vColor;
varying vec2 vTextureCoord;
varying vec3 tNormal;
varying vec3 tTangent;

void main(void) {
    vec3 ref;
    if (reflection) {
        vec3 tBinormal = cross(tNormal, tTangent);
        mat3 mWorld = mat3(normalize(tTangent), normalize(tBinormal), normalize(tNormal));
        vec3 mNormal = mWorld * (texture2D(normalMap, vTextureCoord) * 2.0 - 1.0).rgb;

        ref = reflect(vPosition - eyePosition, mNormal);
    } else {
        ref = tNormal;
    }

    vec4 envColor = textureCube(cubeTexture, ref);
    vec4 destColor = vColor * envColor;

    gl_FragColor = destColor;
}