precision mediump float;

uniform sampler2D texture;
uniform int useTexture;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vec4 destColor = vec4(0.0);

    if (bool(useTexture)) {
        vec4 smpColor = texture2D(texture, vTextureCoord);
        destColor = vColor * smpColor;
    } else {
        destColor = vColor;
    }
    gl_FragColor = destColor;
}