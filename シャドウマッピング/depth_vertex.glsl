
attribute vec3 position;

uniform mat4 dvpMatrix;
uniform mat4 mMatrix;

varying vec4 vPosition;

void main(void){
	vPosition = dvpMatrix * mMatrix * vec4(position, 1.0);

	gl_Position = vPosition;
}