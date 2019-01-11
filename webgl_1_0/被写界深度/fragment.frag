precision mediump float;

uniform sampler2D texture;

varying vec4 vColor;
varying vec2 vTexCoord;

void main(void) { gl_FragColor = vColor * texture2D(texture, vTexCoord); }