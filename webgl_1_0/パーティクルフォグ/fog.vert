
attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;

uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
uniform mat4 tMatrix;

varying vec4 vPosition;
varying vec4 vColor;
varying vec2 vTexCoord;
varying vec4 vTexProjCoord;

void main(void) {
  vec3 pos = (mMatrix * vec4(position, 1.0)).xyz;
  vPosition = mvpMatrix * vec4(position, 1.0);
  vColor = color;
  vTexCoord = texCoord;
  vTexProjCoord = tMatrix * vPosition;

  gl_Position = vPosition;
}