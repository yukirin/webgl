
#extension GL_EXT_frag_depth : enable

precision mediump float;

varying vec3 vColor;

void main(void) { gl_FragColor = vec4(vColor, 1.0); }