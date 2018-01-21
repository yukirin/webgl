attribute vec3 position;
attribute vec4 color;
attribute vec2 textureCoord;

uniform mat4 mvpMatrix;
uniform float vertexAlpha;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    vColor = vec4(color.rgb, color.a * vertexAlpha);
    vTextureCoord = textureCoord;
    
    gl_Position = mvpMatrix * vec4(position, 1.0);
}