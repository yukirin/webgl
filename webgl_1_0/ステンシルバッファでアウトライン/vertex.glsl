
attribute vec3 position;
attribute vec4 color;
attribute vec2 textureCoord;
attribute vec3 normal;

uniform mat4 mvpMatrix;
uniform mat4 invMatrix;
uniform vec3 lightDirection;
uniform bool useLight;
uniform bool outLine;

varying vec4 vColor;
varying vec2 vTextureCoord;

void main(void) {
    if (useLight) {
        vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
        float diffuse = clamp(dot(normal, invLight), 0.1, 1.0);
        vColor = color * vec4(vec3(diffuse), 1.0);
    } else {
        vColor = color;
    }

    vTextureCoord  = textureCoord;
    vec3 oPosition = position;
    if (outLine) {
        oPosition += normal * 0.1;
    }

    gl_Position = mvpMatrix * vec4(oPosition, 1.0);
}