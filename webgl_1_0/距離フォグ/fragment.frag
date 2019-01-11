precision mediump float;

uniform vec4 fogColor;

varying vec4 vColor;
varying float fogFactor;

void main(void) { gl_FragColor = mix(fogColor, vColor, fogFactor); }