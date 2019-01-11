
precision mediump float;

uniform sampler2D texture0;
uniform int useTexture;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vec4 destColor = vColor;

    if (bool(useTexture)) {
        vec4 smpColor = texture2D(texture0, vTextureCoord);
        destColor *= smpColor;
    }
    
    gl_FragColor = destColor;
}