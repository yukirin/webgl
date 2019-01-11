
#extension GL_EXT_frag_depth : enable

precision mediump float;

uniform sampler2D texture;

varying vec2 vTexCoord;

void main(void) { gl_FragColor = texture2D(texture, vTexCoord); }