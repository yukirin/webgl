#version 300 es
precision highp float;

layout(std140) uniform material { vec4 base; }
color;

out vec4 outColor;

void main(void) { outColor = color.base; }