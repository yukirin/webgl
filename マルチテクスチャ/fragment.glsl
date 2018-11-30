
precision mediump float;

uniform sampler2D texture0;
uniform sampler2D texture1;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vec4 smpColor0 = texture2D(texture0, vTextureCoord);
    vec4 smpColor1 = texture2D(texture1, vTextureCoord);
    
    gl_FragColor = vColor * smpColor0 * smpColor1;
}