
precision mediump float;

uniform sampler2D texture;

varying vec4 vColor;
varying vec4 vTexCoord;

void main(void) {
    vec4 smpColor = texture2DProj(texture, vTexCoord);

    gl_FragColor = vColor * smpColor;
}