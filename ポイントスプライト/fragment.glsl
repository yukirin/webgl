
precision mediump float;

uniform sampler2D texture;
uniform int useTexture;

varying vec4 vColor;

void main(void) {
    vec4 smpColor = vec4(1.0);

    if (bool(useTexture)) {
        smpColor = texture2D(texture, gl_PointCoord);
    }

    if (smpColor.a == 0.0) {
        discard;
    } else {
        gl_FragColor = vColor * smpColor;
    }
}